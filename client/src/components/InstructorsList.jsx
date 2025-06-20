import React, { useState, useEffect, useContext } from 'react';
import { getRequest, postRequest, putRequest, deleteRequest } from '../Requests';
import { CurrentUser, Error } from './App';
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
        country: 'ישראל',
        // --- תיקון כאן: שינוי מ-roles ל-roleName והפיכה למחרוזת ---
        roleName: 'coach' // מועבר כמחרוזת בודדת
    });

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
            street_name: '', house_number: '', apartment_number: '', city: '', zip_code: '', country: 'ישראל',
            // --- תיקון כאן: שינוי מ-roles ל-roleName והפיכה למחרוזת ---
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
            country: instructor.country || 'ישראל',
            // --- תיקון כאן: בעריכה, וודא שאתה לוקח את התפקיד הראשי
            // נניח שאתה רוצה לשלוח את התפקיד הראשון מהמערך שהתקבל, אם קיים.
            roleName: instructor.roles && instructor.roles.length > 0 ? instructor.roles[0].role : ''
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

        // --- תיקון כאן: הוספת ה-roleName לאובייקט לפני השליחה ---
        const dataToSend = { ...formData };
        if (Array.isArray(dataToSend.roleName) && dataToSend.roleName.length > 0) {
            dataToSend.roleName = dataToSend.roleName[0];
        } else if (Array.isArray(dataToSend.roleName) && dataToSend.roleName.length === 0) {
            setErrorMessage('חובה לציין תפקיד למשתמש.');
            setLoading(false);
            return;
        }


        if (currentInstructor) { // עריכה
            result = await putRequest(`users/${currentInstructor.id}`, dataToSend);
        } else { // הוספה (רישום)
            result = await postRequest('users/register', dataToSend);
        }

        if (result.succeeded) {
            setErrorMessage('');
            handleCloseModal();
            fetchInstructors();
        } else {
            setErrorMessage(result.error);
        }
        setLoading(false);
    };

    const handleDeleteClick = async (instructorId) => {
        if (window.confirm('האם אתה בטוח שברצונך להשבית את תפקיד ה\'מאמן\' עבור משתמש זה?')) { // שינוי הודעה
            setLoading(true);
            const roleToDelete = 'coach'; // עבור מאמנים
            const result = await deleteRequest(`users/${instructorId}?roleName=${roleToDelete}`);
            if (result.succeeded) {
                setErrorMessage('');
                fetchInstructors();
            } else {
                setErrorMessage(result.error);
            }
            setLoading(false);
        }
    };

    const handleActivateClick = async (instructorId) => {
        if (window.confirm('האם אתה בטוח שברצונך להפעיל מאמן זה מחדש?')) {
            setLoading(true);
            const result = await putRequest(`users/${instructorId}/activate`);
            if (result.succeeded) {
                setErrorMessage('');
                fetchInstructors();
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
                <h1 className="main-title">רשימת מאמנים 🏋️‍♀️</h1>
                <p className="subtitle">ניהול מאמנים במערכת</p>
            </div>

            <button className="add-button" onClick={handleAddClick}>הוסף מאמן חדש</button>

            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {instructors.length === 0 && !loading ? (
                <p className="no-data-message">אין מאמנים במערכת.</p>
            ) : (
                <table className="list-table">
                    <thead>
                        <tr>
                            <th>שם פרטי</th><th>שם משפחה</th><th>ת"ז</th><th>אימייל</th><th>טלפון</th><th>כתובת</th><th>סטטוס</th><th>פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {instructors.map(instructor => (
                            <tr key={instructor.id} className={!instructor.is_active ? 'inactive-row' : ''}>
                                <td>{instructor.first_name}</td>
                                <td>{instructor.last_name}</td>
                                <td>{instructor.id_number}</td>
                                <td>{instructor.email}</td>
                                <td>{instructor.phone}</td>
                                <td>{`${instructor.street_name || ''} ${instructor.house_number || ''}${instructor.apartment_number ? ', דירה ' + instructor.apartment_number : ''}, ${instructor.city || ''} ${instructor.zip_code || ''} ${instructor.country || ''}`}</td>
                                <td>{instructor.is_active ? 'פעיל' : 'לא פעיל'}</td>
                                <td>
                                    <button className="edit-btn" onClick={() => handleEditClick(instructor)}>ערוך</button>
                                    {instructor.is_active ? (
                                        <button className="delete-btn" onClick={() => handleDeleteClick(instructor.id)}>השבת</button>
                                    ) : (
                                        <button className="activate-btn" onClick={() => handleActivateClick(instructor.id)}>הפעל מחדש</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{currentInstructor ? 'ערוך פרטי מאמן' : 'הוסף מאמן חדש'}</h3>
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
                            {/* כאן אין צורך בסלקט תפקידים, כי זה קבוע ל'מאמן' */}
                            {/* <input type="hidden" name="roleName" value={formData.roleName} /> */}

                            <div className="modal-actions">
                                <button type="submit" disabled={loading}>
                                    {loading ? 'שולח...' : currentInstructor ? 'שמור שינויים' : 'הוסף מאמן'}
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

export default InstructorsList;