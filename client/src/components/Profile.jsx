import React, { useContext, useEffect, useState } from 'react';
import { CurrentUser, Error } from './App'; 
import '../css/Profile.css'; 
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

    if (!currentUser || !currentUser.id) {
        return (
            <div className="profile-container">
                <h1>Loading Profile...</h1>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
            </div>
        );
    }

    return (
        <div className="profile-container">
            <h1>User Profile</h1>
            <div className="profile-details">
                <div className="detail-group">
                    <span className="detail-label">Full Name:</span>
                    <span className="detail-value">{currentUser.first_name} {currentUser.last_name}</span>
                </div>
                <div className="detail-group">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{currentUser.email}</span>
                </div>
                <div className="detail-group">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{currentUser.phone}</span>
                </div>
                <div className="detail-group">
                    <span className="detail-label">ID Number:</span>
                    <span className="detail-value">{currentUser.id_number}</span>
                </div>
                <h3>Address Details:</h3>
                <div className="detail-group">
                    <span className="detail-label">Street:</span>
                    <span className="detail-value">{currentUser.street_name || 'N/A'} {currentUser.house_number || ''}</span>
                </div>
                {currentUser.apartment_number && (
                    <div className="detail-group">
                        <span className="detail-label">Apartment No.:</span>
                        <span className="detail-value">{currentUser.apartment_number}</span>
                    </div>
                )}
                <div className="detail-group">
                    <span className="detail-label">City:</span>
                    <span className="detail-value">{currentUser.city || 'N/A'}</span>
                </div>
                <div className="detail-group">
                    <span className="detail-label">Zip Code:</span>
                    <span className="detail-value">{currentUser.zip_code || 'N/A'}</span>
                </div>
                <div className="detail-group">
                    <span className="detail-label">Country:</span>
                    <span className="detail-value">{currentUser.country || 'N/A'}</span>
                </div>
                <div className="detail-group">
                    <span className="detail-label">Roles:</span>
                    <span className="detail-value">
                        {currentUser.roles && currentUser.roles.length > 0
                            ? currentUser.roles.join(', ')
                            : 'No active roles'}
                    </span>
                </div>
                <div className="detail-group">
                    <span className="detail-label">Account Status:</span>
                    <span className="detail-value">
                        {currentUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
}

export default Profile;