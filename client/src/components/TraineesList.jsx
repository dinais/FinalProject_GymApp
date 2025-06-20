import React, { useState, useEffect, useContext } from 'react';
import { getRequest, postRequest, putRequest, deleteRequest } from '../Requests';
import { CurrentUser, Error } from './App';
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
        country: 'ישראל',
        // --- תיקון כאן: שינוי מ-roles ל-roleName והפיכה למחרוזת ---
        roleName: 'client' // מועבר כמחרוזת בודדת
    });
    const [allRoles, setAllRoles] = useState([]);

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

    const handleAddClick = () => {
        setCurrentTrainee(null);
        setFormData({
            first_name: '', last_name: '', id_number: '', email: '', phone: '',
            street_name: '', house_number: '', apartment_number: '', city: '', zip_code: '', country: 'ישראל',
            // --- תיקון כאן: שינוי מ-roles ל-roleName והפיכה למחרוזת ---
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
            country: trainee.country || 'ישראל',
            // --- תיקון כאן: בעריכה, וודא שאתה לוקח את התפקיד הראשי אם יש מספר תפקידים
            // או שאתה צריך UI לבחירת תפקיד לעריכה.
            // אם ה-backend מצפה ל-roleName בודד עבור עדכון (PUT),
            // תצטרך לוודא שאתה שולח רק אחד.
            // נניח שאתה רוצה לשלוח את התפקיד הראשון מהמערך שהתקבל, אם קיים.
            roleName: trainee.roles && trainee.roles.length > 0 ? trainee.roles[0].role : '' // נלקח התפקיד הראשון
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

        // --- תיקון כאן: הוספת ה-roleName לאובייקט לפני השליחה ---
        const dataToSend = { ...formData };
        if (Array.isArray(dataToSend.roleName) && dataToSend.roleName.length > 0) {
            dataToSend.roleName = dataToSend.roleName[0];
        } else if (Array.isArray(dataToSend.roleName) && dataToSend.roleName.length === 0) {
            setErrorMessage('חובה לציין תפקיד למשתמש.');
            setLoading(false);
            return;
        }

        if (currentTrainee) { // עריכה
            result = await putRequest(`users/${currentTrainee.id}`, dataToSend); // שלח את dataToSend
        } else { // הוספה (ללא סיסמה מצד הלקוח)
            result = await postRequest('users/register', dataToSend); // שלח את dataToSend
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
        if (window.confirm('האם אתה בטוח שברצונך להשבית את תפקיד ה\'מתאמן\' עבור משתמש זה?')) { // שינוי הודעה
            setLoading(true);
            const roleToDelete = 'client';
            const result = await deleteRequest(`users/${traineeId}?roleName=${roleToDelete}`);
            if (result.succeeded) {
                setErrorMessage('');
                fetchTrainees();
            } else {
                setErrorMessage(result.error);
            }
            setLoading(false);
        }
    };

    // ... (שאר הקוד נשאר ללא שינוי)

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
                            {/* שדה תפקיד - אם תרצה לשנות אותו בעתיד, הוא צריך להיות סלקט שמחזיר מחרוזת */}
                            {/* <input type="hidden" name="roleName" value={formData.roleName} /> */}
                            {/* ... */}

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