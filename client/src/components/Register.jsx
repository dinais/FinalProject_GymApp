import React, { useState, useContext } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { CurrentUser, Error } from './App';
import { postRequest } from '../Requests';

function RegistrationPermission() {
  const { setCurrentUser } = useContext(CurrentUser);
 const { errorMessage, setErrorMessage } = useContext(Error);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: '',
    address: "",
    phone: '',
    password: "",
  });

  const submitFullForm = async () => {
    setErrorMessage('');  // נקה הודעות שגיאה לפני שליחה
    try {
      // שליחת הנתונים עם שמות שדות מדויקים לשרת
      const requestResult = await postRequest('register', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        gmail: formData.email,
        address: formData.address,
        phone: formData.phone,
        password: formData.password,
      });

      if (requestResult.succeeded) {
        // יוצרים אובייקט משתמש עם השדות הנכונים
        const { first_name, last_name, email, address, phone } = formData;
        const userObject = {
          first_name,
          last_name,
          email,
          address,
          phone,
          id: requestResult.data.user.id,
          roles: []
        };

        localStorage.setItem("currentUser", JSON.stringify(userObject));
        setCurrentUser(userObject);

        localStorage.setItem("token", requestResult.data.accessToken);

        navigate(`/users/${requestResult.data.user.id}/home`);
      } else {
        setErrorMessage(requestResult.error || 'Registration failed');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Unexpected error during registration');
    }
  };

  const handleFullFormSubmit = (e) => {
    e.preventDefault();
    submitFullForm();
  };

  return (
    <div className="login-container">
      <h2>Registration</h2>
      <form className="form-container" onSubmit={handleFullFormSubmit}>
        <div className="form-group">
          <label>First Name:</label>
          <input
            required
            type="text"
            value={formData.first_name}
            onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label>Last Name:</label>
          <input
            required
            type="text"
            value={formData.last_name}
            onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
          />
        </div>

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
          <label>Address:</label>
          <input
            required
            type="text"
            value={formData.address}
            onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label>Phone:</label>
          <input
            required
            type="tel"
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
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

        <button className="form-button" type="submit">Register</button>
      </form>

      <Link to="/login">Already have an account? Login</Link>
      {errorMessage && <div className="error-message">{errorMessage}</div>}


    </div>
  );
}

export default RegistrationPermission;
