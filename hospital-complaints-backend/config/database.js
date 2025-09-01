const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hospital_complaints_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Create database if it doesn't exist
const createDatabase = async () => {
  const tempConfig = { ...dbConfig, database: 'postgres' };
  const tempPool = new Pool(tempConfig);
  
  try {
    const result = await tempPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbConfig.database]
    );
    
    if (result.rows.length === 0) {
      await tempPool.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`Database '${dbConfig.database}' created successfully`);
    }
  } catch (error) {
    if (!error.message.includes('already exists')) {
      console.error('Error creating database:', error);
      throw error;
    }
  } finally {
    await tempPool.end();
  }
};

// Create tables
const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create departments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'staff', 'supervisor', 'manager', 'admin')),
        level INTEGER DEFAULT 1,
        department_id INTEGER REFERENCES departments(id),
        verified BOOLEAN DEFAULT FALSE,
        profile_data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create complaints table
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id VARCHAR(50) PRIMARY KEY,
        patient_id VARCHAR(50) NOT NULL REFERENCES users(id),
        department_id INTEGER NOT NULL REFERENCES departments(id),
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'جديدة' 
          CHECK (status IN ('جديدة', 'تحت المراجعة', 'قيد المعالجة', 'تم الحل', 'مرفوضة', 'متصعدة')),
        assigned_to VARCHAR(50) REFERENCES users(id),
        escalated BOOLEAN DEFAULT FALSE,
        escalation_level INTEGER DEFAULT 1,
        priority VARCHAR(10) DEFAULT 'متوسط' CHECK (priority IN ('عالي', 'متوسط', 'منخفض')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create complaint timeline table
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaint_timeline (
        id SERIAL PRIMARY KEY,
        complaint_id VARCHAR(50) NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        note TEXT,
        updated_by VARCHAR(50) REFERENCES users(id),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      )
    `);
    
    // Create attachments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        complaint_id VARCHAR(50) NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_by VARCHAR(50) REFERENCES users(id),
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create escalation settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS escalation_settings (
        id SERIAL PRIMARY KEY,
        department_id INTEGER REFERENCES departments(id),
        escalation_hours INTEGER DEFAULT 72,
        auto_escalation_enabled BOOLEAN DEFAULT TRUE,
        escalation_rules JSONB DEFAULT '{}',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create system logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(50),
        details JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id)',
      'CREATE INDEX IF NOT EXISTS idx_complaints_patient ON complaints(patient_id)',
      'CREATE INDEX IF NOT EXISTS idx_complaints_assigned ON complaints(assigned_to)',
      'CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status)',
      'CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department_id)',
      'CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_timeline_complaint ON complaint_timeline(complaint_id)',
      'CREATE INDEX IF NOT EXISTS idx_timeline_timestamp ON complaint_timeline(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_attachments_complaint ON attachments(complaint_id)',
      'CREATE INDEX IF NOT EXISTS idx_logs_user ON system_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON system_logs(timestamp)'
    ];
    
    for (const indexSQL of indexes) {
      await client.query(indexSQL);
    }
    
    // Create trigger for updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    
    const triggers = [
      'DROP TRIGGER IF EXISTS update_users_updated_at ON users',
      'CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()',
      'DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints',
      'CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()'
    ];
    
    for (const triggerSQL of triggers) {
      await client.query(triggerSQL);
    }
    
    console.log('Database tables created successfully');
  } finally {
    client.release();
  }
};

// Insert initial data
const insertInitialData = async () => {
  const client = await pool.connect();
  
  try {
    // Insert departments
    const departments = ['أشعة', 'طوارئ', 'مواعيد', 'المختبر', 'الصيدلية', 'الاستقبال'];
    
    for (const dept of departments) {
      await client.query(
        'INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [dept]
      );
    }
    
    // Insert users with hashed passwords
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    
    const users = [
      {
        id: '123456789',
        name: 'أحمد محمد',
        phone: '0501234567',
        password: '123456',
        role: 'patient',
        verified: true
      },
      {
        id: 'staff1',
        name: 'د. سارة أحمد',
        username: 'sara.ahmed',
        password: 'staff123',
        role: 'staff',
        level: 1,
        department_id: 1
      },
      {
        id: 'staff2',
        name: 'أ. محمد علي',
        username: 'mohamed.ali',
        password: 'staff123',
        role: 'staff',
        level: 1,
        department_id: 2
      },
      {
        id: 'super1',
        name: 'د. خالد الشمري',
        username: 'khalid.supervisor',
        password: 'super123',
        role: 'supervisor',
        level: 2,
        department_id: 1
      },
      {
        id: 'super2',
        name: 'د. فاطمة العتيبي',
        username: 'fatima.supervisor',
        password: 'super123',
        role: 'supervisor',
        level: 2,
        department_id: 2
      },
      {
        id: 'dm1',
        name: 'د. نورا المالكي',
        username: 'nora.manager',
        password: 'mgr123',
        role: 'manager',
        level: 3,
        department_id: 1
      },
      {
        id: 'dm2',
        name: 'د. سعد الغامدي',
        username: 'saad.manager',
        password: 'mgr123',
        role: 'manager',
        level: 3,
        department_id: 2
      },
      {
        id: 'admin1',
        username: 'admin',
        password: 'admin123',
        name: 'مدير النظام',
        role: 'admin',
        level: 4
      }
    ];
    
    // Hash passwords and insert users
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      
      await client.query(`
        INSERT INTO users (id, name, username, password_hash, phone, role, level, department_id, verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        user.id,
        user.name,
        user.username || null,
        hashedPassword,
        user.phone || null,
        user.role,
        user.level || 1,
        user.department_id || null,
        user.verified || false
      ]);
    }
    
    // Insert escalation settings
    for (let i = 1; i <= departments.length; i++) {
      await client.query(`
        INSERT INTO escalation_settings (department_id, escalation_hours)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [i, 72]);
    }
    
    console.log('Initial data inserted successfully');
  } finally {
    client.release();
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    await createDatabase();
    await createTables();
    await insertInitialData();
    console.log('Database initialization completed');
    return pool;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

// Helper function to execute queries
const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
  initializeDatabase
};