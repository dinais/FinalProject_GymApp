import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CurrentUser } from './App';

function RoleSelector() {
  const { currentUser, setCurrentRole } = useContext(CurrentUser);
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setCurrentRole(role);
    localStorage.setItem("selectedRole", role);
    navigate('/home'); // העבר לעמוד הבית לפי תפקיד
  };

  if (!currentUser?.roles || currentUser.roles.length <= 1) {
    navigate('/');
    return null;
  }

  return (
    <div className="choose-role-container">
      <h2>Hello {currentUser.first_name}, please choose your role:</h2>
      {currentUser.roles.map((role) => (
        <button key={role} onClick={() => handleRoleSelect(role)} className="role-button">
          {role}
        </button>
      ))}
    </div>
  );
}

export default RoleSelector;
