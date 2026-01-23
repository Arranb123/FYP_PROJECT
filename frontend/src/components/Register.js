/////////////////
///////////////
//// Iteration 3 - Register Component
///////////////
/////////////////

//file references: https://react.dev/reference/react/useState
//file references: https://axios-http.com/docs/intro
//file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
// file reference : https://www.w3schools.com/REACT/react_usestate.asp
//file reference https://getbootstrap.com/docs/5.3/

// Story 11 - Registration component
import React, { useState } from "react";
import axios from "axios";

const Register = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "learner",
  });
  
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Story 11 - submit registration
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    setSubmitting(true);
    try {
      // Send registration data to backend
      const response = await axios.post("http://127.0.0.1:5000/api/auth/register", {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      // If successful, call the onRegisterSuccess callback with user data
      if (response.data && onRegisterSuccess) {
        // Pass both the response data and the role to the callback
        onRegisterSuccess({ ...response.data, role: formData.role });
      }
      
      // Show success message (will be overridden if tutor)
      if (formData.role !== 'tutor') {
        setMessage({ type: "success", text: "Registration successful! You can now log in." });
      }
      
      // Clear form after successful registration
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        role: "learner",
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Registration failed. Please try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          {/* Page header with logo */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <img 
                src="/logo.png" 
                alt="StudyHive Logo" 
                className="logo-page-header"
                style={{ 
                  height: "80px", 
                  objectFit: "contain"
                }} 
                onError={(e) => {
                  // If logo doesn't load, hide it
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h2 className="mb-2 fw-bold" style={{ fontSize: "2rem" }}>
              Create Account
            </h2>
            <p className="text-muted">
              Sign up for a StudyHive account
            </p>
          </div>

          {/* Form card */}
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Email input field */}
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="email">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    placeholder="your.email@college.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password input field */}
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="password">
                    Password *
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                  <small className="text-muted">Password must be at least 6 characters long</small>
                </div>

                {/* Confirm Password input field */}
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="confirmPassword">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                </div>

                {/* Role selection field */}
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="role">
                    Account Type *
                  </label>
                  <select
                    className="form-select"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="learner">Learner (Student seeking tutoring)</option>
                    <option value="tutor">Tutor (Want to teach)</option>
                    <option value="admin">Admin (Platform administrator)</option>
                  </select>
                  <small className="text-muted">Select your account type</small>
                </div>

                {/* Show success/error message if there is one */}
                {message.text && (
                  <div className={`alert alert-dismissible fade show ${message.type === "success" ? "alert-success" : "alert-danger"}`} role="alert">
                    {message.text}
                    <button type="button" className="btn-close" onClick={() => setMessage({ type: "", text: "" })} aria-label="Close"></button>
                  </div>
                )}

                {/* Submit button */}
                <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/////////////////
///////////////
//// End Iteration 3 - Register Component
///////////////
/////////////////

export default Register;
