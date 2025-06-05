import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom"
import { CurrentUser, Error } from './App';
import { postRequest, setRefreshTokenInCookies } from '../Requests';
import '../css/Login.css';


function Login() {
    const [userData, setUserData] = useState({ name: '', password: '' });
    const { currentUser, setCurrentUser } = useContext(CurrentUser);
    const { setErrorMessage } = useContext(Error);
    const navigate = useNavigate();
    useEffect(() => {
        if (currentUser) {
            navigate(`/users/${currentUser.id}/home`);
        }
    }, [currentUser])
    const handleSubmit = async (e) => {
        e.preventDefault();
        const requestResult = await postRequest(`login`, userData)
        if (requestResult.succeeded) {
            console.log(requestResult.data);
            localStorage.setItem("currentUser", JSON.stringify({ name: requestResult.data.user.name, email: requestResult.data.user.email, address: requestResult.data.user.address, phone: requestResult.data.user.phone, id: requestResult.data.user.id }));
            setCurrentUser({ name: requestResult.data.user.name, email: requestResult.data.user.email, address: requestResult.data.user.address, phone: requestResult.data.user.phone, id: requestResult.data.user.id });
            localStorage.setItem("token", requestResult.data.accessToken);
            console.log(requestResult.data.accessToken);
            setRefreshTokenInCookies(requestResult.data.refreshToken);
            navigate(`/users/${requestResult.data.userId}/home`);
        } else {
            setErrorMessage(requestResult.error)
        }
    };
    return (
        <>
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
                            onChange={(e) => setUserData((prev) => ({
                                ...prev,
                                name: e.target.value
                            }))}
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
                            onChange={(e) => setUserData((prev) => ({
                                ...prev,
                                password: e.target.value
                            }))}
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                </form>
                <Link to="/register">Register</Link>
            </div>
        </>
    );
}

export default Login;
