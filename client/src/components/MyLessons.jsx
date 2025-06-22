import React, { useEffect, useState, useContext } from 'react';
import { getRequest, postRequest } from '../Requests';
import { CurrentUser } from './App';
import LessonCard from './LessonCard'; // Import the new LessonCard component
import '../css/gym-lessons.css';

function MyLessons() {
    const { currentUser } = useContext(CurrentUser);
    const [myLessons, setMyLessons] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0);

    const getStartOfWeek = (offset = 0) => {
        const now = new Date();
        const sunday = new Date(now.setDate(now.getDate() - now.getDay() + offset * 7));
        sunday.setHours(0, 0, 0, 0);
        return sunday.toISOString();
    };

    const fetchMyLessons = async () => {
        if (!currentUser || !currentUser.id) return; // Ensure currentUser and its ID exist
        try {
            const weekStart = getStartOfWeek(weekOffset);
            // Assuming API returns lessons the user is registered for,
            // with a 'status' field (e.g., 'joined', 'waitlist') and participant counts.
            const res = await getRequest(`lessons/user/${currentUser.id}/registered?weekStart=${weekStart}`);
            setMyLessons(res.data || []);
        } catch (err) {
            console.error('Failed to fetch my lessons', err);
            // Optionally set an error message in context
        }
    };

    const handleCancel = async (lessonId) => {
        try {
            await postRequest(`lessons/${lessonId}/cancel`, { userId: currentUser.id });
            fetchMyLessons(); // Re-fetch to update the list
        } catch (err) {
            console.error('Failed to cancel lesson', err);
            // Optionally set an error message in context
        }
    };

    useEffect(() => {
        fetchMyLessons();
    }, [weekOffset, currentUser?.id]); // Depend on currentUser.id to re-fetch if user changes

    const getCurrentWeekText = () => {
        const date = new Date();
        date.setDate(date.getDate() + weekOffset * 7);
        const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return `${startOfWeek.toLocaleDateString('he-IL')} - ${endOfWeek.toLocaleDateString('he-IL')}`;
    };

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // const daysInHebrew = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    const lessonsByDay = daysOfWeek.reduce((acc, day) => {
        acc[day] = myLessons.filter(l => l.day === day);
        return acc;
    }, {});

    return (
        <>
            <div className="background-container">
                <div className="grid-overlay"></div>
            </div>

            <div className="container">
                <div className="header">
                    {/* <h1 className="main-title">💪 My Classes</h1> Changed to English */}
                    <p className="subtitle">Your registered classes for the upcoming week</p> {/* Changed to English */}
                </div>

                <div className="week-nav">
                    <button className="nav-button" onClick={() => setWeekOffset(prev => prev - 1)}>
                        <span className="arrow-left">←</span>
                        Previous Week
                    </button>

                    <div className="week-display">
                        <span className="calendar-icon">📅</span>
                        {getCurrentWeekText()}
                    </div>

                    <button className="nav-button" onClick={() => setWeekOffset(prev => prev + 1)}>
                        Next Week
                        <span className="arrow-right">→</span>
                    </button>
                </div>

                <div className="days-grid">
                    {daysOfWeek.map((day, index) => (
                        <div key={day} className="day-column">
                            <div className="day-header">
                                {/* <h3 className="day-title">{daysInHebrew[index]}</h3> */}
                                <p className="day-subtitle">{day}</p>
                            </div>

                            <div className="lessons-container">
                                {lessonsByDay[day]?.length > 0 ? (
                                    <div className="lessons-list">
                                        {lessonsByDay[day].map((lesson) => (
                                            <LessonCard
                                                key={lesson.id}
                                                lesson={lesson}
                                                onCancel={handleCancel}
                                                isJoined={lesson.status === 'joined'} // Assuming status comes from API
                                                onWaitlist={lesson.status === 'waitlist'} // Assuming status comes from API
                                                registeredCount={lesson.current_participants || 0} // Assuming API provides this
                                                maxParticipants={lesson.max_participants}
                                                // Note: onJoin is not needed here as user is already registered/waitlisted
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-lessons">
                                        <svg className="no-lessons-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <p>No classes registered for this week.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default MyLessons;