// src/components/UserFormModal.jsx
import React from 'react';
import '../css/modal.css'; // Use the same CSS file

const UserFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    formData,
    handleChange,
    errorMessage,
    loading,
    currentUser, // This will be currentInstructor or currentTrainee
    userType // 'coach' or 'client'
}) => {
    if (!isOpen) return null;

    // Determine the modal title based on user type and whether it's edit or add
    const modalTitle = currentUser
        ? `Edit ${userType === 'coach' ? 'Instructor' : 'Trainee'} Details`
        : `Add New ${userType === 'coach' ? 'Instructor' : 'Trainee'}`;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Close (X) button */}
                <button className="close-button" onClick={onClose}>
                    &times;
                </button>

                <h3>{modalTitle}</h3>
                {errorMessage && <p className="error-message">{errorMessage}</p>}

                <form onSubmit={onSubmit} className="modal-form">
                    <label>
                        First Name:
                        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                    </label>
                    <label>
                        Last Name:
                        <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
                    </label>
                    <label>
                        ID Number:
                        <input type="text" name="id_number" value={formData.id_number} onChange={handleChange} required />
                    </label>
                    <label>
                        Email:
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </label>
                    <label>
                        Phone:
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                    </label>

                    <h4>Address Details:</h4>
                    <label>
                        Street:
                        <input type="text" name="street_name" value={formData.street_name} onChange={handleChange} />
                    </label>
                    <label>
                        House Number:
                        <input type="text" name="house_number" value={formData.house_number} onChange={handleChange} />
                    </label>
                    <label>
                        Apt. Number:
                        <input type="text" name="apartment_number" value={formData.apartment_number} onChange={handleChange} />
                    </label>
                    <label>
                        City:
                        <input type="text" name="city" value={formData.city} onChange={handleChange} />
                    </label>
                    <label>
                        Zip Code:
                        <input type="text" name="zip_code" value={formData.zip_code} onChange={handleChange} />
                    </label>
                    <label>
                        Country:
                        <input type="text" name="country" value={formData.country} onChange={handleChange} />
                    </label>

                    <div className="modal-actions">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : currentUser ? 'Save Changes' : `Add ${userType === 'coach' ? 'Instructor' : 'Trainee'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;