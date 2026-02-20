/////////////////
///////////////
//// Iteration 3 - Tutor Profile Edit Component
///////////////
/////////////////

//file references: https://react.dev/reference/react/useState
//file references: https://axios-http.com/docs/intro
//file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
// file reference : https://www.w3schools.com/REACT/react_usestate.asp
//file reference https://getbootstrap.com/docs/5.3/

// Story 10 - tutor profile edit
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const TutorProfileEdit = ({ tutorId }) => {
  // STATE VARIABLES
  
  // This object stores the form data for the tutor profile
  const [formData, setFormData] = useState({
    modules: "",
    hourly_rate: "",
    bio: "",
  });
  
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tutorInfo, setTutorInfo] = useState(null);

  // Story 10 - get tutor info
  const fetchTutorInfo = useCallback(async () => {
    if (!tutorId) return;

    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/tutors/${tutorId}`);
      const tutor = res.data;

      if (tutor) {
        setTutorInfo(tutor);
        setFormData({
          modules: tutor.modules || "",
          hourly_rate: tutor.hourly_rate || "",
          bio: tutor.bio || "",
        });
      } else {
        setMessage({ type: "error", text: "Tutor not found" });
      }
    } catch (error) {
      console.error("Error fetching tutor info:", error);
      const errorMessage = error?.response?.data?.error || "Failed to load tutor information";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Story 10 - update profile
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!formData.modules || !formData.hourly_rate) {
      setMessage({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    // Iteration 5 - Validate module code format (2 letters + 4 digits, e.g. IS5543)
    const modulePattern = /^[A-Za-z]{2}\d{4}$/;
    const moduleList = formData.modules.split(',').map(m => m.trim()).filter(m => m.length > 0);
    const invalidModules = moduleList.filter(m => !modulePattern.test(m));
    if (invalidModules.length > 0) {
      setMessage({ type: "error", text: `Invalid module code(s): ${invalidModules.join(', ')}. Format must be 2 letters followed by 4 numbers (e.g. IS5543).` });
      return;
    }

    const hourlyRate = parseFloat(formData.hourly_rate);
    if (isNaN(hourlyRate) || hourlyRate <= 0) {
      setMessage({ type: "error", text: "Hourly rate must be a positive number." });
      return;
    }

    setSubmitting(true);
    try {
      await axios.put(`http://127.0.0.1:5000/api/tutors/${tutorId}`, {
        modules: formData.modules,
        hourly_rate: hourlyRate,
        bio: formData.bio || "",
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
      fetchTutorInfo();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update profile. Please try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  // Story 10 - load tutor info on mount
  useEffect(() => {
    fetchTutorInfo();
  }, [fetchTutorInfo]);

  return (
    <div className="container">
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
          Edit My Profile
        </h2>
        <p className="text-muted">
          Update your teaching information and profile details
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="alert alert-info d-flex align-items-center">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Loading profile information...
        </div>
      )}

      {/* Form card */}
      {!loading && tutorInfo && (
        <div className="card shadow-sm">
          <div className="card-body p-4">
            {/* Show current tutor info */}
            <div className="mb-4 p-3 bg-light rounded">
              <h5 className="fw-semibold mb-3">Current Profile</h5>
              <div className="row g-2">
                <div className="col-md-6">
                  <small className="text-muted d-block">Name</small>
                  <strong>{tutorInfo.first_name} {tutorInfo.last_name}</strong>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block">Email</small>
                  <strong>{tutorInfo.college_email}</strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Teaching Information Section */}
              <div className="mb-4">
                <h5 className="fw-semibold mb-3 text-primary">Teaching Information</h5>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="modules">
                    Modules You Teach *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="modules"
                    name="modules"
                    placeholder="e.g. IS5543, AC4401, MA4402 (comma-separated)"
                    value={formData.modules}
                    onChange={handleChange}
                    required
                  />
                  <small className="text-muted">Format: 2 letters + 4 numbers (e.g. IS5543). Separate with commas.</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="hourly_rate">
                    Hourly Rate (€) *
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">€</span>
                    <input
                      type="number"
                      className="form-control"
                      id="hourly_rate"
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

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="bio">
                    Short Bio
                  </label>
                  <textarea
                    className="form-control"
                    id="bio"
                    name="bio"
                    placeholder="Tell students about your teaching experience, qualifications, and teaching style..."
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                  />
                  <small className="text-muted">Help students get to know you better</small>
                </div>
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
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Error state if tutor not found */}
      {!loading && !tutorInfo && (
        <div className="alert alert-danger">
          {message.text || "Tutor not found. Please check the tutor ID."}
        </div>
      )}
    </div>
  );
};

/////////////////
///////////////
//// End Iteration 3 - Tutor Profile Edit Component
///////////////
/////////////////

export default TutorProfileEdit;
