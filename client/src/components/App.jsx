import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './Navbar';
import MyLessons from './MyLessons';
import AllLessons from './AllLessons';
import Messages from './Messages';
import Profile from './Profile';
import Favorites from './Favorites';
import RoleSelector from './RoleSelector';
import InstructorsList from './InstructorsList';
import TraineesList from './TraineesList';
import Login from './Login';
import Register from './Register';
import TrainingProgram from './TrainingProgram'; // חדש

// יצירת קונטקסטים
export const CurrentUser = createContext({});
export const Error = createContext({});

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // טעינת משתמש ותפקיד מה־localStorage בעת טעינת האפליקציה
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const savedRole = localStorage.getItem('selectedRole');
    if (user) setCurrentUser(user);
    if (savedRole) setCurrentRole(savedRole);
  }, []);

  // אם למשתמש יש תפקיד יחיד - נקבע אותו אוטומטית
  useEffect(() => {
    if (currentUser && (!currentRole || currentRole === '')) {
      const roles = currentUser.roles || [];
      if (roles.length === 1) {
        setCurrentRole(roles[0]);
        localStorage.setItem('selectedRole', roles[0]);
      }
    }
  }, [currentUser, currentRole]);

  // ניקוי הודעת שגיאה לאחר 5 שניות
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  return (
  <CurrentUser.Provider value={{ currentUser, setCurrentUser, currentRole, setCurrentRole }}>
    <Error.Provider value={{ errorMessage, setErrorMessage }}>
      <Router>
        <Routes>

          {/* דף הבית */}
          <Route
            path="/"
            element={
              currentUser ? (
                currentRole ? (
                  <Navigate to="/home/*" replace />
                ) : currentUser.roles.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2>המזכירה טרם הגדירה את תפקידך</h2>
                    <p>אנא המתן עד שהמזכירה תעדכן את תפקידך במערכת.</p>
                  </div>
                ) : (
                  <RoleSelector
                    roles={currentUser.roles}
                    onSelect={(role) => {
                      setCurrentRole(role);
                      localStorage.setItem('selectedRole', role);
                    }}
                  />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* עמוד הבית לפי תפקיד */}
          <Route
            path="/home/*"
            element={
              currentUser && currentRole ? (
                <>
                  <Navbar username={currentUser.first_name} role={currentRole} />
                  <Routes>
                    {/* משותפים */}
                    <Route path="my-lessons" element={<MyLessons />} />
                    <Route path="all-lessons" element={<AllLessons />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="profile" element={<Profile />} />

                    {/* ללקוח */}
                    {currentRole === 'client' && (
                      <Route path="favorites" element={<Favorites />} />
                    )}

                    {/* למאמן */}
                    {currentRole === 'coach' && (
                      <Route path="training-program" element={<TrainingProgram />} />
                    )}

                    {/* למזכירה */}
                    {currentRole === 'secretary' && (
                      <>
                        <Route path="all-instructors" element={<InstructorsList />} />
                        <Route path="all-trainees" element={<TraineesList />} />
                      </>
                    )}

                    {/* התנתקות */}
                    <Route path="logout" element={<h2>התנתקת מהמערכת</h2>} />
                  </Routes>
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* עמוד כניסה */}
          <Route
            path="/login"
            element={
              currentUser ? <Navigate to="/home" replace /> : <Login />
            }
          />

          {/* עמוד הרשמה */}
          <Route
            path="/register"
            element={
              currentUser ? <Navigate to="/home" replace /> : <Register />
            }
          />

          {/* כל נתיב לא קיים */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Error.Provider>
  </CurrentUser.Provider>
);

};

export default App;
