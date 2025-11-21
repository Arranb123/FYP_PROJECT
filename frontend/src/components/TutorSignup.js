// StudyHive Frontend – Iteration 1
// Tutor Signup Component
// Author: Arran Ethan Bearman

// Imports
// 
// Reference (React Hooks):
// React Docs (2025) "useState Hook" — https://react.dev/reference/react/useState
// Used to track and update form input values dynamically.
//
// Reference (Axios HTTP Library):
// Axios Docs (2025) "Making Requests" — https://axios-http.com/docs/intro
// Used to send POST requests to the Flask backend API.
import React, { useState } from "react"; /// use state is ahook that allows me to store and update data
import axios from "axios";//axios uis a library for http requests

/////////////////
///////////////
//// START OF ITERATION 1 CODE
///////////////
/////////////////

// Functional component responsible for tutor registration.
// When a tutor submits the form, data is sent to Flask via POST request.
// Tutors are created with verified = 0, meaning an admin must approve them
// before they appear in the learner search page.
//reference ,mdn resource for develpers (2025) https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch used throughout majority of file to assist with 
//understanding how to make HTTP requests (GET, POST, PUT, DELETE) to the Flask backend, handle JSON responses, and update React state based on returned data.
// https://chatgpt.com/share/690e59df-25d0-8008-adf5-047c79f8f362 - -- Chat Gpt conversation used to lead me in the right direction to be able to adapt code myself
const TutorSignup = () => {  
  const [formData, setFormData] = useState({    //form data stores , setformdata updates when user types
    first_name: "",//field
    last_name: "",//field
    college_email: "",//field
    modules: "",//field
    hourly_rate: "",//field
    rating: "",//field
    bio: "",//field
  });
  const [message, setMessage] = useState("");

  //also chat gpt same as in app.js file just tailored     // Original structure of this function was adapted from a ChatGPT example
                                                          // //  customised by me.
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  //Chat GPT ends here 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    
    try {  // sends tutor form data to backend backend adds the tutor to the database with 'verified = 0' so that an admin has to approve them first
      // Iteration 2 - Enhanced data preparation with parseFloat
      const tutorData = {
        ...formData,
        hourly_rate: parseFloat(formData.hourly_rate),
        verified: 0, // tutors start unverified , admin mist approve
      };
      const response = await axios.post("http://127.0.0.1:5000/api/tutors", tutorData);
      if (response.status === 201) {  // if flask returns 201 it means that the tutor added succesfully
        // Iteration 2 - Enhanced success message
        setMessage("Tutor registered successfully! Waiting for admin approval.");
        setFormData({ // amd restes the form for a new tutor
          first_name: "",
          last_name: "",
          college_email: "",
          modules: "",
          hourly_rate: "",
          rating: "",
          bio: "",
        });
      }
    } catch (error) { //if an error is caught eg duplicate it cathes it and displays error message
      console.error("Error adding tutor:", error);
      // Iteration 2 - Enhanced error handling
      const errorMessage = error.response?.data?.error || "Error registering tutor. Please try again.";
      setMessage(errorMessage);
    }
  };

// Reference:
  // W3Schools (2025)  — https://www.w3schools.com
  // JSX allows HTML, JS, and CSS to be written together to build a dynamic form.
  // Displays the signup form and a feedback message (success or error).
  // 82-175~
  return (
    // Iteration 2 - Enhanced container with Bootstrap styling
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          {/* Iteration 2 - Page header with logo */}
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
              Tutor Sign-Up
            </h2>
            {/* Iteration 2 - Subtitle */}
            <p className="text-muted">
              Join our platform and help students succeed! Fill out the form below to get started.
            </p>
          </div>

          {/* Iteration 2 - Enhanced form card */}
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Iteration 2 - Personal Information Section */}
                <div className="mb-4">
                  <h5 className="fw-semibold mb-3 text-primary">Personal Information</h5>
                  
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="first_name"
                        placeholder="Enter your first name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="last_name"
                        placeholder="Enter your last name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">College Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="college_email"
                      placeholder="your.email@college.edu"
                      value={formData.college_email}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted">This will be used to verify your identity</small>
                  </div>
                </div>

                {/* Iteration 2 - Teaching Information Section */}
                <div className="mb-4">
                  <h5 className="fw-semibold mb-3 text-primary">Teaching Information</h5>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Modules You Teach *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="modules"
                      placeholder="e.g. Mathematics, Physics, Chemistry (comma-separated)"
                      value={formData.modules}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted">Separate multiple modules with commas</small>
                  </div>

                  {/* Iteration 2 - Enhanced hourly rate input with euro symbol */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Hourly Rate (€) *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">€</span>
                      <input
                        type="number"
                        className="form-control"
                        name="hourly_rate"
                        placeholder="25.00"
                        min="0"
                        step="0.50"
                        value={formData.hourly_rate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <small className="text-muted">Set your hourly tutoring rate</small>
                  </div>

                  {/* Iteration 2 - Enhanced bio textarea */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Short Bio</label>
                    <textarea
                      className="form-control"
                      name="bio"
                      placeholder="Tell students about your teaching experience, qualifications, and teaching style..."
                      value={formData.bio}
                      onChange={handleChange}
                      rows="4"
                    />
                    <small className="text-muted">Help students get to know you better</small>
                  </div>
                </div>

                {/* Iteration 2 - Enhanced submit button */}
                <button type="submit" className="btn btn-primary w-100 btn-lg">
                  Register as Tutor
                </button>

                {/* Iteration 2 - Info message about approval process */}
                <div className="alert alert-info mt-3 mb-0" style={{ fontSize: "0.875rem" }}>
                  <strong>Note:</strong> Your application will be reviewed by an administrator. 
                  You'll be notified once your account is verified.
                </div>
              </form>

              {/* Iteration 2 - Enhanced message display */}
              {message && (
                <div className={`alert alert-dismissible fade show mt-3 ${message.includes("successfully") ? "alert-success" : "alert-danger"}`} role="alert">
                  {message}
                  <button type="button" className="btn-close" onClick={() => setMessage("")} aria-label="Close"></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/////////////////
///////////////
//// End OF ITERATION 1 CODE
////////////////
/////////////////

export default TutorSignup;
