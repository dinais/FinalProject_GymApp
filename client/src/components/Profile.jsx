import React, { useContext, useEffect, useState } from 'react';
import { CurrentUser, Error } from './App'; 
import '../css/Profile.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faEnvelope, faPhone, faIdCard, faMapMarkerAlt, faCheckCircle, faTimesCircle, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

function Profile() {
    const { currentUser, setCurrentUser } = useContext(CurrentUser);
    const { errorMessage, setErrorMessage } = useContext(Error);

    useEffect(() => {
        if (!currentUser || !currentUser.id) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setCurrentUser(parsedUser);
                } catch (e) {
                    console.error("Failed to parse currentUser from localStorage", e);
                    setErrorMessage("Failed to load user profile. Please try logging in again.");
                }
            } else {
                setErrorMessage("No user data found. Please log in.");
            }
        }
    }, [currentUser, setCurrentUser, setErrorMessage]);

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

    if (!currentUser || !currentUser.id) {
        return (
            <div className="profile-page-wrapper">
                <div className="profile-container user-card">
                    <h1 className="main-profile-title">Loading Profile...</h1>
                    {errorMessage && <div className="error-message">{errorMessage}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-wrapper">
            <div className="profile-container user-card">
                <div className="user-avatar-placeholder">
                    <FontAwesomeIcon icon={faUserCircle} />
                </div>
                <div className="user-details">
                    <h3 className="user-name">{currentUser.first_name} {currentUser.last_name}</h3>
                    <div className={`user-status-tag ${currentUser.is_active ? 'active' : 'inactive'}`}>
                        {currentUser.is_active ? (
                            <><FontAwesomeIcon icon={faCheckCircle} /> Active Account</>
                        ) : (
                            <><FontAwesomeIcon icon={faTimesCircle} /> Inactive Account</>
                        )}
                    </div>

                    <div className="profile-info-section">
                        <h4 className="section-title">Personal Information</h4>
                        <div className="user-info-grid">
                            <p className="user-info-item"><FontAwesomeIcon icon={faIdCard} /> ID: {currentUser.id_number}</p>
                            <p className="user-info-item"><FontAwesomeIcon icon={faEnvelope} /> {currentUser.email}</p>
                            <p className="user-info-item"><FontAwesomeIcon icon={faPhone} /> {currentUser.phone}</p>
                        </div>
                    </div>

                    <div className="profile-info-section">
                        <h4 className="section-title">Address</h4>
                        <div className="user-info-grid">
                            <p className="user-info-item user-address"><FontAwesomeIcon icon={faMapMarkerAlt} /> {formatAddress(currentUser) || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="profile-info-section">
                        <h4 className="section-title"><FontAwesomeIcon icon={faShieldAlt} /> Roles</h4>
                        <div className="roles-tags-container">
                            {currentUser.roles && Array.isArray(currentUser.roles) && currentUser.roles.length > 0
                                ? currentUser.roles.map(role => (
                                        <span key={role} className="role-tag">{role}</span>
                                ))
                                : <span className="role-tag no-roles">No roles assigned</span>}
                        </div>
                    </div>
                </div>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
            </div>
        </div>
    );
}

export default Profile;
