import React, { useState, useEffect, useContext } from 'react';
import { getRequest, postRequest, putRequest, deleteRequest } from '../Requests'; // נוודא שהנתיב נכון
import { CurrentUser, Error } from './App';
import '../css/list.css'; // עבור טבלאות וכפתורים בסיסיים
import '../css/modal.css'; // עבור המודאל

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
        country: 'ישראל',
        // removed plainPassword from initial state for new users
        roles: ['client']
    });
    const [allRoles, setAllRoles] = useState([]);

    const fetchTrainees = async () => {
        if (currentRole !== 'secretary') {
            setErrorMessage('Unauthorized access. Only secretaries can view this page.');
            setLoading(false);
            return;
        }
        setLoading(true);
        const result = await getRequest('admin/users/role/client');
        if (result.succeeded) {
            setTrainees(result.data);
            setErrorMessage('');
        } else {
            setErrorMessage(result.error);
        }
        setLoading(false);
    };

    const fetchRoles = async () => {
        const result = await getRequest('roles');
        if (result.succeeded) {
            setAllRoles(result.data.map(r => r.role));
        } else {
            console.error('Failed to fetch roles:', result.error);
        }
    };

    useEffect(() => {
        fetchTrainees();
        fetchRoles();
    }, [currentRole]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const newRoles = checked
                ? [...prev.roles, value]
                : prev.roles.filter(role => role !== value);
            return { ...prev, roles: newRoles };
        });
    };

    const handleAddClick = () => {
        setCurrentTrainee(null);
        setFormData({
            first_name: '', last_name: '', id_number: '', email: '', phone: '',
            street_name: '', house_number: '', apartment_number: '', city: '', zip_code: '', country: 'ישראל',
            roles: ['client'] // No plainPassword for new user creation from here
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
            country: trainee.country || 'ישראל',
            // No plainPassword when editing
            roles: trainee.roles || []
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

        if (currentTrainee) { // עריכה
            result = await putRequest(`admin/users/${currentTrainee.id}`, formData);
        } else { // הוספה (ללא סיסמה מצד הלקוח)
            // שימו לב: אנחנו כבר לא שולחים plainPassword כאן.
            // ה-Backend יהיה אחראי ליצור סיסמה זמנית או לסמן את המשתמש כדורש איפוס.
            result = await postRequest('admin/users', formData);
        }

        if (result.succeeded) {
            setErrorMessage('');
            handleCloseModal();
            fetchTrainees();
        } else {
            setErrorMessage(result.error);
        }
        setLoading(false);
    };

    const handleDeleteClick = async (traineeId) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק מתאמן זה? פעולה זו בלתי הפיכה.')) {
            setLoading(true);
            const result = await deleteRequest(`admin/users/${traineeId}`);
            if (result.succeeded) {
                setErrorMessage('');
                fetchTrainees();
            } else {
                setErrorMessage(result.error);
            }
            setLoading(false);
        }
    };

    if (loading && trainees.length === 0 && !isModalOpen) {
        return (
            <div className="loading-message">
                <div className="spinner"></div>
                טוען רשימת מתאמנים...
            </div>
        );
    }
    if (currentRole !== 'secretary') {
        return <div className="unauthorized-message">אין לך הרשאה לצפות בדף זה.</div>;
    }

    return (
        <div className="list-container">
            <div className="header">
                <h1 className="main-title">רשימת מתאמנים 🧑‍🤝‍🧑</h1>
                <p className="subtitle">ניהול מתאמנים במערכת</p>
            </div>

            <button className="add-button" onClick={handleAddClick}>הוסף מתאמן חדש</button>

            {trainees.length === 0 && !loading ? (
                <p className="no-data-message">אין מתאמנים במערכת.</p>
            ) : (
                <table className="list-table">
                    <thead>
                        <tr>
                            <th>שם פרטי</th>
                            <th>שם משפחה</th>
                            <th>ת"ז</th>
                            <th>אימייל</th>
                            <th>טלפון</th>
                            <th>כתובת</th>
                            <th>תפקידים</th>
                            <th>פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trainees.map(trainee => (
                            <tr key={trainee.id}>
                                <td>{trainee.first_name}</td>
                                <td>{trainee.last_name}</td>
                                <td>{trainee.id_number}</td>
                                <td>{trainee.email}</td>
                                <td>{trainee.phone}</td>
                                <td>{`${trainee.street_name || ''} ${trainee.house_number || ''}${trainee.apartment_number ? ', דירה ' + trainee.apartment_number : ''}, ${trainee.city || ''} ${trainee.zip_code || ''} ${trainee.country || ''}`}</td>
                                <td>{trainee.roles ? trainee.roles.join(', ') : 'אין'}</td>
                                <td>
                                    <button className="edit-btn" onClick={() => handleEditClick(trainee)}>ערוך</button>
                                    <button className="delete-btn" onClick={() => handleDeleteClick(trainee.id)}>מחק</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{currentTrainee ? 'ערוך פרטי מתאמן' : 'הוסף מתאמן חדש'}</h3>
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                        <form onSubmit={handleSubmit} className="modal-form">
                            <label>
                                שם פרטי:
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                            </label>
                            <label>
                                שם משפחה:
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
                            </label>
                            <label>
                                ת"ז:
                                <input type="text" name="id_number" value={formData.id_number} onChange={handleChange} required />
                            </label>
                            <label>
                                אימייל:
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </label>
                            <label>
                                טלפון:
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                            </label>

                            <h4>פרטי כתובת:</h4>
                            <label>
                                רחוב:
                                <input type="text" name="street_name" value={formData.street_name} onChange={handleChange} />
                            </label>
                            <label>
                                מספר בית:
                                <input type="text" name="house_number" value={formData.house_number} onChange={handleChange} />
                            </label>
                            <label>
                                מספר דירה:
                                <input type="text" name="apartment_number" value={formData.apartment_number} onChange={handleChange} />
                            </label>
                            <label>
                                עיר:
                                <input type="text" name="city" value={formData.city} onChange={handleChange} />
                            </label>
                            <label>
                                מיקוד:
                                <input type="text" name="zip_code" value={formData.zip_code} onChange={handleChange} />
                            </label>
                            <label>
                                מדינה:
                                <input type="text" name="country" value={formData.country} onChange={handleChange} />
                            </label>

                            {/* שדה הסיסמה הוסר ממצב הוספה */}
                            {/* {!currentTrainee && (
                                <label>
                                    סיסמה (ליצירת משתמש חדש):
                                    <input type="password" name="plainPassword" value={formData.plainPassword} onChange={handleChange} required={!currentTrainee} />
                                </label>
                            )} */}

                            <h4>תפקידים:</h4>
                            <div className="roles-checkboxes">
                                {allRoles.map(roleName => (
                                    <label key={roleName}>
                                        <input
                                            type="checkbox"
                                            name="roles"
                                            value={roleName}
                                            checked={formData.roles.includes(roleName)}
                                            onChange={handleRoleChange}
                                        />
                                        {roleName === 'client' ? 'לקוח' : roleName === 'coach' ? 'מאמן' : 'מזכיר'}
                                    </label>
                                ))}
                            </div>

                            <div className="modal-actions">
                                <button type="submit" disabled={loading}>
                                    {loading ? 'שולח...' : currentTrainee ? 'שמור שינויים' : 'הוסף מתאמן'}
                                </button>
                                <button type="button" className="cancel-button" onClick={handleCloseModal} disabled={loading}>
                                    ביטול
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TraineesList;