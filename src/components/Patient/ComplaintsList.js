import React from 'react';
import { FileText } from 'lucide-react';
import { getStatusColor, formatDate } from '../../utils/helpers';

const ComplaintsList = ({ userComplaints }) => {
  const listStyles = {
    container: "fade-in",
    title: "text-xl font-bold mb-6",
    emptyState: "text-center py-8",
    emptyIcon: "mx-auto w-16 h-16 text-gray-300 mb-4",
    emptyText: "text-gray-500",
    complaintsGrid: "space-y-4",
    complaintCard: "bg-white rounded-lg shadow p-4 border-r-4 border-blue-500",
    complaintHeader: "flex justify-between items-start mb-3",
    complaintInfo: "space-y-1",
    complaintTitle: "font-semibold text-lg",
    complaintMeta: "text-sm text-gray-600",
    statusBadge: "px-3 py-1 rounded-full text-white text-sm",
    complaintDesc: "bg-gray-50 rounded p-3 mb-3",
    complaintText: "text-sm",
    timeline: "mt-4",
    timelineTitle: "font-medium mb-2",
    timelineList: "space-y-2",
    timelineItem: "flex items-center text-sm",
    timelineDot: "w-3 h-3 rounded-full ml-2",
    timelineStatus: "font-medium ml-2",
    timelineTime: "text-gray-500 ml-2",
    timelineNote: "text-gray-600"
  };

  return (
    <div className={listStyles.container}>
      <h2 className={listStyles.title}>شكاويّ المرسلة</h2>
      {userComplaints.length === 0 ? (
        <div className={listStyles.emptyState}>
          <FileText className={listStyles.emptyIcon} />
          <p className={listStyles.emptyText}>لم تقم بإرسال أي شكاوى بعد</p>
        </div>
      ) : (
        <div className={listStyles.complaintsGrid}>
          {userComplaints.map(complaint => (
            <div key={complaint.id} className={listStyles.complaintCard}>
              <div className={listStyles.complaintHeader}>
                <div className={listStyles.complaintInfo}>
                  <h3 className={listStyles.complaintTitle}>{complaint.subject}</h3>
                  <p className={listStyles.complaintMeta}>القسم: {complaint.department}</p>
                  <p className={listStyles.complaintMeta}>
                    تاريخ الإرسال: {formatDate(complaint.createdAt)}
                  </p>
                </div>
                <span className={`${listStyles.statusBadge} ${getStatusColor(complaint.status)}`}>
                  {complaint.status}
                </span>
              </div>
              
              <div className={listStyles.complaintDesc}>
                <p className={listStyles.complaintText}>{complaint.description}</p>
              </div>

              {/* Timeline */}
              <div className={listStyles.timeline}>
                <h4 className={listStyles.timelineTitle}>تتبع الشكوى:</h4>
                <div className={listStyles.timelineList}>
                  {complaint.timeline.map((event, index) => (
                    <div key={index} className={listStyles.timelineItem}>
                      <div className={`${listStyles.timelineDot} ${getStatusColor(event.status)}`}></div>
                      <span className={listStyles.timelineStatus}>{event.status}</span>
                      <span className={listStyles.timelineTime}>
                        {new Date(event.timestamp).toLocaleString('ar-SA')}
                      </span>
                      {event.note && <span className={listStyles.timelineNote}>- {event.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintsList;