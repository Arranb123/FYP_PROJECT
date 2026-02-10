// UX Improvement - Tutor Profile Component
// Displays detailed tutor information including reviews, ratings, and statistics
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import BookingForm from "./BookingForm";

const TutorProfile = ({ tutorId, learnerId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Fetch tutor profile with reviews
  const fetchProfile = useCallback(async () => {
    if (!tutorId) return;
    
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/tutors/${tutorId}/profile`);
      setProfile(response.data);
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Failed to load tutor profile.";
      setError(message);
      console.error("Error fetching tutor profile:", err);
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    if (onClose) onClose();
    if (window.showToast) {
      window.showToast("Booking created successfully!", "success", 3000);
    }
  };

  if (loading) {
    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading tutor profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Error</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger">{error}</div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const modules = profile.modules ? profile.modules.split(',').map(m => m.trim()) : [];

  return (
    <>
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h4 className="modal-title fw-bold">Tutor Profile</h4>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {/* Tutor Header Section */}
              <div className="row mb-4">
                <div className="col-md-3 text-center mb-3 mb-md-0">
                  <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: "120px", height: "120px", fontSize: "3rem" }}>
                    {profile.profile_pic ? (
                      <img 
                        src={profile.profile_pic} 
                        alt={`${profile.first_name} ${profile.last_name}`}
                        className="rounded-circle"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <i className="bi bi-person-circle text-muted"></i>
                    )}
                  </div>
                </div>
                <div className="col-md-9">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h3 className="mb-1 fw-bold">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      {profile.verified === 1 && (
                        <span className="badge bg-success d-inline-flex align-items-center">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Verified Tutor
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-muted mb-3">{profile.college_email}</p>
                  
                  {/* Quick Stats */}
                  <div className="row g-2 mb-3">
                    <div className="col-4">
                      <div className="text-center p-2 bg-light rounded">
                        <div className="h5 mb-0 text-primary fw-bold">{profile.rating.toFixed(1)}</div>
                        <small className="text-muted">Rating</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-2 bg-light rounded">
                        <div className="h5 mb-0 text-success fw-bold">{profile.review_stats.total_reviews}</div>
                        <small className="text-muted">Reviews</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-2 bg-light rounded">
                        <div className="h5 mb-0 text-info fw-bold">{profile.booking_stats.completed_bookings}</div>
                        <small className="text-muted">Sessions</small>
                      </div>
                    </div>
                  </div>

                  {/* Hourly Rate */}
                  <div className="mb-3">
                    <span className="badge bg-success fs-6 px-3 py-2">
                      €{profile.hourly_rate} / hour
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {profile.bio && (
                <div className="mb-4">
                  <h5 className="fw-semibold mb-2">About</h5>
                  <p className="text-muted" style={{ lineHeight: "1.6" }}>{profile.bio}</p>
                </div>
              )}

              {/* Modules Section */}
              <div className="mb-4">
                <h5 className="fw-semibold mb-2">Modules Taught</h5>
                <div className="d-flex flex-wrap gap-2">
                  {modules.map((module, idx) => (
                    <span key={idx} className="badge bg-primary fs-6 px-3 py-2">
                      {module}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rating Distribution */}
              {profile.review_stats.total_reviews > 0 && (
                <div className="mb-4">
                  <h5 className="fw-semibold mb-3">Rating Breakdown</h5>
                  <div className="row g-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = profile.review_stats.rating_distribution[star] || 0;
                      const percentage = profile.review_stats.total_reviews > 0 
                        ? (count / profile.review_stats.total_reviews) * 100 
                        : 0;
                      return (
                        <div key={star} className="col-12">
                          <div className="d-flex align-items-center">
                            <div className="me-2" style={{ width: "60px" }}>
                              <span className="text-warning">
                                {star} <i className="bi bi-star-fill"></i>
                              </span>
                            </div>
                            <div className="flex-grow-1 me-2">
                              <div className="progress" style={{ height: "20px" }}>
                                <div 
                                  className="progress-bar bg-warning" 
                                  role="progressbar" 
                                  style={{ width: `${percentage}%` }}
                                  aria-valuenow={percentage} 
                                  aria-valuemin="0" 
                                  aria-valuemax="100"
                                ></div>
                              </div>
                            </div>
                            <div style={{ width: "40px", textAlign: "right" }}>
                              <small className="text-muted">{count}</small>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="mb-4">
                <h5 className="fw-semibold mb-3">
                  Reviews ({profile.reviews.length})
                </h5>
                {profile.reviews.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded">
                    <i className="bi bi-chat-left-text" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                    <p className="text-muted mt-2 mb-0">No reviews yet. Be the first to review this tutor!</p>
                  </div>
                ) : (
                  <div className="list-group">
                    {profile.reviews.map((review) => (
                      <div key={review.review_id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <strong>{review.learner_name}</strong>
                            {review.module && (
                              <span className="badge bg-info ms-2">{review.module}</span>
                            )}
                          </div>
                          <div className="text-warning">
                            {[...Array(5)].map((_, i) => (
                              <i 
                                key={i} 
                                className={`bi bi-star${i < review.rating ? '-fill' : ''}`}
                              ></i>
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="mb-2" style={{ lineHeight: "1.5" }}>{review.comment}</p>
                        )}
                        <small className="text-muted">
                          {review.session_date && new Date(review.session_date).toLocaleDateString()} • 
                          {review.created_at && new Date(review.created_at).toLocaleDateString()}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer border-top">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              {learnerId && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => setShowBookingForm(true)}
                >
                  <i className="bi bi-calendar-plus me-2"></i>
                  Book Session
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal - Close profile when booking form opens */}
      {showBookingForm && learnerId && (
        <BookingForm
          tutor={profile}
          learnerId={learnerId}
          onClose={() => {
            setShowBookingForm(false);
          }}
          onSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
};

export default TutorProfile;
