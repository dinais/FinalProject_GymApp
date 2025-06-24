import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CurrentUser } from './App'; // Assuming App is in the same directory, adjust path if needed
import '../css/navbar.css'; // Make sure this CSS is also updated for LTR and English texts

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

    // Helper function to check if a link is active
    const isActiveLink = (path) => {
        return location.pathname.startsWith(path);
    };

    return (
        <>
            <nav className="navbar">
                {/* Left Area - Site Name / Logo (now on the left) */}
                <Link to="/" className="navbar-brand">
                    GymApp {/* Brand Name - can be changed */}
                </Link>

                {/* Desktop Links (hidden on mobile) */}
                <div className="navbar-links">
                    {/* Regular text links here - these are shown on desktop */}
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

                {/* Right Area - Icons + Username + Logout */}
                <div className="navbar-right">
                    {/* Profile Icon + Username */}
                    <Link to="/home/profile" className="navbar-profile-section">
                        <i className="fas fa-user-circle navbar-profile-icon"></i> {/* Profile Icon */}
                        <span className="navbar-welcome">Hello, <span>{username}</span></span>
                    </Link>

                    {/* Messages Icon */}
                    <Link to="/home/messages">
                        <i className="fas fa-envelope navbar-messages-icon"></i> {/* Messages Icon */}
                    </Link>

                    {/* Logout Button */}
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>

                {/* Hamburger Menu for Mobile (displayed only on mobile) */}
                <div className="hamburger-menu" onClick={toggleMobileMenu}>
                    {isMobileMenuOpen ? '✕' : '☰'}
                </div>
            </nav>

            {/* Mobile Menu slides down below the Navbar */}
            <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                {/* Icons and text inside mobile menu */}
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
                {/* Logout button also in mobile menu */}
                <button className="logout-btn" onClick={handleLogout} style={{ marginTop: '1rem' }}>
                    Logout
                </button>
            </div>
        </>
    );
};

export default Navbar;