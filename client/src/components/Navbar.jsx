import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CurrentUser } from './App';

const Navbar = ({ username, role }) => {
  const { setCurrentUser } = useContext(CurrentUser);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('selectedRole');
    localStorage.removeItem('token');
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="navbar-welcome">שלום, {username} ({role})</span>
      </div>

      <div className="navbar-center">
        <Link to="/home/profile">אזור אישי</Link>
        <Link to="/home/messages">הודעות</Link>

        {/* ללקוח בלבד */}
        {role === 'client' && (
          <>
            <Link to="/home/my-lessons">השיעורים שלי</Link>
            <Link to="/home/all-lessons">מערכת שיעורים</Link>
            <Link to="/home/favorites">מועדפים</Link>
          </>
        )}

        {/* למאמן בלבד */}
        {role === 'coach' && (
          <>
            <Link to="/home/all-lessons">מערכת שיעורים</Link>
            <Link to="/home/training-program">מערכת אימון</Link>
          </>
        )}

        {/* למזכירה בלבד */}
        {role === 'secretary' && (
          <>
            <Link to="/home/all-instructors">רשימת מדריכים</Link>
            <Link to="/home/all-trainees">רשימת מתאמנים</Link>
            <Link to="/home/all-lessons">מערכת שיעורים</Link>
          </>
        )}
      </div>

      <div className="navbar-right">
        <button onClick={handleLogout}>התנתקות</button>
      </div>
    </nav>
  );
};

export default Navbar;
