import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AllLessons() {
  const [lessons, setLessons] = useState([]);
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
      const res = await axios.get(`/api/lessons/week?weekStart=${weekStart}`);
      setLessons(res.data);
    } catch (err) {
      console.error('Failed to fetch lessons', err);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [weekOffset]);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const lessonsByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = lessons.filter(l => l.day === day);
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
            {lessonsByDay[day]?.map((lesson) => (
              <div key={lesson.id} style={{ border: '1px solid #ccc', padding: '5px', marginBottom: '5px' }}>
                <strong>{lesson.lesson_type}</strong><br />
                Room: {lesson.room_number}<br />
                Hours: {lesson.hours}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AllLessons;
