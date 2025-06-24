import React, { useContext, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { CurrentUser } from './App';
import '../css/roleSelector.css'; 

function RoleSelector() {
    const { currentUser, setCurrentRole } = useContext(CurrentUser);
    const navigate = useNavigate();
    useEffect(() => {
        if (!currentUser) {
            navigate('/login'); 
            return;
        }
        if (currentUser.roles && currentUser.roles.length === 1) {
            const role = currentUser.roles[0];
            setCurrentRole(role);
            localStorage.setItem("selectedRole", role);
            navigate('/home'); 
        } else if (!currentUser.roles || currentUser.roles.length === 0) {
            console.warn("User has no roles, redirecting to login.");
            navigate('/login'); 
        }
    }, [currentUser, navigate, setCurrentRole]); 

    if (!currentUser || currentUser.roles.length <= 1) {
        return null; 
    }

    const handleRoleSelect = (role) => {
        setCurrentRole(role);
        localStorage.setItem("selectedRole", role);
        navigate('/home'); 
        };

    return (
        <div className="role-selector-page-wrapper">
            <div className="role-selector-container">
                <h2>Hello {currentUser.first_name}, please choose your role:</h2>
                <div className="role-buttons-wrapper">
                    {currentUser.roles.map((role) => (
                        <button 
                            key={role} 
                            onClick={() => handleRoleSelect(role)} 
                            className="role-button"
                        >
                            {role.charAt(0).toUpperCase() + role.slice(1)} 
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RoleSelector;