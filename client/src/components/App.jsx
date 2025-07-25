import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import MyLessons from './MyLessons';
import AllLessons from './AllLessons';
import Messages from './Messages';
import Profile from './Profile';
import RoleSelector from './RoleSelector';
import InstructorsList from './InstructorsList';
import TraineesList from './TraineesList';
import Login from './Login';
import Register from './Register';
import TrainingProgram from './TrainingProgram';

export const CurrentUser = createContext({});
export const Error = createContext({});

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const savedRole = localStorage.getItem('selectedRole');

    if (user) {
      setCurrentUser(user);

      const roles = user.roles || [];

      if (savedRole && roles.includes(savedRole)) {
        setCurrentRole(savedRole);
      } else if (roles.length === 1) {
        const singleRole = roles[0];
        setCurrentRole(singleRole);
        localStorage.setItem('selectedRole', singleRole);
      } else {
        setCurrentRole(null);
        localStorage.removeItem('selectedRole');
      }
    }
  }, []);

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
            <Route
              path="/"
              element={
                (() => {
                  const user = JSON.parse(localStorage.getItem('currentUser'));
                  const selectedRole = localStorage.getItem('selectedRole');

                  if (!user) return <Navigate to="/login" replace />;
                  if (user.roles.length === 0) {
                    return (
                      <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <h2>The secretary has not assigned your role yet</h2>
                        <p>Please wait until the secretary updates your role in the system.</p>
                      </div>
                    );
                  }
                  if (!selectedRole) return <RoleSelector />;
                  return <Navigate to="/home" replace />;
                })()
              }
            />
            <Route
              path="/home/*"
              element={
                currentUser && currentRole ? (
                  <>
                    <Navbar username={currentUser.first_name} role={currentRole} />
                    <Routes>
                      <Route index element={<Navigate to="all-lessons" replace />} />
                      <Route path="my-lessons" element={<MyLessons />} />
                      <Route path="all-lessons" element={<AllLessons />} />
                      <Route path="messages" element={<Messages />} />
                      <Route path="profile" element={<Profile />} />
                      {currentRole === 'coach' && <Route path="training-program" element={<TrainingProgram />} />}
                      {currentRole === 'secretary' && (
                        <>
                          <Route path="all-instructors" element={<InstructorsList />} />
                          <Route path="all-trainees" element={<TraineesList />} />
                        </>
                      )}
                      <Route path="logout" element={<h2>logout</h2>} />
                    </Routes>
                  </>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={currentUser ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/RoleSelector" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </Error.Provider>
    </CurrentUser.Provider>
  );
};

export default App;
