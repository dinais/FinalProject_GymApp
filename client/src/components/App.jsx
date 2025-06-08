import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import MyLessons from './MyLessons';
import AllLessons from './AllLessons';
import Messages from './Messages';
import Profile from './Profile';
import Favorites from './Favorites';
import Programs from './Programs';
import RoleSelector from './RoleSelector';
import InstructorsList from './InstructorsList';
import TraineesList from './TraineesList';
import Login from './Login';
import Register from './Register';

export const CurrentUser = createContext({});
export const Error = createContext({});

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);

  // מצב לשגיאות
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const savedRole = localStorage.getItem('selectedRole');
    if (user) setCurrentUser(user);
    if (savedRole) setCurrentRole(savedRole);
  }, []);

  useEffect(() => {
    if (currentUser && (!currentRole || currentRole === "")) {
      const roles = currentUser.roles || [];
      if (roles.length === 1) {
        setCurrentRole(roles[0]);
        localStorage.setItem("selectedRole", roles[0]);
      }
    }
  }, [currentUser, currentRole]);

  useEffect(() => {
  if (errorMessage) {
    const timer = setTimeout(() => setErrorMessage(''), 5000); // 5 שניות
    return () => clearTimeout(timer);
  }
}, [errorMessage, setErrorMessage]);

  return (
    <CurrentUser.Provider value={{ currentUser, setCurrentUser }}>
      <Error.Provider value={{ errorMessage, setErrorMessage }}>
        <Router>
          <Routes>
            {/* ברירת מחדל: אם אין משתמש, מפנים ל-login */}
            <Route
              path="/"
              element={
                currentUser ? (
                  currentRole ? (
                    <Navigate to="/home" replace />
                  ) : currentUser.roles.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center" }}>
                      <h2>המזכירה טרם הגדירה את תפקידך</h2>
                      <p>אנא המתן עד שהמזכירה תעדכן את תפקידך במערכת.</p>
                    </div>
                  ) : (
                    <RoleSelector
                      roles={currentUser.roles}
                      onSelect={(role) => {
                        setCurrentRole(role);
                        localStorage.setItem("selectedRole", role);
                      }}
                    />
                  )
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* דף הבית של המשתמש לפי תפקיד */}
            <Route
              path="/home"
              element={
                currentUser && currentRole ? (
                  <>
                    <Navbar username={currentUser.name} role={currentRole} />
                    <Routes>
                      <Route path="/my-lessons" element={<MyLessons />} />
                      <Route path="/all-lessons" element={<AllLessons />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/profile" element={<Profile />} />
                      {currentRole === "trainee" && (
                        <>
                          <Route path="/favorites" element={<Favorites />} />
                          <Route path="/programs" element={<Programs />} />
                        </>
                      )}
                      {currentRole === "secretary" && (
                        <>
                          <Route path="/all-instructors" element={<InstructorsList />} />
                          <Route path="/all-trainees" element={<TraineesList />} />
                        </>
                      )}
                      <Route path="/logout" element={<h2>Logged out</h2>} />
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
                currentUser ? (
                  <Navigate to="/home" replace />
                ) : (
                  <Login />
                )
              }
            />

            {/* עמוד הרשמה */}
            <Route
              path="/register"
              element={
                currentUser ? (
                  <Navigate to="/home" replace />
                ) : (
                  <Register />
                )
              }
            />

            {/* כל נתיב לא ידוע */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </Error.Provider>
    </CurrentUser.Provider>
  );
};

export default App;
