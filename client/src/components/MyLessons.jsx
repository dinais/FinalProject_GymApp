import React, { useEffect, useState, useContext } from 'react';
import { getRequest, postRequest } from '../Requests'; // וודאי שהנתיב לקובץ Requests נכון
import { CurrentUser } from './App'; // וודאי שהנתיב לקובץ App נכון
import '../css/gym-lessons.css'; // נשתמש באותו קובץ CSS

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
    try {
      const weekStart = getStartOfWeek(weekOffset);
      // שינוי כאן: קוראים רק לשיעורים שהמשתמש רשום אליהם (כולל רשימת המתנה אם תרצי להציג גם אותה)
      const res = await getRequest(`lessons/user/${currentUser.id}/registered?weekStart=${weekStart}`);
      setMyLessons(res.data || []);
    } catch (err) {
      console.error('Failed to fetch my lessons', err);
    }
  };

  const handleCancel = async (lessonId) => {
    try {
      // עדיין נשתמש ב-postRequest לביטול הרשמה
      await postRequest(`lessons/${lessonId}/cancel`, { userId: currentUser.id });
      // לאחר הביטול, נרענן את רשימת השיעורים שלי
      fetchMyLessons();
    } catch (err) {
      console.error('Failed to cancel lesson', err);
    }
  };

  useEffect(() => {
    fetchMyLessons();
  }, [weekOffset, currentUser.id]); // הוספתי את currentUser.id כתלות, למקרה שהמשתמש משתנה

  // פונקציה לקבלת צבע לפי סוג אימון - נשארת זהה
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
    return typeMap[type] || 'lesson-type-crossfit';
  };

  // פונקציה לקבלת טקסט השבוע הנוכחי - נשארת זהה
  const getCurrentWeekText = () => {
    const date = new Date();
    date.setDate(date.getDate() + weekOffset * 7);
    const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return `${startOfWeek.toLocaleDateString('he-IL')} - ${endOfWeek.toLocaleDateString('he-IL')}`;
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysInHebrew = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // נסנן את השיעורים לפי יום, אבל רק אלה שנמצאים ב-myLessons
  const lessonsByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = myLessons.filter(l => l.day === day);
    return acc;
  }, {});

  return (
    <>
      {/* אלמנטי הרקע - נשארים זהים */}
      <div className="background-container">
        <div className="background-blob blob-1"></div>
        <div className="background-blob blob-2"></div>
        <div className="background-blob blob-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="container">
        {/* כותרת */}
        <div className="header">
          <h1 className="main-title">💪 השיעורים שלי</h1> {/* שיניתי את הכותרת */}
          <p className="subtitle">האימונים אליהם נרשמת לשבוע הקרוב</p> {/* שיניתי את כותרת המשנה */}
        </div>

        {/* ניווט שבועות - נשאר זהה */}
        <div className="week-nav">
          <button className="nav-button" onClick={() => setWeekOffset(prev => prev - 1)}>
            <span className="arrow-left">←</span>
            שבוע קודם
          </button>

          <div className="week-display">
            <span className="calendar-icon">📅</span>
            {getCurrentWeekText()}
          </div>

          <button className="nav-button" onClick={() => setWeekOffset(prev => prev + 1)}>
            שבוע הבא
            <span className="arrow-right">→</span>
          </button>
        </div>

        {/* רשת הימים */}
        <div className="days-grid">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="day-column">
              {/* כותרת היום */}
              <div className="day-header">
                <h3 className="day-title">{daysInHebrew[index]}</h3>
                <p className="day-subtitle">{day}</p>
              </div>

              {/* קונטיינר האימונים */}
              <div className="lessons-container">
                {lessonsByDay[day]?.length > 0 ? (
                  <div className="lessons-list">
                    {lessonsByDay[day].map((lesson) => {
                      // ב"השיעורים שלי", כל שיעור המוצג הוא שיעור שהמשתמש רשום אליו (או ברשימת המתנה)
                      // לכן, לא צריך לבדוק isJoined או onWaitlist באותה צורה כמו ב-AllLessons
                      // נצטרך שהנתונים מהשרת יכללו את הסטטוס (רשום או ברשימת המתנה)
                      const isJoined = lesson.status === 'joined'; // נניח שהשרת יחזיר את הסטטוס
                      const onWaitlist = lesson.status === 'waitlist'; // נניח שהשרת יחזיר את הסטטוס
                      
                      // כאן נצטרך לשקול אם להציג מידע על registeredCounts ו-isFull.
                      // עבור "השיעורים שלי", אולי פחות רלוונטי להציג כמה נרשמו בסך הכל,
                      // אלא רק את הסטטוס הספציפי של המשתמש.
                      // אם את רוצה להמשיך להציג את הקיבולת הכוללת של השיעור,
                      // תצטרכי לדאוג שה-API יחזיר גם את ה-registered_counts עבור השיעורים הספציפיים האלה.
                      // כרגע, השארתי את הלוגיקה כדי שתוכלי להחליט.
                      const registeredCount = lesson.current_participants || 0; // נניח שהשרת יחזיר את מספר המשתתפים הנוכחי
                      const isFull = registeredCount >= lesson.max_participants;
                      const capacityPercentage = Math.min((registeredCount / lesson.max_participants) * 100, 100);


                      return (
                        <div
                          key={lesson.id}
                          className={`lesson-card ${isJoined ? 'joined' : ''} ${onWaitlist ? 'waitlist' : ''}`}
                        >
                          {/* כותרת סוג האימון - נשארת זהה */}
                          <div className={`lesson-type-header ${getLessonTypeClass(lesson.lesson_type)}`}>
                            {lesson.lesson_type}
                          </div>

                          {/* פרטי האימון - נשארים זהים */}
                          <div className="lesson-details">
                            <div className="lesson-info">
                              <div className="lesson-info-item">
                                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12,6 12,12 16,14" />
                                </svg>
                                <span>{lesson.hours}</span>
                              </div>

                              <div className="lesson-info-item">
                                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>חדר {lesson.room_number}</span>
                              </div>

                              {/* מידע על קיבולת - נשאר אם תבחרי להציג */}
                              <div className="capacity-info">
                                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                  <circle cx="9" cy="7" r="4" />
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span>{registeredCount} / {lesson.max_participants}</span>
                                <div className="capacity-bar">
                                  <div
                                    className={`capacity-fill ${isFull ? 'full' : ''}`}
                                    style={{ width: `${capacityPercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* סטטוס ופעולות - מותאם ל"השיעורים שלי" */}
                            <div className="lesson-actions">
                              {isJoined ? (
                                <>
                                  <div className="status-joined">
                                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                      <polyline points="22,4 12,14.01 9,11.01" />
                                    </svg>
                                    <span>רשום לאימון</span>
                                  </div>
                                  <button className="btn btn-danger" onClick={() => handleCancel(lesson.id)}>
                                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    ביטול הרשמה
                                  </button>
                                </>
                              ) : onWaitlist ? (
                                <>
                                  <div className="status-waitlist">
                                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10" />
                                      <polyline points="10,8 16,12 10,16" />
                                    </svg>
                                    <span>ברשימת המתנה</span>
                                  </div>
                                  <button className="btn btn-danger" onClick={() => handleCancel(lesson.id)}>
                                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18" />
                                      <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    ביטול המתנה
                                  </button>
                                </>
                              ) : (
                                // זהו מצב שלא אמור לקרות ב"השיעורים שלי" אם ה-API עובד נכון.
                                // אם שיעור מופיע, הוא אמור להיות או רשום או ברשימת המתנה.
                                // אפשר להשאיר את זה כ-fallback או להסיר.
                                <div className="status-unknown">
                                  <span>סטטוס לא ידוע</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-lessons">
                    <svg className="no-lessons-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p>לא נרשמת לאימונים בשבוע זה.</p>
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