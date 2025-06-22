import React, { useState } from 'react';

// The icons used are from Feather Icons (https://feathericons.com/).
// You can include them as SVG directly or use a library.
// For simplicity, I'm keeping them as inline SVGs.

const LessonCard = ({ lesson, onJoin, onCancel, isJoined, onWaitlist, registeredCount, maxParticipants }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Helper to get lesson type class for coloring
    const getLessonTypeClass = (type) => {
        const typeMap = {
            'CrossFit': 'lesson-type-crossfit',
            'Yoga': 'lesson-type-yoga',
            'HIIT': 'lesson-type-hiit',
            'Pilates': 'lesson-type-pilates',
            'Boxing': 'lesson-type-boxing',
            'Spinning': 'lesson-type-spinning',
            'Zumba': 'lesson-type-zumba',
            'PowerLifting': 'lesson-type-powerlifting'
        };
        return typeMap[type] || 'lesson-type-default'; // Added a default
    };

    // Determine if the lesson is full
    const isFull = registeredCount >= maxParticipants;
    const capacityPercentage = Math.min((registeredCount / maxParticipants) * 100, 100);

    // Get registration status for AllLessons context
    const getRegistrationStatus = (lessonStartDateStr) => {
        const now = new Date();
        const startDate = new Date(lessonStartDateStr);
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (startDate < now) {
            return 'closed';
        } else if (startDate > oneWeekFromNow) {
            return 'not_open_yet';
        } else {
            return 'open';
        }
    };

    const regStatus = getRegistrationStatus(lesson.scheduled_at);

    // Determine which action button/status to show
    const renderActionButton = () => {
        if (regStatus === 'closed') {
            return (
                <div className="status-closed">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span>Closed</span>
                </div>
            );
        } else if (regStatus === 'not_open_yet') {
            return (
                <div className="status-not-open">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>Upcoming</span>
                </div>
            );
        } else { // Registration is 'open'
            if (isJoined) {
                return (
                    <button className="btn btn-cancel" onClick={(e) => { e.stopPropagation(); onCancel(lesson.id); }}>
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        <span>Cancel</span>
                    </button>
                );
            } else if (onWaitlist) {
                return (
                    <button className="btn btn-cancel-waitlist" onClick={(e) => { e.stopPropagation(); onCancel(lesson.id); }}>
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="10 8 16 12 10 16"></polyline></svg>
                        <span>Cancel Waitlist</span>
                    </button>
                );
            } else if (isFull) {
                return (
                    <button className="btn btn-waitlist" onClick={(e) => { e.stopPropagation(); onJoin(lesson.id); }}>
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="10 8 16 12 10 16"></polyline></svg>
                        <span>Join Waitlist</span>
                    </button>
                );
            } else {
                return (
                    <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onJoin(lesson.id); }}>
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                        <span>Join</span>
                    </button>
                );
            }
        }
    };

    return (
        <div
            className={`lesson-card ${isJoined ? 'joined' : ''} ${onWaitlist ? 'waitlist' : ''} ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)} // Toggle expansion on card click
        >
            <div className={`lesson-type-header ${getLessonTypeClass(lesson.lesson_type)}`}>
                {lesson.lesson_type}
            </div>

            <div className="lesson-basic-details">
                <div className="lesson-info-item">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12,6 12,12 16,14" />
                    </svg>
                    <span>{new Date(lesson.scheduled_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {!isExpanded && ( // Only show button when not expanded
                    <div className="lesson-action-compact">
                        {renderActionButton()}
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="lesson-expanded-details">
                    <div className="lesson-info-item">
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>Room {lesson.room_number}</span>
                    </div>

                    <div className="lesson-info-item">
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Capacity: {registeredCount} / {maxParticipants}</span>
                    </div>

                    <div className="capacity-bar">
                        <div
                            className={`capacity-fill ${isFull ? 'full' : ''}`}
                            style={{ width: `${capacityPercentage}%` }}
                        ></div>
                    </div>
                    
                    <div className="lesson-actions-expanded">
                        {renderActionButton()}
                    </div>
                    <button className="btn btn-close-card" onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default LessonCard;