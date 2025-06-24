// src/components/InstructorsList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { getRequest, postRequest, putRequest, deleteRequest } from '../Requests';
import { CurrentUser, Error } from './App';
import UserCard from './UserCard';
import UserFormModal from './UserFormModal';
import '../css/list.css';
import '../css/modal.css';

const InstructorsList = () => {
    const { currentRole } = useContext(CurrentUser);
    const { setErrorMessage, errorMessage } = useContext(Error);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentInstructor, setCurrentInstructor] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        id_number: '',
        email: '',
        phone: '',
        street_name: '',
        house_number: '',
        apartment_number: '',
        city: '',
        zip_code: '',
        country: 'Israel',
        roleName: 'coach'
    });
    const [searchQuery, setSearchQuery] = useState(''); // <--- NEW: State for search query

    const fetchInstructors = async () => {
        if (currentRole !== 'secretary' && currentRole !== 'admin') {
            setErrorMessage('Unauthorized access. Only secretaries and admins can view this page.');
            setLoading(false);
            return;
        }
        setLoading(true);
        const result = await getRequest('users/secretary/role/coach');
        if (result.succeeded) {
            setInstructors(result.data);
            setErrorMessage('');
        } else {
            setErrorMessage(result.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInstructors();
    }, [currentRole]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddClick = () => {
        setCurrentInstructor(null);
        setFormData({
            first_name: '', last_name: '', id_number: '', email: '', phone: '',
            street_name: '', house_number: '', apartment_number: '', city: '', zip_code: '', country: 'Israel',
            roleName: 'coach'
        });
        setErrorMessage('');
        setIsModalOpen(true);
    };

    const handleEditClick = (instructor) => {
        setCurrentInstructor(instructor);
        setFormData({
            first_name: instructor.first_name || '',
            last_name: instructor.last_name || '',
            id_number: instructor.id_number || '',
            email: instructor.email || '',
            phone: instructor.phone || '',
            street_name: instructor.street_name || '',
            house_number: instructor.house_number || '',
            apartment_number: instructor.apartment_number || '',
            city: instructor.city || '',
            zip_code: instructor.zip_code || '',
            country: instructor.country || 'Israel',
            roleName: instructor.roles && instructor.roles.length > 0 ? instructor.roles[0].role : 'coach'
        });
        setErrorMessage('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentInstructor(null);
        setErrorMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        let result;

        const dataToSend = { ...formData };
        if (Array.isArray(dataToSend.roleName) && dataToSend.roleName.length > 0) {
            dataToSend.roleName = dataToSend.roleName[0];
        } else if (Array.isArray(dataToSend.roleName) && dataToSend.roleName.length === 0) {
            setErrorMessage('A role must be specified for the user.');
            setLoading(false);
            return;
        }

        if (currentInstructor) { // Edit
            result = await putRequest(`users/${currentInstructor.id}`, dataToSend);
        } else { // Add (registration)
            result = await postRequest('users/register', dataToSend);
        }

        if (result.succeeded) {
            setErrorMessage('');
            handleCloseModal();
            fetchInstructors(); // Refresh list after add/edit
        } else {
            setErrorMessage(result.error);
        }
        setLoading(false);
    };

    const handleDeleteClick = async (instructorId) => {
        if (window.confirm('Are you sure you want to remove the "coach" role for this user?')) {
            setLoading(true);
            const roleToDelete = 'coach';
            const result = await deleteRequest(`users/${instructorId}?roleName=${roleToDelete}`);
            if (result.succeeded) {
                setErrorMessage('');
                fetchInstructors(); // Refresh list after delete
            } else {
                setErrorMessage(result.error);
            }
            setLoading(false);
        }
    };

    const handleActivateClick = async (instructorId) => {
        if (window.confirm('Are you sure you want to reactivate this instructor?')) {
            setLoading(true);
            const result = await putRequest(`users/${instructorId}/activate`);
            if (result.succeeded) {
                setErrorMessage('');
                fetchInstructors(); // Refresh list after activate
            } else {
                setErrorMessage(result.error);
            }
            setLoading(false);
        }
    };

    // <--- NEW: Filtered instructors logic
    const filteredInstructors = instructors.filter(instructor => {
        const query = searchQuery.toLowerCase();
        return (
            instructor.first_name.toLowerCase().includes(query) ||
            instructor.last_name.toLowerCase().includes(query) ||
            instructor.email.toLowerCase().includes(query) ||
            instructor.id_number.includes(query) // ID number might not need toLowerCase
        );
    });
    // End of NEW

    return (
        <div className="list-container">
            <div className="header">
                <h1 className="main-title">Instructors List 🏋️‍♀️</h1>
                <p className="subtitle">Manage instructors in the system</p>
            </div>

            <div className="list-controls"> {/* <--- NEW: Wrapper for search and add button */}
                <input
                    type="text"
                    placeholder="Search by name, email, or ID..." // <--- NEW: Search input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <button className="add-button" onClick={handleAddClick}>Add New Instructor</button>
            </div>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {loading && <p className="loading-message">Loading instructors...</p>}

            {!loading && filteredInstructors.length === 0 && searchQuery === '' ? (
                <p className="no-data-message">No instructors found in the system.</p>
            ) : !loading && filteredInstructors.length === 0 && searchQuery !== '' ? (
                <p className="no-data-message">No instructors match your search.</p> // <--- NEW: Message for no search results
            ) : (
                <div className="user-cards-grid">
                    {filteredInstructors.map(instructor => ( // <--- IMPORTANT: Use filteredInstructors here
                        <UserCard
                            key={instructor.id}
                            user={instructor}
                            type="coach"
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            onActivate={handleActivateClick}
                        />
                    ))}
                </div>
            )}

            <UserFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                formData={formData}
                handleChange={handleChange}
                errorMessage={errorMessage}
                loading={loading}
                currentUser={currentInstructor}
                userType="coach"
            />
        </div>
    );
};

export default InstructorsList;