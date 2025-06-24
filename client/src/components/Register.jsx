import React, { useState, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { CurrentUser, Error } from './App';
import { postRequest } from '../Requests';
import '../css/login.css'; 

function RegistrationPermission() {
    const { setCurrentUser, setCurrentRole } = useContext(CurrentUser);
    const { errorMessage, setErrorMessage } = useContext(Error);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true); 

        if (!formData.email || !formData.password || !formData.confirmPassword) {
            setErrorMessage('All fields are required.'); 
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setErrorMessage('Passwords do not match.'); 
            setIsLoading(false);
            return;
        }

        try {
            const requestResult = await postRequest('users/initial-login-or-password-setup', {
                email: formData.email,
                password: formData.password,
            });

            if (requestResult.succeeded) {
                const { accessToken, refreshToken, user } = requestResult.data; 

                localStorage.setItem("currentUser", JSON.stringify(user));
                setCurrentUser(user);
                localStorage.setItem("token", accessToken);
                localStorage.setItem("refreshToken", refreshToken); 

                if (user.roles && user.roles.length === 1) {
                    const role = user.roles[0];
                    setCurrentRole(role);
                    localStorage.setItem("selectedRole", role);
                    navigate('/');
                } else {
                    navigate('/RoleSelector');
                }

            } else {
                if (requestResult.error && requestResult.error.includes('כבר רשום') && requestResult.redirectToLogin) {
                    setErrorMessage(requestResult.error);
                    navigate('/login');
                } else {
                    setErrorMessage(requestResult.error || 'Operation failed. Please try again.'); 
                }
            }
        } catch (error) {
            console.error('Error during password setup/login:', error);
            setErrorMessage(error.message || 'An unexpected error occurred.'); 
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div className="auth-container">
            <h2>Set Your Password</h2> 
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email:</label> 
                    <input
                        id="email"
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password:</label> 
                    <input
                        id="password"
                        required
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password:</label> 
                    <input
                        id="confirmPassword"
                        required
                        type="password"
                        value={formData.confirmPassword}
                        onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                </div>

                <button 
                    className={`submit-button ${isLoading ? 'loading' : ''}`}
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? '' : 'Submit'} 
                </button>
            </form>

            <Link to="/login" className="link-text">Already have an account? Login</Link> 
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
}

export default RegistrationPermission;