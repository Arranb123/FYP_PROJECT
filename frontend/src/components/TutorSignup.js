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
import React, { useState } from "react"; // useState is a hook that allows me to store and update data
import axios from "axios"; // axios is a library for http requests

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
  // Iteration 3 - Pre-fill email if coming from registration
  const [formData, setFormData] = useState(() => {
    const pendingEmail = sessionStorage.getItem('pendingTutorEmail');
    return {
      first_name: "",//field
      last_name: "",//field
      college_email: pendingEmail || "",//field - pre-fill if from registration
      modules: "",//field
      hourly_rate: "",//field
      rating: "",//field
      bio: "",//field
    };
  });
  // Story 15 - File upload state for proof documents
  const [proofFile, setProofFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [message, setMessage] = useState("");

  //also chat gpt same as in app.js file just tailored     // Original structure of this function was adapted from a ChatGPT example
                                                          // //  customised by me.
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  //Chat GPT ends here 

  // Story 15 - Handle file selection for proof documents
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage("File size must be less than 10MB.");
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    
    try {  // sends tutor form data to backend backend adds the tutor to the database with 'verified = 0' so that an admin has to approve them first
      // Iteration 2 - Enhanced data preparation with parseFloat
      // Validate required fields before submitting
      if (!formData.first_name || !formData.last_name || !formData.college_email || !formData.modules || !formData.hourly_rate) {
        setMessage("Please fill in all required fields (First Name, Last Name, Email, Modules, Hourly Rate).");
        return;
      }

      // Iteration 5 - Validate module code format (2 letters + 4 digits, e.g. IS5543)
      const modulePattern = /^[A-Za-z]{2}\d{4}$/;
      const moduleList = formData.modules.split(',').map(m => m.trim()).filter(m => m.length > 0);
      const invalidModules = moduleList.filter(m => !modulePattern.test(m));
      if (invalidModules.length > 0) {
        setMessage(`Invalid module code(s): ${invalidModules.join(', ')}. Format must be 2 letters followed by 4 numbers (e.g. IS5543).`);
        return;
      }
      
      // Story 15 - Convert file to base64 for database storage
      let proofDocBase64 = '';
      if (proofFile) {
        setUploadingFile(true);
        
        try {
          // Convert file to base64 string for database storage
          const reader = new FileReader();
          await new Promise((resolve, reject) => {
            reader.onload = (e) => {
              // Remove data URL prefix (e.g., "data:image/png;base64,")
              const base64String = e.target.result.split(',')[1] || e.target.result;
              proofDocBase64 = base64String;
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(proofFile);
          });
        } catch (fileError) {
          // Don't block form submission if file conversion fails
          proofDocBase64 = ''; // Submit without file
        } finally {
          setUploadingFile(false);
        }
      }
      
      const tutorData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        college_email: formData.college_email.trim(),
        modules: formData.modules.trim(),
        hourly_rate: parseFloat(formData.hourly_rate),
        rating: 0,  // Default rating, not from form
        bio: formData.bio ? formData.bio.trim() : '',
        verified: 0, // tutors start unverified , admin must approve
        proof_doc: proofDocBase64,  // Story 15 - Base64 encoded file data stored in database
      };
      
      // Validate hourly_rate is a valid number
      if (isNaN(tutorData.hourly_rate) || tutorData.hourly_rate <= 0) {
        setMessage("Please enter a valid hourly rate (must be a positive number).");
        return;
      }
      
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/tutors`, tutorData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000  // 10 second timeout
      });
      
      
      if (response.status === 201) {  // if flask returns 201 it means that the tutor added successfully
        // Iteration 3 - Show enhanced success message
        setMessage("Tutor profile created successfully! Waiting for admin approval. Your tutor profile has been linked to your account. Please log in to continue.");
        
        // Clear pending email from sessionStorage
        sessionStorage.removeItem('pendingTutorEmail');
        
        setFormData({ // and resets the form for a new tutor
          first_name: "",
          last_name: "",
          college_email: "",
          modules: "",
          hourly_rate: "",
          rating: "",
          bio: "",
        });
        setProofFile(null);  // Story 15 - Clear file selection
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
        // Iteration 3 - If user is logged in, refresh their user data
        // Check if there's a current user in localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            // If the email matches, refresh the page to get updated user data
            if (user.email && user.email.toLowerCase() === tutorData.college_email.toLowerCase()) {
              // Wait a moment for the backend to finish linking, then refresh
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
            }
          } catch (error) {
            console.error("Error parsing stored user:", error);
          }
        } else {
          // If not logged in (coming from registration), redirect to login after 3 seconds
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }
      }
    } catch (error) { //if an error is caught eg duplicate it cathes it and displays error message
      console.error("Error in tutor signup process:", error);
      
      // Better error handling for network errors
      let errorMessage = "Error registering tutor. Please try again.";
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        errorMessage = "Network Error: Cannot connect to server. Please make sure the Flask server is running on ${process.env.REACT_APP_API_URL}";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage(errorMessage);
      setUploadingFile(false);
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
            {/* Iteration 3 - Show message if user came from registration */}
            {sessionStorage.getItem('pendingTutorEmail') && (
              <div className="alert alert-info mb-3">
                <strong>Almost there!</strong> Please complete your tutor profile below. Make sure to use the same email you just registered with.
              </div>
            )}
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
                    <small className="text-muted">
                      <strong>Important:</strong> Use the SAME email address you used when registering your account. 
                      This links your tutor profile to your account.
                    </small>
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
                      placeholder="e.g. IS5543, AC4401, MA4402 (comma-separated)"
                      value={formData.modules}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted">Format: 2 letters + 4 numbers (e.g. IS5543). Separate with commas.</small>
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

                  {/* Story 15 - Proof document upload field */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small text-muted">Proof of Qualification (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx"
                      onChange={handleFileChange}
                    />
                    <small className="text-muted">
                      Upload a document proving your qualifications (e.g., transcript, certificate). 
                      Accepted formats: PDF, Images, Word documents. Max size: 10MB.
                    </small>
                    {proofFile && (
                      <div className="mt-2">
                        <span className="badge bg-success">File selected: {proofFile.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Iteration 2 - Enhanced submit button */}
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 btn-lg"
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Uploading document...
                    </>
                  ) : (
                    "Register as Tutor"
                  )}
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

// Story 15 - File upload functionality added to TutorSignup
// End Iteration 3 additions

/////////////////
///////////////
//// End OF ITERATION 1 CODE
////////////////
/////////////////

export default TutorSignup;
