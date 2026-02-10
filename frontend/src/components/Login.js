/////////////////
///////////////
//// Iteration 3 - Login Component
///////////////
/////////////////

//file references: https://react.dev/reference/react/useState
//file references: https://axios-http.com/docs/intro
//file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
// file reference : https://www.w3schools.com/REACT/react_usestate.asp
//file reference https://getbootstrap.com/docs/5.3/


// Story 11 - Login component
import React, { useState } from "react";
import axios from "axios";

// onLoginSuccess callback gets called with user data after successful login
const Login = ({ onLoginSuccess }) => {
  // form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  // success/error messages
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  // update form fields
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Story 11 - submit login form
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    // Validate required fields
    if (!formData.email || !formData.password) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      if (response.data && onLoginSuccess) {
        onLoginSuccess(response.data);
      }
      
      setMessage({ type: "success", text: "Login successful! Redirecting..." });
      if (window.showToast) {
        window.showToast("Login successful! Welcome back.", "success", 2000);
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Login failed. Please check your credentials and try again.";
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
              Login
            </h2>
            <p className="text-muted">
              Sign in to your StudyHive account
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
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
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
                      Logging in...
                    </>
                  ) : (
                    "Login"
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
//// End Iteration 3 - Login Component
///////////////
/////////////////

export default Login;
