import React, { useState, useEffect } from 'react';
import '../css/modal.css'; 

const LessonFormModal = ({ isOpen, onClose, onSubmit, initialData = null, errorMessage, loading, instructors = [] }) => {
    const now = new Date();
    const defaultScheduledAt = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)) 
        .toISOString().slice(0, 16); 

    const [formData, setFormData] = useState({
        lesson_type: '',
        scheduled_at: defaultScheduledAt, 
        room_number: '',
        max_participants: 10, 
        coachId: '' 
    });
    const [localErrorMessage, setLocalErrorMessage] = useState('');

    const lessonTypes = [
        "CrossFit", "Yoga", "HIIT", "Pilates", "Boxing", "Spinning", "Zumba", "PowerLifting",
        "Design & Sculpt",
        "Dynamic Design",
        "Moderate Pilates",
        "Senior Design",
        "Core Strength",
        "Aerobic & Dynamic Design",
        "Aerobic & Design",
        "Strength & Fat Burn",
        "Feldenkrais",
        "Pilates Rehab",
        "Pilates & Stretch",
        "Kung Fu",
        "Design & Pilates",
        "Design HIT",
        "Abdominal Rehab",
        "Weight Training",
        "Kickboxing / HIT"
    ];

    useEffect(() => {
        if (isOpen) {
            setLocalErrorMessage(''); 
            if (initialData) {
                const date = new Date(initialData.scheduled_at); 
                let formattedDate = '';
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
                } else {
                    console.warn("Invalid scheduled_at date in initialData:", initialData.scheduled_at);
                }

                setFormData({
                    lesson_type: initialData.lesson_type || '',
                    scheduled_at: formattedDate,
                    room_number: initialData.room_number || '',
                    max_participants: initialData.max_participants || 10,
                    coachId: initialData.instructor_id || (initialData.Instructor ? initialData.Instructor.id : '')
                });
            } else {
                setFormData({
                    lesson_type: '',
                    scheduled_at: defaultScheduledAt, 
                    room_number: '',
                    max_participants: 10,
                    coachId: ''
                });
            }
        }
    }, [isOpen, initialData]); 

    useEffect(() => {
        setLocalErrorMessage(errorMessage);
    }, [errorMessage]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalErrorMessage(''); 

        if (!formData.lesson_type || !formData.scheduled_at || !formData.room_number || !formData.max_participants || !formData.coachId) {
            setLocalErrorMessage('All fields are required.');
            return;
        }
        if (formData.max_participants <= 0) {
            setLocalErrorMessage('Max participants must be a positive number.');
            return;
        }

        const dateObj = new Date(formData.scheduled_at);
        if (isNaN(dateObj.getTime())) { 
            setLocalErrorMessage('Invalid date and time format.');
            return;
        }
        const utcScheduledAt = dateObj.toISOString();

        const dataToSubmit = {
            lesson_type: formData.lesson_type,
            scheduled_at: utcScheduledAt,
            room_number: formData.room_number,
            max_participants: parseInt(formData.max_participants, 10), 
            instructor_id: formData.coachId 
        };
        onSubmit(dataToSubmit);

    };

    if (!isOpen) return null; 

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>{initialData ? 'Edit Lesson' : 'Add New Lesson'}</h2>
                {localErrorMessage && <p className="error-message">{localErrorMessage}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="lesson_type">Lesson Type:</label>
                        <select
                            id="lesson_type"
                            name="lesson_type"
                            value={formData.lesson_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a type</option>
                            {lessonTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="scheduled_at">Scheduled At:</label>
                        <input
                            type="datetime-local"
                            id="scheduled_at"
                            name="scheduled_at"
                            value={formData.scheduled_at}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="room_number">Room Number:</label>
                        <input
                            type="text"
                            id="room_number"
                            name="room_number"
                            value={formData.room_number}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="max_participants">Max Participants:</label>
                        <input
                            type="number"
                            id="max_participants"
                            name="max_participants"
                            value={formData.max_participants}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="coachId">Coach:</label>
                        <select
                            id="coachId"
                            name="coachId"
                            value={formData.coachId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a coach</option>
                            {instructors.map(instructor => (
                                <option key={instructor.id} value={instructor.id}>
                                    {instructor.first_name} {instructor.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Lesson')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default LessonFormModal;
