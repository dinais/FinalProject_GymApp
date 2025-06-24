// src/components/UserCard.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEnvelope, faPhone, faIdCard, faMapMarkerAlt, faEdit, faTrashAlt, faCheckCircle, faBan } from '@fortawesome/free-solid-svg-icons';
// נצטרך להתקין את Font Awesome אם עדיין לא מותקן:
// npm install --save @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome

const UserCard = ({ user, type, onEdit, onDelete, onActivate }) => {
    // Determine if the user is active, mainly for coaches
    const isActive = user.is_active !== undefined ? user.is_active : true; // Trainees are always considered active for this list

    // Function to format address
    const formatAddress = (user) => {
        const parts = [];
        if (user.street_name) parts.push(user.street_name);
        if (user.house_number) parts.push(user.house_number);
        if (user.apartment_number) parts.push(`Apt. ${user.apartment_number}`);
        if (user.city) parts.push(user.city);
        if (user.zip_code) parts.push(user.zip_code);
        if (user.country) parts.push(user.country);
        return parts.filter(Boolean).join(', ');
    };

    return (
        <div className={`user-card ${!isActive ? 'inactive-user' : ''}`}>
            {/* User Profile Picture Placeholder (could be dynamic later) */}
            <div className="user-avatar-placeholder">
                <FontAwesomeIcon icon={faUserCircle} />
            </div>

            <div className="user-details">
                <h3 className="user-name">{user.first_name} {user.last_name}</h3>
                {type === 'coach' && (
                    <div className={`user-status-tag ${isActive ? 'active' : 'inactive'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </div>
                )}
                
                <div className="user-info-grid">
                    <p className="user-info-item"><FontAwesomeIcon icon={faIdCard} /> ID: {user.id_number}</p>
                    <p className="user-info-item"><FontAwesomeIcon icon={faEnvelope} /> {user.email}</p>
                    <p className="user-info-item"><FontAwesomeIcon icon={faPhone} /> {user.phone}</p>
                    <p className="user-info-item user-address"><FontAwesomeIcon icon={faMapMarkerAlt} /> {formatAddress(user)}</p>
                </div>
            </div>

            <div className="user-actions">
                <button className="action-btn edit-btn" onClick={() => onEdit(user)}>
                    <FontAwesomeIcon icon={faEdit} /> Edit
                </button>
                {type === 'coach' && (
                    isActive ? (
                        <button className="action-btn deactivate-btn" onClick={() => onDelete(user.id)}>
                            <FontAwesomeIcon icon={faBan} /> Deactivate
                        </button>
                    ) : (
                        <button className="action-btn activate-btn" onClick={() => onActivate(user.id)}>
                            <FontAwesomeIcon icon={faCheckCircle} /> Reactivate
                        </button>
                    )
                )}
                {type === 'trainee' && (
                    <button className="action-btn delete-btn" onClick={() => onDelete(user.id)}>
                        <FontAwesomeIcon icon={faTrashAlt} /> Remove
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserCard;