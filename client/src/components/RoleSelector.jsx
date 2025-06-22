import React, { useContext, useEffect } from 'react'; // Import useEffect
import { useNavigate } from 'react-router-dom';
import { CurrentUser } from './App';
import '../css/roleSelector.css'; // Import the new CSS file

function RoleSelector() {
    const { currentUser, setCurrentRole } = useContext(CurrentUser);
    const navigate = useNavigate();

    // Use useEffect to handle navigation based on roles
    useEffect(() => {
        // If no user or only one role, redirect immediately.
        // This prevents the RoleSelector page from showing unnecessarily.
        if (!currentUser) {
            navigate('/login'); // Redirect to login if no current user
            return;
        }

        if (currentUser.roles && currentUser.roles.length === 1) {
            const role = currentUser.roles[0];
            setCurrentRole(role);
            localStorage.setItem("selectedRole", role);
            navigate('/home'); // Redirect to home if only one role
        } else if (!currentUser.roles || currentUser.roles.length === 0) {
            // Handle case where user has no roles (should ideally not happen post-login)
            console.warn("User has no roles, redirecting to login.");
            navigate('/login'); 
        }
    }, [currentUser, navigate, setCurrentRole]); // Dependencies

    // If currentUser is null or roles are being handled by useEffect, don't render anything yet
    if (!currentUser || currentUser.roles.length <= 1) {
        return null; // Or a loading spinner if needed
    }

    const handleRoleSelect = (role) => {
        setCurrentRole(role);
        localStorage.setItem("selectedRole", role);
        navigate('/home'); // Navigate to home based on selected role
    };

    return (
        // The main container. The global body styles from login.css will provide the background.
        <div className="role-selector-page-wrapper"> {/* A new wrapper for the page content */}
            <div className="role-selector-container"> {/* Main content container */}
                <h2>Hello {currentUser.first_name}, please choose your role:</h2>
                <div className="role-buttons-wrapper">
                    {currentUser.roles.map((role) => (
                        <button 
                            key={role} 
                            onClick={() => handleRoleSelect(role)} 
                            className="role-button"
                        >
                            {/* You might want to format the role name for display, e.g., capitalize first letter */}
                            {role.charAt(0).toUpperCase() + role.slice(1)} 
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RoleSelector;