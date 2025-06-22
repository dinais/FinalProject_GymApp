import React, { useEffect, useState, useContext } from 'react';
import { getRequest, postRequest } from '../Requests';
import { CurrentUser } from './App';
import LessonCard from './LessonCard'; // Import the new LessonCard component
import '../css/gym-lessons.css';

function AllLessons() {
    const { currentUser } = useContext(CurrentUser);
    const [lessons, setLessons] = useState([]);
    const [myLessonIds, setMyLessonIds] = useState([]);
    const [waitlistIds, setWaitlistIds] = useState([]);
    const [registeredCounts, setRegisteredCounts] = useState({});
    const [weekOffset, setWeekOffset] = useState(0);

    const getStartOfWeek = (offset = 0) => {
        const now = new Date();
        const sunday = new Date(now.setDate(now.getDate() - now.getDay() + offset * 7));
        sunday.setHours(0, 0, 0, 0);
        return sunday.toISOString();
    };

    const fetchLessons = async () => {
        if (!currentUser || !currentUser.id) return;
        try {
            const weekStart = getStartOfWeek(weekOffset);
            const res = await getRequest(`lessons/week?weekStart=${weekStart}`);
            setLessons(res.data || []);

            const myRes = await getRequest(`lessons/user/${currentUser.id}/week?weekStart=${weekStart}`);
            setMyLessonIds(myRes.data ? myRes.data.map(lesson => lesson.id) : []);

            const waitlistRes = await getRequest(`lessons/user/${currentUser.id}/waitlist?weekStart=${weekStart}`);
            setWaitlistIds(waitlistRes.data ? waitlistRes.data.map(lesson => lesson.id) : []);

            const countsRes = await getRequest(`lessons/registered_counts?weekStart=${weekStart}`);
            setRegisteredCounts(countsRes.data || {});
        } catch (err) {
            console.error('Failed to fetch lessons', err);
        }
    };

    const handleJoin = async (lessonId) => {
        try {
            const res = await postRequest(`lessons/${lessonId}/join`, { userId: currentUser.id });
            if (res.data.status === 'joined') {
                setMyLessonIds(prev => [...prev, lessonId]);
                setWaitlistIds(prev => prev.filter(id => id !== lessonId)); // Remove from waitlist if joined
            } else if (res.data.status === 'waitlist') {
                setWaitlistIds(prev => [...prev, lessonId]);
            }
            fetchLessons(); // Re-fetch to update counts and statuses
        } catch (err) {
            console.error('Failed to join lesson', err);
        }
    };

    const handleCancel = async (lessonId) => {
        try {
            await postRequest(`lessons/${lessonId}/cancel`, { userId: currentUser.id });
            fetchLessons(); // Re-fetch to update counts and statuses
        } catch (err) {
            console.error('Failed to cancel lesson', err);
        }
    };

    useEffect(() => {
        fetchLessons();
    }, [weekOffset, currentUser?.id]);

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
        acc[day] = lessons.filter(l => l.day === day);
        return acc;
    }, {});

    return (
        <>
            <div className="background-container">
                <div className="grid-overlay"></div>
            </div>

            <div className="container">
                <div className="header">
                    {/* <h1 className="main-title">💪 All Classes</h1> Changed to English */}
                    <p className="subtitle">Browse and register for classes this week</p> {/* Changed to English */}
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
                                                onJoin={handleJoin}
                                                onCancel={handleCancel}
                                                isJoined={myLessonIds.includes(lesson.id)}
                                                onWaitlist={waitlistIds.includes(lesson.id)}
                                                registeredCount={registeredCounts[lesson.id] || 0}
                                                maxParticipants={lesson.max_participants}
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
                                        <p>No classes available today.</p>
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

export default AllLessons;