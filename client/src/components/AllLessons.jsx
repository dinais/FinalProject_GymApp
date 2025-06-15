import React, { useEffect, useState, useContext } from 'react';
import { getRequest, postRequest } from '../Requests';
import { CurrentUser } from './App';

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
    try {
      const weekStart = getStartOfWeek(weekOffset);
      const res = await getRequest(`lessons/week?weekStart=${weekStart}`);
      setLessons(res.data || []); // תיקון חשוב

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
      console.log(`Joining lesson ${lessonId} for user ${currentUser.id}`);
      
      const res = await postRequest(`lessons/${lessonId}/join`, { userId: currentUser.id });
      console.log(res);
      
      if (res.data.status === 'joined') {
        setMyLessonIds(prev => [...prev, lessonId]);
      } else if (res.data.status === 'waitlist') {
        setWaitlistIds(prev => [...prev, lessonId]);
      }
      fetchLessons();
    } catch (err) {
      console.error('Failed to join lesson', err);
    }
  };

  const handleCancel = async (lessonId) => {
    try {
      await postRequest(`lessons/${lessonId}/cancel`, { userId: currentUser.id });
      fetchLessons();
    } catch (err) {
      console.error('Failed to cancel lesson', err);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [weekOffset]);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const lessonsByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = lessons.filter(l => l.day === day); // safe now because lessons is always an array
    return acc;
  }, {});

  return (
    <div>
      <h1>All Lessons</h1>
      <button onClick={() => setWeekOffset(prev => prev - 1)}>Previous Week</button>
      <button onClick={() => setWeekOffset(prev => prev + 1)}>Next Week</button>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, 1fr)`, gap: '1rem', marginTop: '2rem' }}>
        {daysOfWeek.map(day => (
          <div key={day}>
            <h3>{day}</h3>
            {lessonsByDay[day]?.map((lesson) => {
              const isJoined = myLessonIds.includes(lesson.id);
              const onWaitlist = waitlistIds.includes(lesson.id);
              const registeredCount = registeredCounts[lesson.id] || 0;
              const isFull = registeredCount >= lesson.max_participants;

              return (
                <div key={lesson.id} style={{ border: '1px solid #ccc', padding: '5px', marginBottom: '5px' }}>
                  <strong>{lesson.lesson_type}</strong><br />
                  Room: {lesson.room_number}<br />
                  Hours: {lesson.hours}<br />
                  Capacity: {registeredCount} / {lesson.max_participants}<br />

                  {isJoined ? (
                    <>
                      <span style={{ color: 'green' }}>✔ Already joined</span><br />
                      <button onClick={() => handleCancel(lesson.id)}>Cancel</button>
                    </>
                  ) : onWaitlist ? (
                    <>
                      <span style={{ color: 'orange' }}>⏳ On Waitlist</span><br />
                      <button onClick={() => handleCancel(lesson.id)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {isFull ? (
                        <button disabled>Full - Join Waitlist</button>
                      ) : (
                        <button onClick={() => handleJoin(lesson.id)}>Join</button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllLessons;
