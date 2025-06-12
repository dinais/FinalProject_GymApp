import React, { useState, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { CurrentUser, Error } from './App';
import { postRequest } from '../Requests';

function Login() {
  const { setCurrentUser } = useContext(CurrentUser);
  const { errorMessage, setErrorMessage } = useContext(Error);
  const navigate = useNavigate();

  const [userData, setUserData] = useState({ gmail: '', password: '' });

  const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage('');
  try {
    console.log("Sending login request with", userData);
    const requestResult = await postRequest('users/login', userData);
    console.log("Login response:", requestResult);

    if (requestResult.succeeded) {
      const user = requestResult.data.user;
      const token = requestResult.data.accessToken;
      const refreshToken = requestResult.data.refreshToken;
      console.log("User:", user, "Token:", token);

      const userInfo = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.gmail,
        address: user.address,
        phone: user.phone,
        id: user.id,
        roles: user.roles || []
      };

      setCurrentUser(userInfo);
      localStorage.setItem("currentUser", JSON.stringify(userInfo));
      localStorage.setItem("token", token);

      navigate('/dashboard'); // הוספתי ניווט לדף דמו
    } else {
      setErrorMessage(requestResult.error || 'Login failed');
    }
  } catch (error) {
    console.error("Login error:", error);
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
            value={userData.gmail}
            onChange={e => setUserData(prev => ({ ...prev, gmail: e.target.value }))}
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
