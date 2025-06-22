import React, { useState, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { CurrentUser, Error } from './App';
import { postRequest } from '../Requests';

function RegistrationPermission() {
    const { setCurrentUser, setCurrentRole } = useContext(CurrentUser); // הוסף setCurrentRole
    const { errorMessage, setErrorMessage } = useContext(Error);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!formData.email || !formData.password || !formData.confirmPassword) {
            setErrorMessage('All fields are required.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        try {
            const requestResult = await postRequest('users/initial-login-or-password-setup', {
                email: formData.email,
                password: formData.password,
            });

            if (requestResult.succeeded) {
                // 1. קח גם את ה-refreshToken מהתגובה!
                const { accessToken, refreshToken, user } = requestResult.data; // 👈 שינוי כאן

                // 2. שמור את כל הנתונים ב-localStorage
                localStorage.setItem("currentUser", JSON.stringify(user));
                setCurrentUser(user);
                localStorage.setItem("token", accessToken);
                localStorage.setItem("refreshToken", refreshToken); // 👈 שמור את ה-Refresh Token

                // 3. לוגיקת ניווט זהה לזו שב-Login.jsx
                if (user.roles && user.roles.length === 1) {
                    const role = user.roles[0];
                    setCurrentRole(role);
                    localStorage.setItem("selectedRole", role);
                    navigate('/'); // נווט לדף הבית או לבחירת תפקיד אם יש רק אחד
                } else {
                    navigate('/RoleSelector'); // נווט לבחירת תפקיד אם יש יותר מאחד או אפס
                }

            } else {
                // 4. טיפול בהפניה למסך לוגין אם המשתמש כבר רשום (מגיע מה-BL דרך הקונטרולר)
                if (requestResult.error && requestResult.error.includes('כבר רשום') && requestResult.redirectToLogin) {
                    setErrorMessage(requestResult.error);
                    navigate('/login'); // הפנה למסך לוגין
                } else {
                    setErrorMessage(requestResult.error || 'Operation failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error during password setup/login:', error);
            setErrorMessage(error.message || 'An unexpected error occurred.');
        }
    };

    return (
        <div className="login-container">
            <h2>Set Your Password or Login</h2> {/* כותרת מעודכנת */}
            <form className="form-container" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                </div>

                <div className="form-group">
                    <label>Password:</label>
                    <input
                        required
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                </div>

                <div className="form-group">
                    <label>Confirm Password:</label>
                    <input
                        required
                        type="password"
                        value={formData.confirmPassword}
                        onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                </div>

                <button className="form-button" type="submit">Submit</button>
            </form>

            <Link to="/login">Already have an account? Login</Link>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
}

export default RegistrationPermission;