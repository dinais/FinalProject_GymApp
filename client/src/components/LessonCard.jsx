import React, { useState } from 'react';

const LessonCard = ({ lesson, onJoin, onCancel, isJoined, isOnWaitlist, registeredCount, maxParticipants, currentRole, onEdit, onDelete, isFavorite, onToggleFavorite }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Console log to debug favorite status
    console.log(`LessonCard: Lesson ID ${lesson.id}, Type: ${lesson.lesson_type}, isFavorite (prop): ${isFavorite}`);

    // Helper function to get CSS class for lesson type
    const getLessonTypeClass = (type) => {
        const typeMap = {
            'CrossFit': 'lesson-type-crossfit',
            'Yoga': 'lesson-type-yoga',
            'HIIT': 'lesson-type-hiit',
            'Pilates': 'lesson-type-pilates',
            'Boxing': 'lesson-type-boxing',
            'Spinning': 'lesson-type-spinning',
            'Zumba': 'lesson-type-zumba',
            'PowerLifting': 'lesson-type-powerlifting',
            'Design & Sculpt': 'lesson-type-design-sculpt',
            'Dynamic Design': 'lesson-type-dynamic-design',
            'Moderate Pilates': 'lesson-type-moderate-pilates',
            'Senior Design': 'lesson-type-senior-design',
            'Core Strength': 'lesson-type-core-strength',
            'Aerobic & Dynamic Design': 'lesson-type-aerobic-dynamic-design',
            'Aerobic & Design': 'lesson-type-aerobic-design',
            'Strength & Fat Burn': 'lesson-type-strength-fat-burn',
            'Feldenkrais': 'lesson-type-feldenkrais',
            'Pilates Rehab': 'lesson-type-pilates-rehab',
            'Pilates & Stretch': 'lesson-type-pilates-stretch',
            'Kung Fu': 'lesson-type-kung-fu',
            'Design & Pilates': 'lesson-type-design-pilates',
            'Design HIT': 'lesson-type-design-hit',
            'Abdominal Rehab': 'lesson-type-abdominal-rehab',
            'Weight Training': 'lesson-type-weight-training',
            'Kickboxing / HIT': 'lesson-type-kickboxing-hit'
        };
        return typeMap[type] || 'lesson-type-default'; 
    };

    // Determine if the lesson is full
    const isFull = registeredCount >= maxParticipants;
    const capacityPercentage = Math.min((registeredCount / maxParticipants) * 100, 100);

    // Determine registration status based on lesson time
    const getRegistrationStatus = (lessonScheduledAtStr) => {
        const now = new Date();
        const scheduledDate = new Date(lessonScheduledAtStr); 

        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        if (isNaN(scheduledDate.getTime())) {
            console.error("Invalid scheduled_at date string:", lessonScheduledAtStr);
            return 'invalid_date';
        }

        if (scheduledDate < now) {
            return 'closed'; 
        } else if (scheduledDate > oneWeekFromNow) {
            return 'not_open_yet'; 
        } else {
            return 'open'; 
        }
    };

    const regStatus = getRegistrationStatus(lesson.scheduled_at);

    // Determine which action button/status to display for clients
    const renderActionButton = () => {
        if (currentRole !== 'client') {
            return null;
        }

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
        } else { 
            if (isJoined) {
                return (
                    <button className="btn btn-cancel" onClick={(e) => { e.stopPropagation(); onCancel(lesson.id); }}>
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        <span>Cancel</span>
                    </button>
                );
            } else if (isOnWaitlist) {
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

    // Display admin/secretary actions with icon-only buttons
    const renderSecretaryActions = (isExpandedView) => {
        if (currentRole === 'secretary') {
            if (regStatus === 'closed') {
                return (
                    <div className="secretary-actions status-closed">
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <span>Closed</span>
                    </div>
                );
            }

            return (
                <div className={isExpandedView ? "secretary-actions-expanded" : "secretary-actions-compact"}>
                    <button className="btn-icon btn-edit" onClick={(e) => { e.stopPropagation(); onEdit(lesson); }} title="Edit Lesson">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                    <button className="btn-icon btn-delete" onClick={(e) => { e.stopPropagation(); onDelete(lesson.id); }} title="Delete Lesson">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className={`lesson-card ${isJoined ? 'joined' : ''} ${isOnWaitlist ? 'waitlist' : ''} ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)} // Toggle expand state on card click
        >
            <div className={`lesson-type-header ${getLessonTypeClass(lesson.lesson_type)}`}>
                <span className="lesson-type-text">{lesson.lesson_type}</span> {/* Wrap text for flexbox */}
                {currentRole === 'client' && ( // Only show favorite icon for clients
                    <button 
                        className={`favorite-button ${isFavorite ? 'favorited' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(lesson.id, !isFavorite); }}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        {/* Heart icon (SVG) */}
                        <svg 
                            className="favorite-icon" 
                            viewBox="0 0 24 24" 
                            fill={isFavorite ? '#ff4d4f' : 'none'} 
                            stroke={isFavorite ? '#ff4d4f' : 'currentColor'} 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                )}
            </div>

            <div className="lesson-basic-details">
                <div className="lesson-info-item">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12,6 12,12 16,14" />
                    </svg>
                    <span>
                        {new Date(lesson.scheduled_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        })}
                    </span>
                </div>
                <div className="lesson-action-compact">
                    {currentRole === 'client' && renderActionButton()}
                    {currentRole === 'secretary' && !isExpanded && renderSecretaryActions(false)} 
                </div>
            </div>

            {isExpanded && (
                <div className="lesson-expanded-details">
                    <div className="lesson-info-item">
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{lesson.room_number}</span>
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

                    <div className="lesson-info-item">
                        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span>Coach: {lesson.Instructor ? `${lesson.Instructor.first_name} ${lesson.Instructor.last_name}` : 'N/A'}</span>
                    </div>

                    <div className="capacity-bar">
                        <div
                            className={`capacity-fill ${isFull ? 'full' : ''}`}
                            style={{ width: `${capacityPercentage}%` }}
                        ></div>
                    </div>

                    <div className="lesson-actions-expanded">
                        {currentRole === 'client' && renderActionButton()}
                        {currentRole === 'secretary' && renderSecretaryActions(true)} 
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
