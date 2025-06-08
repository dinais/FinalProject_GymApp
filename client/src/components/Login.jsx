// src/components/Login.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { CurrentUser, Error } from './App';
import { postRequest, setRefreshTokenInCookies } from '../Requests';
// import '../css/Login.css';

function Login() {
    const [userData, setUserData] = useState({ name: '', password: '' });
    const { setCurrentUser } = useContext(CurrentUser);
    const { setErrorMessage } = useContext(Error);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const requestResult = await postRequest(`login`, userData);
        if (requestResult.succeeded) {
            const user = requestResult.data.user;
            const token = requestResult.data.accessToken;
            const refreshToken = requestResult.data.refreshToken;
            const roles = user.roles || [];

            const userInfo = {
                name: user.name,
                email: user.email,
                address: user.address,
                phone: user.phone,
                id: user.id,
                roles: roles
            };

            setCurrentUser(userInfo);
            localStorage.setItem("currentUser", JSON.stringify(userInfo));
            localStorage.setItem("token", token);
            setRefreshTokenInCookies(refreshToken);

            // לא מבצעים ניווט – נשארים באפליקציה עד בחירת תפקיד
        } else {
            setErrorMessage(requestResult.error);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Username</label>
                    <input
                        required
                        type="text"
                        id="name"
                        placeholder="Enter your username"
                        value={userData.name}
                        onChange={(e) =>
                            setUserData((prev) => ({ ...prev, name: e.target.value }))
                        }
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        required
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        value={userData.password}
                        onChange={(e) =>
                            setUserData((prev) => ({ ...prev, password: e.target.value }))
                        }
                    />
                </div>
                <button type="submit" className="login-button">Login</button>
            </form>
            <Link to="/register">Register</Link>
        </div>
    );
}

export default Login;
