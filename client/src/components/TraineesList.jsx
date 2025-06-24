// src/components/TraineesList.jsx
import React, { useState, useEffect, useContext } from 'react';
import { getRequest, postRequest, putRequest, deleteRequest } from '../Requests';
import { CurrentUser, Error } from './App';
import UserCard from './UserCard';
import UserFormModal from './UserFormModal';
import '../css/list.css';
import '../css/modal.css';

const TraineesList = () => {
    const { currentRole } = useContext(CurrentUser);
    const { setErrorMessage, errorMessage } = useContext(Error);
    const [trainees, setTrainees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTrainee, setCurrentTrainee] = useState(null);
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
        roleName: 'client'
    });
    const [searchQuery, setSearchQuery] = useState(''); // NEW: State for search query

    const fetchTrainees = async () => {
        if (currentRole !== 'secretary') {
            setErrorMessage('Unauthorized access. Only secretaries can view this page.');
            setLoading(false);
            return;
        }
        setLoading(true);
        const result = await getRequest('users/secretary/role/client');
        if (result.succeeded) {
            setTrainees(result.data);
            setErrorMessage('');
        } else {
            setErrorMessage(result.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTrainees();
    }, [currentRole]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddClick = () => {
        setCurrentTrainee(null);
        setFormData({
            first_name: '', last_name: '', id_number: '', email: '', phone: '',
            street_name: '', house_number: '', apartment_number: '', city: '', zip_code: '', country: 'Israel',
            roleName: 'client'
        });
        setErrorMessage('');
        setIsModalOpen(true);
    };

    const handleEditClick = (trainee) => {
        setCurrentTrainee(trainee);
        setFormData({
            first_name: trainee.first_name || '',
            last_name: trainee.last_name || '',
            id_number: trainee.id_number || '',
            email: trainee.email || '',
            phone: trainee.phone || '',
            street_name: trainee.street_name || '',
            house_number: trainee.house_number || '',
            apartment_number: trainee.apartment_number || '',
            city: trainee.city || '',
            zip_code: trainee.zip_code || '',
            country: trainee.country || 'Israel',
            roleName: trainee.roles && trainee.roles.length > 0 ? trainee.roles[0].role : 'client'
        });
        setErrorMessage('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentTrainee(null);
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

        if (currentTrainee) { // Edit
            result = await putRequest(`users/${currentTrainee.id}`, dataToSend);
        } else { // Add (registration)
            result = await postRequest('users/register', dataToSend);
        }

        if (result.succeeded) {
            setErrorMessage('');
            handleCloseModal();
            fetchTrainees(); // Refresh list after add/edit
        } else {
            setErrorMessage(result.error);
        }
        setLoading(false);
    };

    const handleDeleteClick = async (traineeId) => {
        if (window.confirm('Are you sure you want to remove the "client" role for this user?')) {
            setLoading(true);
            const roleToDelete = 'client';
            const result = await deleteRequest(`users/${traineeId}?roleName=${roleToDelete}`);
            if (result.succeeded) {
                setErrorMessage('');
                fetchTrainees(); // Refresh list after delete
            } else {
                setErrorMessage(result.error);
            }
            setLoading(false);
        }
    };

    // NEW: Filtered trainees logic
    const filteredTrainees = trainees.filter(trainee => {
        const query = searchQuery.toLowerCase();
        return (
            trainee.first_name.toLowerCase().includes(query) ||
            trainee.last_name.toLowerCase().includes(query) ||
            trainee.email.toLowerCase().includes(query) ||
            trainee.id_number.includes(query) // ID number might not need toLowerCase
        );
    });
    // End of NEW

    return (
        <div className="list-container">
            <div className="header">
                <h1 className="main-title">Trainees List 🧑‍🤝‍🧑</h1>
                <p className="subtitle">Manage trainees in the system</p>
            </div>

            <div className="list-controls"> {/* NEW: Wrapper for search and add button */}
                <input
                    type="text"
                    placeholder="Search by name, email, or ID..." // NEW: Search input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <button className="add-button" onClick={handleAddClick}>Add New Trainee</button>
            </div>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {loading && <p className="loading-message">Loading trainees...</p>}

            {!loading && filteredTrainees.length === 0 && searchQuery === '' ? (
                <p className="no-data-message">No trainees found in the system.</p>
            ) : !loading && filteredTrainees.length === 0 && searchQuery !== '' ? (
                <p className="no-data-message">No trainees match your search.</p> // NEW: Message for no search results
            ) : (
                <div className="user-cards-grid">
                    {filteredTrainees.map(trainee => ( // IMPORTANT: Use filteredTrainees here
                        <UserCard
                            key={trainee.id}
                            user={trainee}
                            type="trainee"
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            // No onActivate for trainees, as we're removing role, not deactivating user
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
                currentUser={currentTrainee}
                userType="client"
            />
        </div>
    );
};

export default TraineesList;