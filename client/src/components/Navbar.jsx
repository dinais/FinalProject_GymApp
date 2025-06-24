import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CurrentUser } from './App';
import '../css/navbar.css';
const Navbar = ({ username, role }) => {
    const { setCurrentUser } = useContext(CurrentUser);
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('selectedRole');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setCurrentUser(null);
        navigate('/login');
    };
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };
    const isActiveLink = (path) => {
        return location.pathname.startsWith(path);
    };

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="navbar-brand">
                    GymApp
                </Link>
                <div className="navbar-links">
                    {role === 'client' && (
                        <>
                            <Link to="/home/my-lessons" className={isActiveLink("/home/my-lessons") ? "active" : ""}>My Lessons</Link>
                            <Link to="/home/all-lessons" className={isActiveLink("/home/all-lessons") ? "active" : ""}>Class Schedule</Link>
                            <Link to="/home/favorites" className={isActiveLink("/home/favorites") ? "active" : ""}>Favorites</Link>
                        </>
                    )}

                    {role === 'coach' && (
                        <>
                            <Link to="/home/all-lessons" className={isActiveLink("/home/all-lessons") ? "active" : ""}>Class Schedule</Link>
                            <Link to="/home/training-program" className={isActiveLink("/home/training-program") ? "active" : ""}>Training Program</Link>
                        </>
                    )}

                    {role === 'secretary' && (
                        <>
                            <Link to="/home/all-instructors" className={isActiveLink("/home/all-instructors") ? "active" : ""}>Instructors List</Link>
                            <Link to="/home/all-trainees" className={isActiveLink("/home/all-trainees") ? "active" : ""}>Trainees List</Link>
                            <Link to="/home/all-lessons" className={isActiveLink("/home/all-lessons") ? "active" : ""}>Class Schedule</Link>
                        </>
                    )}
                </div>

                <div className="navbar-right">
                    <Link to="/home/profile" className="navbar-profile-section">
                        <i className="fas fa-user-circle navbar-profile-icon"></i> 
                        <span className="navbar-welcome">Hello, <span>{username}</span></span>
                    </Link>

                    <Link to="/home/messages">
                        <i className="fas fa-envelope navbar-messages-icon"></i> 
                    </Link>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

                <div className="hamburger-menu" onClick={toggleMobileMenu}>
                    {isMobileMenuOpen ? '✕' : '☰'}
                </div>
            </nav>

            <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <Link to="/home/profile" className="nav-item-mobile" onClick={toggleMobileMenu}>
                    <i className="fas fa-user-circle icon"></i> Personal Area
                </Link>
                <Link to="/home/messages" className="nav-item-mobile" onClick={toggleMobileMenu}>
                    <i className="fas fa-envelope icon"></i> Messages
                </Link>

                {role === 'client' && (
                    <>
                        <Link to="/home/my-lessons" className="nav-item-mobile" onClick={toggleMobileMenu}>My Lessons</Link>
                        <Link to="/home/all-lessons" className="nav-item-mobile" onClick={toggleMobileMenu}>Class Schedule</Link>
                        <Link to="/home/favorites" className="nav-item-mobile" onClick={toggleMobileMenu}>Favorites</Link>
                    </>
                )}

                {role === 'coach' && (
                    <>
                        <Link to="/home/all-lessons" className="nav-item-mobile" onClick={toggleMobileMenu}>Class Schedule</Link>
                        <Link to="/home/training-program" className="nav-item-mobile" onClick={toggleMobileMenu}>Training Program</Link>
                    </>
                )}

                {role === 'secretary' && (
                    <>
                        <Link to="/home/all-instructors" className="nav-item-mobile" onClick={toggleMobileMenu}>Instructors List</Link>
                        <Link to="/home/all-trainees" className="nav-item-mobile" onClick={toggleMobileMenu}>Trainees List</Link>
                        <Link to="/home/all-lessons" className="nav-item-mobile" onClick={toggleMobileMenu}>Class Schedule</Link>
                    </>
                )}
                <button className="logout-btn" onClick={handleLogout} style={{ marginTop: '1rem' }}>
                    Logout
                </button>
            </div>
        </>
    );
};

export default Navbar;