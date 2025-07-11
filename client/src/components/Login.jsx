import React, { useState, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { CurrentUser, Error } from './App';
import { postRequest } from '../Requests';
import '../css/login.css';

function Login() {
    const { setCurrentUser, setCurrentRole } = useContext(CurrentUser);
    const { errorMessage, setErrorMessage } = useContext(Error);
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            const requestResult = await postRequest('users/login', userData);
            if (requestResult.succeeded) {
                const user = requestResult.data.user;
                const token = requestResult.data.accessToken;
                const userInfo = {
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    phone: user.phone,
                    id: user.id,
                    id_number: user.id_number,
                    street_name: user.street_name,
                    house_number: user.house_number,
                    apartment_number: user.apartment_number,
                    city: user.city,
                    zip_code: user.zip_code,
                    country: user.country,
                    is_active: user.is_active,
                    roles: user.roles || []
                };
                localStorage.setItem("token", token);
                localStorage.removeItem("selectedRole");
                localStorage.setItem("currentUser", JSON.stringify(userInfo));
                setCurrentUser(userInfo);
                if (userInfo.roles.length === 1) {
                    const role = userInfo.roles[0];
                    setCurrentRole(role);
                    localStorage.setItem("selectedRole", role);
                    navigate('/');
                } else {
                    navigate('/RoleSelector');
                }
            } else {
                setErrorMessage(requestResult.error || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            setErrorMessage(error.message || 'An unexpected error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        required
                        type="email"
                        value={userData.email}
                        onChange={e => setUserData(prev => ({ ...prev, email: e.target.value }))}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        required
                        type="password"
                        value={userData.password}
                        onChange={e => setUserData(prev => ({ ...prev, password: e.target.value }))}
                    />
                </div>

                <button
                    type="submit"
                    className={`submit-button ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? '' : 'Login'}
                </button>
            </form>

            <Link to="/register" className="link-text">Don't have an account? Register</Link>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
}

export default Login;