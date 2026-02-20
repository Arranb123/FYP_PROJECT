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
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "learner",
    modules: "",
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

    // Iteration 5 - Require first and last name for learners
    if (formData.role === 'learner' && (!formData.first_name.trim() || !formData.last_name.trim())) {
      setMessage({ type: "error", text: "Please enter your first and last name." });
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

    // Iteration 5 - Validate module format (2 letters + 4 digits, e.g. IS5543)
    if (formData.role === 'learner' && formData.modules.trim()) {
      const modulePattern = /^[A-Za-z]{2}\d{4}$/;
      const modulesList = formData.modules.split(',').map(m => m.trim()).filter(m => m.length > 0);
      const invalid = modulesList.filter(m => !modulePattern.test(m));
      if (invalid.length > 0) {
        setMessage({ type: "error", text: `Invalid module code(s): ${invalid.join(', ')}. Format must be 2 letters followed by 4 numbers (e.g. IS5543).` });
        return;
      }
    }

    setSubmitting(true);
    try {
      // Send registration data to backend
      // Iteration 5 - Send modules when registering as a learner
      const response = await axios.post("http://127.0.0.1:5000/api/auth/register", {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        first_name: formData.role === 'learner' ? formData.first_name.trim() : undefined,
        last_name: formData.role === 'learner' ? formData.last_name.trim() : undefined,
        modules: formData.role === 'learner' ? formData.modules : undefined,
      });

      // If successful, call the onRegisterSuccess callback with user data
      if (response.data && onRegisterSuccess) {
        // Pass both the response data and the role to the callback
        onRegisterSuccess({ ...response.data, role: formData.role });
      }
      
      // Show success message (will be overridden if tutor)
      if (formData.role !== 'tutor') {
        setMessage({ type: "success", text: "Registration successful! You can now log in." });
        if (window.showToast) {
          window.showToast("Registration successful! You can now log in.", "success", 3000);
        }
      }
      
      // Clear form after successful registration
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "learner",
        modules: "",
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
                {/* Iteration 5 - Name fields shown for learners */}
                {formData.role === 'learner' && (
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" htmlFor="first_name">
                        First Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="first_name"
                        name="first_name"
                        placeholder="Enter your first name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" htmlFor="last_name">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="last_name"
                        name="last_name"
                        placeholder="Enter your last name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                )}

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

                {/* Iteration 5 - Modules input shown only for learners */}
                {formData.role === 'learner' && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold" htmlFor="modules">
                      Modules You're Studying
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="modules"
                      name="modules"
                      placeholder="e.g. IS5543, AC4401, MA4402 (comma-separated)"
                      value={formData.modules}
                      onChange={handleChange}
                    />
                    <small className="text-muted">
                      Optional — you can add or change these later. Format: 2 letters + 4 numbers (e.g. IS5543). Separate with commas.
                    </small>
                  </div>
                )}

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
