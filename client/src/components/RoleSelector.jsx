// RoleSelector.jsx
import React from 'react';

const RoleSelector = ({ roles, onSelect }) => {
  return (
    <div>
      <h3>בחר תפקיד:</h3>
      {roles.map((role, idx) => (
        <button key={idx} onClick={() => onSelect(role)}>
          {role === 'trainee' ? 'מתאמן' :
           role === 'instructor' ? 'מדריך' :
           role === 'secretary' ? 'מזכירה' : role}
        </button>
      ))}
    </div>
  );
};

export default RoleSelector;
