// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MyLessons from './components/MyLessons';
import AllLessons from './components/AllLessons';
import Messages from './components/Messages';
import Profile from './components/Profile';
import Favorites from './components/Favorites';
import Programs from './components/Programs';
import RoleSelector from './components/RoleSelector';
import InstructorsList from './components/InstructorsList';
import TraineesList from './components/TraineesList';
const App = () => {
  const [roles, setRoles] = useState(["trainee", "instructor"]); 
  const [currentRole, setCurrentRole] = useState(null);

  if (!currentRole) {
    return <RoleSelector roles={roles} onSelect={setCurrentRole} />;
  }

  return (
    <Router>
      <Navbar username="User" role={currentRole} />
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
    </Router>
  );
};
export default App;

