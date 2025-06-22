import React, { useState, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { CurrentUser, Error } from './App';
import { postRequest } from '../Requests';
import '../css/login.css'; // הוספת הCSS

function Login() {
    const { setCurrentUser, setCurrentRole } = useContext(CurrentUser);
    const { errorMessage, setErrorMessage } = useContext(Error);
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ email: '', password: '' });

const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
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

            // שמירה בטוקן
            localStorage.setItem("token", token);

            // !!! כאן - לפני הכל - איפוס תפקיד קודם
            localStorage.removeItem("selectedRole");

            // המשך רגיל
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
            setErrorMessage(requestResult.error || 'Login failed');
        }
    } catch (error) {
        setErrorMessage(error.message || 'Unexpected error during login');
    }
};


    return (
        <div className="login-container">
            <h2>Login</h2>
            <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        required
                        type="email"
                        value={userData.email}
                        onChange={e => setUserData(prev => ({ ...prev, email: e.target.value }))}
                    />
                </div>
                
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        required
                        type="password"
                        value={userData.password}
                        onChange={e => setUserData(prev => ({ ...prev, password: e.target.value }))}
                    />
                </div>
                
                <button type="submit" className="login-button">Login</button>
            </form>
            
            <Link to="/register">Don't have an account? Register</Link>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
}

export default Login;