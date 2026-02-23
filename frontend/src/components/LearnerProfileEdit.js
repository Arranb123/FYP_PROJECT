// Iteration 5 - Learner Profile Edit Component
// Allows learners to update their name and modules they are studying
//
// References:
// file references: https://react.dev/reference/react/useState
// file references: https://react.dev/reference/react/useCallback
// file references: https://axios-http.com/docs/intro
// file reference: https://getbootstrap.com/docs/5.3/

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const LearnerProfileEdit = ({ learnerId }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    modules: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [learnerInfo, setLearnerInfo] = useState(null);

  // Fetch current learner info
  const fetchLearnerInfo = useCallback(async () => {
    if (!learnerId) return;

    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/students/${learnerId}`);
      const learner = res.data;

      if (learner) {
        setLearnerInfo(learner);
        setFormData({
          first_name: learner.first_name || "",
          last_name: learner.last_name || "",
          modules: learner.modules || "",
        });
      } else {
        setMessage({ type: "error", text: "Learner not found" });
      }
    } catch (error) {
      console.error("Error fetching learner info:", error);
      const errorMessage = error?.response?.data?.error || "Failed to load learner information";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Remove a single module by index
  const removeModule = (indexToRemove) => {
    const modulesList = formData.modules.split(',').map(m => m.trim()).filter(m => m.length > 0);
    const updated = modulesList.filter((_, i) => i !== indexToRemove).join(', ');
    setFormData((prev) => ({ ...prev, modules: updated }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    // Validate module format (2 letters + 4 digits, e.g. IS5543)
    if (formData.modules.trim()) {
      const modulePattern = /^[A-Za-z]{2}\d{4}$/;
      const mods = formData.modules.split(',').map(m => m.trim()).filter(m => m.length > 0);
      const invalid = mods.filter(m => !modulePattern.test(m));
      if (invalid.length > 0) {
        setMessage({ type: "error", text: `Invalid module code(s): ${invalid.join(', ')}. Format must be 2 letters followed by 4 numbers (e.g. IS5543).` });
        return;
      }
    }

    setSubmitting(true);
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/students/${learnerId}`, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        college_email: learnerInfo.college_email,
        modules: formData.modules,
      });

      setMessage({ type: "success", text: "Profile updated successfully!" });
      if (window.showToast) {
        window.showToast("Profile updated successfully!", "success", 3000);
      }
      fetchLearnerInfo();
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

  useEffect(() => {
    fetchLearnerInfo();
  }, [fetchLearnerInfo]);

  // Parse modules for the badge display
  const modulesList = formData.modules
    ? formData.modules.split(',').map(m => m.trim()).filter(m => m.length > 0)
    : [];

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
              e.target.style.display = 'none';
            }}
          />
        </div>
        <h2 className="mb-2 fw-bold" style={{ fontSize: "2rem" }}>
          Edit My Profile
        </h2>
        <p className="text-muted">
          Update your personal details and the modules you are studying
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
      {!loading && learnerInfo && (
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body p-4">
                {/* Current profile info */}
                <div className="mb-4 p-3 bg-light rounded">
                  <h5 className="fw-semibold mb-3">Current Profile</h5>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <small className="text-muted d-block">Name</small>
                      <strong>{learnerInfo.first_name} {learnerInfo.last_name}</strong>
                    </div>
                    <div className="col-md-6">
                      <small className="text-muted d-block">Email</small>
                      <strong>{learnerInfo.college_email}</strong>
                    </div>
                  </div>
                  {learnerInfo.modules && (
                    <div className="mt-2">
                      <small className="text-muted d-block">Current Modules</small>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {learnerInfo.modules.split(',').map((mod, idx) => (
                          <span key={idx} className="badge bg-primary">{mod.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Personal Information Section */}
                  <div className="mb-4">
                    <h5 className="fw-semibold mb-3 text-primary">Personal Information</h5>

                    <div className="mb-3">
                      <label className="form-label fw-semibold" htmlFor="first_name">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="first_name"
                        name="first_name"
                        placeholder="Your first name"
                        value={formData.first_name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold" htmlFor="last_name">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="last_name"
                        name="last_name"
                        placeholder="Your last name"
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Modules Section */}
                  <div className="mb-4">
                    <h5 className="fw-semibold mb-3 text-primary">My Modules</h5>

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
                        Format: 2 letters + 4 numbers (e.g. IS5543). Separate with commas. These will appear as quick-search buttons on the Tutor Search page.
                      </small>
                    </div>

                    {/* Module badges with remove buttons */}
                    {modulesList.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {modulesList.map((mod, idx) => (
                          <span key={idx} className="badge bg-primary d-flex align-items-center gap-1" style={{ fontSize: '0.85rem' }}>
                            {mod}
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-1"
                              style={{ fontSize: '0.5rem' }}
                              aria-label={`Remove ${mod}`}
                              onClick={() => removeModule(idx)}
                            ></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Show success/error message */}
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
          </div>
        </div>
      )}

      {/* Error state if learner not found */}
      {!loading && !learnerInfo && (
        <div className="alert alert-danger">
          {message.text || "Learner profile not found. Please contact an administrator."}
        </div>
      )}
    </div>
  );
};

export default LearnerProfileEdit;
