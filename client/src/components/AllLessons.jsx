// src/components/AllLessons.jsx
import React, { useEffect, useState, useContext } from 'react';
import { getRequest, postRequest, putRequest, deleteRequest } from '../Requests';
import { CurrentUser, Error } from './App';
import LessonCard from './LessonCard';
import LessonFormModal from './LessonFormModal';
import '../css/gym-lessons.css';
import '../css/modal.css';
function AllLessons() {
  const { currentUser, currentRole } = useContext(CurrentUser);
  const { setErrorMessage, errorMessage } = useContext(Error);
  const [lessons, setLessons] = useState([]);
  const [clientLessonIds, setClientLessonIds] = useState([]);
  const [waitlistIds, setWaitlistIds] = useState([]);
  const [numOfRegistered, setNumOfRegistered] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [currentLessonToEdit, setCurrentLessonToEdit] = useState(null);
  const [allCoaches, setAllCoaches] = useState([]);

  useEffect(() => {
    fetchLessons();
    fetchCoaches();
  }, [weekOffset, currentUser?.id, currentRole]);

  const getStartOfWeek = (offset = 0) => {
    const now = new Date();
    const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const localSunday = new Date(localToday.setDate(localToday.getDate() - localToday.getDay()));
    localSunday.setDate(localSunday.getDate() + offset * 7);
    localSunday.setHours(0, 0, 0, 0);
    return localSunday.toISOString();
  };

  const fetchLessons = async () => {
    if (!currentUser || !currentUser.id) {
      setErrorMessage('User not authenticated.');
      return;
    }
    try {
      const weekStart = getStartOfWeek(weekOffset);
      const lessonsResponse = await getRequest(`lessons/week?weekStart=${weekStart}`);
      if (lessonsResponse.succeeded) {
        setLessons(lessonsResponse.data);
        setErrorMessage('');
      } else {
        setLessons([]);
        setErrorMessage(lessonsResponse.error);
      }

      if (currentRole === 'client') {
        const clientLessonsResponse = await getRequest(`lessons/user/${currentUser.id}/week?weekStart=${weekStart}`);
        setClientLessonIds(clientLessonsResponse.succeeded && clientLessonsResponse.data ? clientLessonsResponse.data.map(lesson => lesson.id) : []);
        const waitListResponse = await getRequest(`lessons/user/${currentUser.id}/waitlist?weekStart=${weekStart}`);
        setWaitlistIds(waitListResponse.succeeded && waitListResponse.data ? waitListResponse.data.map(lesson => lesson.id) : []);
      } else {//when the user is not a client (e.g., coach or secretary)
        setClientLessonIds([]);
        setWaitlistIds([]);
      }

      const numOfRegisteredResult = await getRequest(`lessons/registered_counts?weekStart=${weekStart}`);
      if (numOfRegisteredResult.succeeded) {
        setNumOfRegistered(numOfRegisteredResult.data || {});
      } else {
        setNumOfRegistered({});
      }

    }
    catch (err) {
      console.error('Failed to fetch lessons or user data:', err);
      setErrorMessage('Failed to load lessons. Please try again later.');
    }
  };

  // Functions for client actions (Join, Cancel)
  const handleJoin = async (lessonId) => {
    if (currentRole !== 'client') {
      setErrorMessage('Only clients can join lessons.');
      return;
    }
    setErrorMessage('');
    try {
      const res = await postRequest(`lessons/${lessonId}/join`, { userId: currentUser.id });
      if (res.succeeded) {
        if (res.data.status === 'joined') {
          setClientLessonIds(prev => [...prev, lessonId]);
          setWaitlistIds(prev => prev.filter(id => id !== lessonId));
        } else if (res.data.status === 'waitlist') {
          setWaitlistIds(prev => [...prev, lessonId]);
        }
        fetchLessons();
      } else {
        setErrorMessage(res.error);
      }
    } catch (err) {
      console.error('Failed to join lesson', err);
      setErrorMessage('Failed to join lesson. Please try again.');
    }
  };

  const handleCancel = async (lessonId) => {
    if (currentRole !== 'client') {
      setErrorMessage('Only clients can cancel lesson registrations.');
      return;
    }
    setErrorMessage('');
    try {
      const res = await postRequest(`lessons/${lessonId}/cancel`, { userId: currentUser.id });
      if (res.succeeded) {
        fetchLessons();
      } else {
        setErrorMessage(res.error);
      }
    } catch (err) {
      console.error('Failed to cancel lesson', err);
      setErrorMessage('Failed to cancel lesson. Please try again.');
    }
  };

  // Fetch coaches for the secretary - in order to manage the change of a lesson
  const fetchCoaches = async () => {
    if (currentRole === 'secretary') {
      const result = await getRequest('users/secretary/role/coach');
      if (result.succeeded) {
        setAllCoaches(result.data);
      } else {
        setErrorMessage(result.error);
      }
    }
  };
  // Functions for secretary actions (Add, Edit, Delete)
  const handleAddLessonClick = () => {
    setCurrentLessonToEdit(null);
    setErrorMessage('');
    setIsLessonModalOpen(true);
  };

  const handleEditLessonClick = (lesson) => {
    setCurrentLessonToEdit({
      ...lesson,
      coachId: lesson.instructor_id || (lesson.Instructor ? lesson.Instructor.id : '')
    });
    setErrorMessage('');
    setIsLessonModalOpen(true);
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }
    setErrorMessage('');
    try {
      const res = await deleteRequest(`lessons/${lessonId}`);
      if (res.succeeded) {
        setErrorMessage('');
        fetchLessons();
      } else {
        setErrorMessage(res.error);
      }
    } catch (err) {
      console.error('Failed to delete lesson', err);
      setErrorMessage('Failed to delete lesson. Please try again.');
    }
  };

  const handleLessonFormSubmit = async (formData) => {
    setErrorMessage('');
    let result;
    try {
      if (currentLessonToEdit) {
        result = await putRequest(`lessons/${currentLessonToEdit.id}`, formData);
      } else {
        result = await postRequest('lessons', formData);
      }
      if (result.succeeded) {
        setErrorMessage('');
        setIsLessonModalOpen(false);
        fetchLessons();
      } else {
        setErrorMessage(result.error || 'Failed to save lesson. Check server logs.');
      }
    } catch (err) {
      console.error('An unexpected error occurred while saving lesson:', err);
      setErrorMessage('An unexpected error occurred while saving lesson. Please try again.');
    }
  };

  const handleCloseLessonModal = () => {
    setIsLessonModalOpen(false);
    setCurrentLessonToEdit(null);
    setErrorMessage('');
  };

  const handleToggleFavorite = async (lessonId, shouldAdd) => {
    if (currentRole !== 'client') {
      setErrorMessage('Only clients can mark lessons as favorites.');
      return;
    }
    setErrorMessage('');
    try {
      const endpoint = `lessons/${lessonId}/favorite`;
      const res = shouldAdd ? await postRequest(endpoint, {}) : await deleteRequest(endpoint);
      if (res.succeeded) {
        fetchLessons();
      } else {
        setErrorMessage(res.error);
      }
    } catch (err) {
      console.error('Failed to toggle favorite status:', err);
      setErrorMessage('Failed to update favorite status. Please try again.');
    }
  };

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

  const lessonsByDay = lessons.reduce((acc, lesson) => {
    const day = lesson.day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(lesson);
    return acc;
  }, {});

  return (
    <>
      <div className="background-container">
        <div className="grid-overlay"></div>
      </div>

      <div className="container">
        <div className="header">
          <h1 className="main-title">💪 All Lessons</h1>
          <p className="subtitle">Browse and register for classes this week</p>
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

        <div className="control-row">
          {currentRole === 'secretary' && (
            <button className="add-button" onClick={handleAddLessonClick}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add New Lesson
            </button>
          )}
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="days-grid">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="day-column">
              <div className="day-header">
                <h3 className="day-title">{day}</h3>
              </div>

              <div className="lessons-container">
                {lessonsByDay[day]?.length > 0 ? (
                  <div className="lessons-list">
                    {lessonsByDay[day]
                      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                      .map((lesson) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          onJoin={handleJoin}
                          onCancel={handleCancel}
                          isJoined={clientLessonIds.includes(lesson.id)}
                          isOnWaitlist={waitlistIds.includes(lesson.id)}
                          numOfRegistered={numOfRegistered[lesson.id] || 0}
                          maxParticipants={lesson.max_participants}
                          currentRole={currentRole}
                          onEdit={handleEditLessonClick}
                          onDelete={handleDeleteLesson}
                          isFavorite={lesson.isFavorite || false}
                          onToggleFavorite={handleToggleFavorite}
                          currentUser={currentUser}
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
                    <p>No lessons available today.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <LessonFormModal
        isOpen={isLessonModalOpen}
        onClose={handleCloseLessonModal}
        onSubmit={handleLessonFormSubmit}
        initialData={currentLessonToEdit}
        errorMessage={errorMessage}
        loading={false}
        instructors={allCoaches}
      />
    </>
  );
}

export default AllLessons;
