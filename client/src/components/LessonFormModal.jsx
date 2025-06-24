import React, { useState, useEffect } from 'react';
import '../css/modal.css'; // Make sure this path is correct for your modal styles

const LessonFormModal = ({ isOpen, onClose, onSubmit, initialData = null, errorMessage, loading, instructors = [] }) => {
    // Determine the default 'scheduled_at' for a new lesson.
    // This creates a Date object in the user's local timezone
    // and formats it for the 'datetime-local' input (YYYY-MM-DDTHH:mm).
    const now = new Date();
    const defaultScheduledAt = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)) // Adjust to local time
                                    .toISOString().slice(0, 16); // Format for datetime-local input

    const [formData, setFormData] = useState({
        lesson_type: '',
        scheduled_at: defaultScheduledAt, // Set a default value for new lessons
        room_number: '',
        max_participants: 10, // Default max participants
        coachId: '' // This will hold the instructor's ID from the dropdown
    });
    const [localErrorMessage, setLocalErrorMessage] = useState('');

    // List of all possible lesson types for the dropdown
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

    // Effect to populate form data when the modal opens or initialData changes (for editing)
    useEffect(() => {
        if (isOpen) {
            setLocalErrorMessage(''); // Clear any previous error messages when modal opens

            if (initialData) {
                // If initialData is provided, we are in "edit" mode
                console.log("LessonFormModal: Received initialData for editing:", initialData);
                console.log("LessonFormModal: lesson_type from server:", initialData.lesson_type);
                
                const date = new Date(initialData.scheduled_at); // This date object represents the UTC time from the server
                let formattedDate = '';

                if (!isNaN(date.getTime())) {
                    // Convert UTC date from initialData to local date string for 'datetime-local' input display.
                    // The .getFullYear(), .getMonth(), etc., methods on a UTC Date object
                    // return the values in the *local* time zone. This is what we need for datetime-local.
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
                    // Map instructor_id from backend response to coachId for the form's select input
                    // Prioritize initialData.instructor_id if directly available, else use Instructor.id
                    coachId: initialData.instructor_id || (initialData.Instructor ? initialData.Instructor.id : '')
                });
            } else {
                // If no initialData (or modal just opened for new lesson), reset to default values
                setFormData({
                    lesson_type: '',
                    scheduled_at: defaultScheduledAt, // Use the default current time for new lessons
                    room_number: '',
                    max_participants: 10,
                    coachId: ''
                });
            }
        }
    }, [isOpen, initialData]); // Re-run effect when modal opens/closes or initial data changes

    // Effect to update local error message when external errorMessage changes
    useEffect(() => {
        setLocalErrorMessage(errorMessage);
    }, [errorMessage]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setLocalErrorMessage(''); // Clear errors on new submission attempt

        // Basic form validation
        if (!formData.lesson_type || !formData.scheduled_at || !formData.room_number || !formData.max_participants || !formData.coachId) {
            setLocalErrorMessage('All fields are required.');
            return;
        }

        if (formData.max_participants <= 0) {
            setLocalErrorMessage('Max participants must be a positive number.');
            return;
        }

        // Convert 'scheduled_at' from local input string to UTC ISO string for backend
        // 'datetime-local' input provides a string in the local timezone (YYYY-MM-DDTHH:mm).
        // `new Date()` parses this string as local time.
        const dateObj = new Date(formData.scheduled_at); 
        if (isNaN(dateObj.getTime())) { // Check for invalid date
            setLocalErrorMessage('Invalid date and time format.');
            return;
        }
        
        // `toISOString()` converts the local Date object to a UTC ISO string, which the backend expects.
        const utcScheduledAt = dateObj.toISOString();

        console.log("LessonFormModal: Submitting scheduled_at as UTC ISO:", utcScheduledAt);

        // Prepare data for submission:
        // The backend expects 'instructor_id', not 'coachId'.
        const dataToSubmit = { 
            lesson_type: formData.lesson_type,
            scheduled_at: utcScheduledAt,
            room_number: formData.room_number,
            max_participants: parseInt(formData.max_participants, 10), // Ensure it's a number
            instructor_id: formData.coachId // Map coachId to instructor_id for the backend
        };

        // Call the onSubmit prop function with the prepared data
        onSubmit(dataToSubmit);
        // Do NOT close the modal here. Let the parent component handle closing
        // after successful submission, based on the `onSubmit` result.
    };

    if (!isOpen) return null; // Don't render if modal is not open

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Close button at the top right */}
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
