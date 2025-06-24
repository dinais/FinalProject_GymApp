import React, { useEffect, useState, useContext } from 'react';
import { getRequest, postRequest, deleteRequest } from '../Requests';
import { CurrentUser, Error } from './App';
import LessonCard from './LessonCard';
import '../css/gym-lessons.css';

function MyLessons() {
    const { currentUser, currentRole } = useContext(CurrentUser);
    const { setErrorMessage, errorMessage } = useContext(Error);
    const [myLessons, setMyLessons] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const getStartOfWeek = (offset = 0) => {
        const now = new Date();
        const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // Calculate Sunday of the current week (local time)
        const localSunday = new Date(localToday.setDate(localToday.getDate() - localToday.getDay()));

        // Apply week offset
        localSunday.setDate(localSunday.getDate() + offset * 7);
        localSunday.setHours(0, 0, 0, 0); // Set to start of the day

        return localSunday.toISOString(); // Return as ISO string (UTC)
    };

    const fetchMyLessons = async () => {
        if (!currentUser || !currentUser.id) {
            setErrorMessage('User not authenticated.');
            return;
        }

        try {
            const weekStartISO = getStartOfWeek(weekOffset); 
            let res;
            console.log(`MyLessons: fetchMyLessons called. showFavoritesOnly is: ${showFavoritesOnly}. weekStartISO: ${weekStartISO}`); // Log 1

            if (showFavoritesOnly) {
                res = await getRequest(`lessons/user/favorites-by-week?weekStart=${weekStart}`);
                console.log(res.data);

            } else {
                res = await getRequest(`lessons/user/${currentUser.id}/registered?weekStart=${weekStart}`);
                console.log(res.data);
            }
if (res.succeeded) {
  // אם res.data הוא מערך - נשמור אותו, אחרת אם זה אובייקט - ננסה לקחת ממנו את המערך
  if (Array.isArray(res.data)) {
    setMyLessons(res.data);
  } else if (res.data && Array.isArray(res.data.data)) {
    // מקרה נדיר שבו res.data זה אובייקט עם שדה data, למשל
    setMyLessons(res.data.data);
  } else {
    // כל מצב אחר, ננרמל למערך ריק
    setMyLessons([]);
  }
} else {
  setMyLessons([]);
}

        } catch (err) {
            console.error('MyLessons: Failed to fetch my lessons due to network or unexpected error:', err);
            setErrorMessage('Failed to load your lessons. Please try again later.');
        }
    };

    const handleCancel = async (lessonId) => {
        setErrorMessage('');
        try {
            const res = await postRequest(`lessons/${lessonId}/cancel`, { userId: currentUser.id });
            if (res.succeeded) {
                fetchMyLessons();
            } else {
                setErrorMessage(res.error || 'Failed to cancel lesson.');
            }
        } catch (err) {
            console.error('Failed to cancel lesson', err);
            setErrorMessage('Failed to cancel lesson. Please try again.');
        }
    };

    const handleToggleFavorite = async (lessonId, shouldAdd) => {
        setErrorMessage('');
        try {
            const endpoint = `lessons/${lessonId}/favorite`;
            const res = shouldAdd ? await postRequest(endpoint, {}) : await deleteRequest(endpoint);
            if (res.succeeded) {
                fetchMyLessons(); // Re-fetch my lessons to update the view
            } else {
                setErrorMessage(res.error || 'Failed to update favorite status.');
            }
        } catch (err) {
            console.error('Failed to toggle favorite status:', err);
            setErrorMessage('Failed to update favorite status. Please try again.');
        }
    };

    useEffect(() => {
        if (currentRole === 'client') {
            fetchMyLessons();
        } else {
            setMyLessons([]);
            setErrorMessage('This page is only for clients.');
        }
    }, [weekOffset, currentUser?.id, currentRole, showFavoritesOnly]);

    const getCurrentWeekText = () => {
        const today = new Date();
        const startOfCurrentWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        startOfCurrentWeek.setHours(0, 0, 0, 0);

        const targetWeekStart = new Date(startOfCurrentWeek);
        targetWeekStart.setDate(startOfCurrentWeek.getDate() + weekOffset * 7);

        if (weekOffset === 0) {
            return 'This Week';
        } else if (weekOffset === 1) {
            return 'Next Week';
        } else if (weekOffset === -1) {
            return 'Last Week';
        } else if (weekOffset > 0) {
            return `In ${weekOffset} Weeks`;
        } else {
            return `${Math.abs(weekOffset)} Weeks Ago`;
        }
    };

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    console.log(myLessons," myLessons data fetched");
    
    const lessonsByDay = daysOfWeek.reduce((acc, day) => {
        acc[day] = myLessons.filter(l => l.day === day)
                            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
        return acc;
    }, {});

    return (
        <>
            <div className="background-container">
                <div className="grid-overlay"></div>
            </div>

            <div className="container">
                <div className="header">
                    <h1 className="main-title">💪 My Lessons</h1>
                    <p className="subtitle">Your registered classes for the upcoming week</p>
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

                {currentRole === 'client' && (
                    <div className="control-row-favorites">
                        <button
                            className={`filter-favorites-button ${showFavoritesOnly ? 'active' : ''}`}
                            onClick={() => setShowFavoritesOnly(prev => !prev)}
                        >
                            <svg
                                className="favorite-icon"
                                viewBox="0 0 24 24"
                                fill={showFavoritesOnly ? 'rgb(255, 77, 79)' : 'none'}
                                stroke={showFavoritesOnly ? 'rgb(255, 77, 79)' : 'currentColor'}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            {showFavoritesOnly ? 'Show All Lessons' : 'Show My Favorites'}
                        </button>
                    </div>
                )}

                {errorMessage && <p className="error-message">{errorMessage}</p>}

                {currentRole !== 'client' && !errorMessage && (
                    <div className="no-access-message">
                        <p>This page is only accessible to clients.</p>
                    </div>
                )}

                {currentRole === 'client' && (
                    <div className="days-grid">
                        {daysOfWeek.map((day, index) => (
                            <div key={day} className="day-column">
                                <div className="day-header">
                                    <h3 className="day-title">{day}</h3>
                                </div>

                                <div className="lessons-container">
                                    {lessonsByDay[day]?.length > 0 ? (
                                        <div className="lessons-list">
                                            {lessonsByDay[day].map((lesson) => (
                                                <LessonCard
                                                    key={lesson.id}
                                                    lesson={lesson}
                                                    onCancel={handleCancel}
                                                    isJoined={lesson.status === 'joined'}
                                                    isOnWaitlist={lesson.status === 'waitlist'}
                                                    numOfRegistered={lesson.current_participants || 0}
                                                    maxParticipants={lesson.max_participants}
                                                    currentRole={currentRole}
                                                    isFavorite={lesson.isFavorite || false}
                                                    onToggleFavorite={handleToggleFavorite}
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
                                            <p>{showFavoritesOnly ? 'No favorite classes for this week.' : 'No classes registered for this week.'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default MyLessons;
