// StudyHive Frontend – Iteration 1
// Admin Dashboard Component
// Author: Arran Ethan Bearman

// Imports
// Reference 
// React Docs (2025) "useState, useEffect" — https://react.dev/reference/react
// Reference (Axios HTTP Library):
// Axios Docs (2025) "Making Requests" — https://axios-http.com/docs/intro
// Used for making GET / PUT / DELETE requests to the Flask backend.
import React, { useEffect, useState } from "react";
import axios from "axios";

/////////////////
///////////////
//// START OF ITERATION 1 CODE
///////////////
/////////////////

// admin dashboard - view unverified tutors, approve/reject them
//reference ,mdn resource for develpers (2025) https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch used throughout majority of file to assist with 
//understanding how to make HTTP requests (GET, POST, PUT, DELETE) to the Flask backend, handle JSON responses, and update React state based on returned data.
function AdminDashboard() {
  //store unverified tutors retrieved from the backend
  const [tutors, setTutors] = useState([]);
    //  endpoint for unverified tutor list
  const API_URL = "http://127.0.0.1:5000/api/tutors/unverified";
  

  // Story 15 - Modal state for viewing proof documents
  // file reference: https://react.dev/reference/react/useState (lines 33-34, 180-193, 246-294)
  const [viewingDocument, setViewingDocument] = useState(null);

  // Fetch unverified tutors on load
  useEffect(() => {
    fetchTutors();
  }, []);

  // Reference :
  // Sends GET request to Flask route: `/api/tutors/unverified`
  // Flask returns all tutors with verified = 0.
  // The results are stored in the tutors state variable.
  // https://chatgpt.com/share/690e54f4-42c4-8008-850e-ec6890ba3f12 - -- Chat Gpt conversation used to lead me in the right direction to be able to adapt code myself
  const fetchTutors = async () => {
    try {
      const res = await axios.get(API_URL); //calls flask route , GET, fetches un-v , 
      setTutors(res.data);
    } catch (error) {
      console.error("Error fetching tutors:", error);
    }
  };

  // Approve tutor (set verified = 1)
  const handleApprove = async (id) => { //called when admin presses approve
    try {
      await axios.put(`http://127.0.0.1:5000/api/tutors/${id}/verify`);//sends a request to flask route
      alert("Tutor approved!");
      fetchTutors();//updates after either action
    } catch (error) {
      console.error("Error approving tutor:", error);
    }
  };

  // Reject tutor (delete record)
  const handleReject = async (id) => {  //called if reject is called 
    if (!window.confirm("Are you sure you want to reject this tutor?")) return; //confirm button
    try {
      await axios.delete(`http://127.0.0.1:5000/api/tutors/${id}`); //sends request to delete and its gone then
      alert("Tutor rejected and removed!");
      fetchTutors();//updates after either action
    } catch (error) {
      console.error("Error rejecting tutor:", error);
    }
  };

// Reference:
  // W3Schools (2025) "React JSX" — https://www.w3schools.com
  // Uses React JSX to mix HTML, JS, and CSS dynamically.
  //  75-125~
  // 
  //Bootstrap 5.3 - https://getbootstrap.com/docs/5.3/
 //used for: UI styling, responsive layout, modals, buttons, cards, and other components throughout the frontend

  return (
    // Iteration 2 - Enhanced container with Bootstrap styling
    <div className="container">
      {/* Iteration 2 - Page header with logo */}
      <div className="mb-4">
        <div className="text-center mb-3">
          <img 
            src="/logo.png" 
            alt="StudyHive Logo" 
            className="logo-page-header"
            style={{ 
              height: "70px", 
              objectFit: "contain"
            }} 
            onError={(e) => {
              // If logo doesn't load, hide it
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="mb-2 fw-bold" style={{ fontSize: "2rem" }}>
              Admin Dashboard
            </h1>
            {/* Iteration 2 - Subtitle */}
            <p className="text-muted mb-0">Tutor Verification & Management</p>
          </div>
          {/* Iteration 2 - Badge showing pending count */}
          {tutors.length > 0 && (
            <span className="badge bg-warning text-dark" style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}>
              {tutors.length} Pending {tutors.length === 1 ? 'Application' : 'Applications'}
            </span>
          )}
        </div>
      </div>

      {/* Iteration 2 - Enhanced empty state */}
      {tutors.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="fw-semibold mb-2">All Clear!</h5>
            <p className="text-muted mb-0">
              No unverified tutors found. All tutor applications have been processed.
            </p>
          </div>
        </div>
      ) : (
        /* Iteration 2 - Enhanced table with Bootstrap styling */
        <div className="card shadow-sm">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0 fw-semibold">Pending Tutor Applications</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Modules</th>
                    <th>Hourly Rate</th>
                    {/* Iteration 2 - Added Bio column */}
                    <th>Bio</th>
                    <th>Proof Document</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map((tutor) => (
                    <tr key={tutor.tutor_id}>
                      <td className="align-middle">
                        <strong>{tutor.first_name} {tutor.last_name}</strong>
                      </td>
                      {/* Iteration 2 - Make email clickable */}
                      <td className="align-middle">
                        <a href={`mailto:${tutor.college_email}`} className="text-decoration-none">
                          {tutor.college_email}
                        </a>
                      </td>
                      {/* Iteration 2 - Modules as badge */}
                      <td className="align-middle">
                        <span className="badge bg-info text-dark">{tutor.modules}</span>
                      </td>
                      {/* Iteration 2 - Hourly rate styling */}
                      <td className="align-middle">
                        <span className="fw-bold text-success">€{tutor.hourly_rate}</span>
                      </td>
                      {/* Iteration 2 - Bio column */}
                      <td className="align-middle">
                        <small className="text-muted" style={{ maxWidth: "200px", display: "block" }}>
                          {tutor.bio || <em>No bio provided</em>}
                        </small>
                      </td>
                      {/* Story 15 - Proof document with modal view */}
                      <td className="align-middle">
                        {tutor.proof_doc ? (
                          <button
                            onClick={() => setViewingDocument(tutor.tutor_id)}
                            className="btn btn-sm btn-outline-primary"
                            title="View proof document"
                          >
                            📄 View Document
                          </button>
                        ) : (
                          <span className="badge bg-secondary">No document</span>
                        )}
                      </td>
                      <td className="text-center align-middle">
                        {/* Iteration 2 - Enhanced button styling */}
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => handleApprove(tutor.tutor_id)}
                          title="Approve tutor"
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(tutor.tutor_id)}
                          title="Reject tutor"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* Story 9 - Admin view all bookings section (lines 224-235) */}
      {/* file reference: https://getbootstrap.com/docs/5.3/ (lines 224-235) */}
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="mb-2 fw-bold" style={{ fontSize: "1.75rem" }}>
              All Bookings
            </h2>
            <p className="text-muted mb-0">Monitor all tutoring sessions across the platform</p>
          </div>
        </div>
        <AdminAllBookings />
      </div>

      {/* Story 9 - Admin view all reviews section (lines 237-248) */}
      {/* file reference: https://getbootstrap.com/docs/5.3/ (lines 237-248) */}
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="mb-2 fw-bold" style={{ fontSize: "1.75rem" }}>
              All Reviews
            </h2>
            <p className="text-muted mb-0">View all ratings and feedback from learners</p>
          </div>
        </div>
        <AdminAllReviews />
      </div>

      {/* Story 15 - Modal for viewing proof documents */}
      {/* file reference: https://getbootstrap.com/docs/5.3/components/modal/ (lines 247-294) */}
      {viewingDocument && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Proof Document</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingDocument(null)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-0" style={{ height: '70vh' }}>
                {/* file reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe (lines 272-280) */}
                <iframe
                  src={`http://127.0.0.1:5000/api/tutors/${viewingDocument}/proof-doc`}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    border: 'none'
                  }}
                  title="Proof Document"
                ></iframe>
              </div>
              <div className="modal-footer">
                <a
                  href={`http://127.0.0.1:5000/api/tutors/${viewingDocument}/proof-doc`}
                  download
                  className="btn btn-primary me-2"
                >
                  📥 Download
                </a>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewingDocument(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/////////////////
///////////////
//// End OF ITERATION 1 CODE
///////////////
/////////////////

/////////////////
///////////////
//// Iteration 3 - Admin All Bookings Component
///////////////
/////////////////

// Story 9 - Component to display all bookings for admin
// Story 13 - Shows full timestamps (created_at and updated_at) to track user activity
// file references: https://react.dev/reference/react/useState (lines 314-316)
// file references: https://react.dev/reference/react/useEffect (lines 318-320)
// file references: https://axios-http.com/docs/intro (line 326)
// file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString (lines 374-379, 418-424, 430-436)
// file references: https://getbootstrap.com/docs/5.3/ (lines 336-447)
const AdminAllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/admin/bookings");
      setBookings(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        {loading && (
          <div className="alert alert-info d-flex align-items-center">
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading bookings...
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {!loading && !error && bookings.length === 0 ? (
          <div className="text-center py-5">
            <h5 className="fw-semibold mb-2">No Bookings Yet</h5>
            <p className="text-muted mb-0">No tutoring sessions have been booked yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Learner</th>
                  <th>Tutor</th>
                  <th>Modules</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.booking_id}>
                    <td className="align-middle">
                      <strong>{new Date(booking.session_date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</strong>
                    </td>
                    <td className="align-middle">{booking.session_time}</td>
                    <td className="align-middle">
                      <span className="badge bg-secondary">{booking.duration} min</span>
                    </td>
                    <td className="align-middle">
                      <div>
                        <strong>{booking.learner_name}</strong>
                        <br />
                        <small className="text-muted">{booking.learner_email}</small>
                      </div>
                    </td>
                    <td className="align-middle">
                      <strong>{booking.tutor_name}</strong>
                    </td>
                    <td className="align-middle">
                      <span className="badge bg-info text-dark">{booking.tutor_modules}</span>
                    </td>
                    <td className="align-middle">
                      <span className={`badge ${
                        booking.status === "cancelled" 
                          ? "bg-danger"
                          : booking.status === "rescheduled" 
                          ? "bg-warning text-dark"
                          : booking.status === "pending"
                          ? "bg-secondary"
                          : booking.status === "completed"
                          ? "bg-success"
                          : booking.status === "missed"
                          ? "bg-dark"
                          : "bg-success"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    {/* Story 13 - Show full timestamp (date and time) for created_at */}
                    <td className="align-middle">
                      <small className="text-muted" title={booking.created_at}>
                        {booking.created_at ? new Date(booking.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </small>
                    </td>
                    {/* Story 13 - Show full timestamp (date and time) for updated_at */}
                    <td className="align-middle">
                      <small className="text-muted" title={booking.updated_at}>
                        {booking.updated_at ? new Date(booking.updated_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/////////////////
///////////////
//// End Iteration 3 - Admin All Bookings Component
///////////////
/////////////////

/////////////////
///////////////
//// Iteration 3 - Admin All Reviews Component
///////////////
/////////////////

// Story 9 - admin view all reviews
// Story 13 - shows timestamps for when reviews were submitted
// file references: https://react.dev/reference/react/useState (lines 465-467)
// file references: https://react.dev/reference/react/useEffect (lines 469-471)
// file references: https://axios-http.com/docs/intro (line 477)
// file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString (lines 545-551)
// file references: https://getbootstrap.com/docs/5.3/ (lines 487-562)
const AdminAllReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const fetchAllReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/admin/reviews");
      setReviews(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        {loading && (
          <div className="alert alert-info d-flex align-items-center">
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading reviews...
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {!loading && !error && reviews.length === 0 ? (
          <div className="text-center py-5">
            <h5 className="fw-semibold mb-2">No Reviews Yet</h5>
            <p className="text-muted mb-0">No reviews have been submitted yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Rating</th>
                  <th>Learner</th>
                  <th>Tutor</th>
                  <th>Modules</th>
                  <th>Comment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.review_id}>
                    <td className="align-middle">
                      <span className="badge bg-warning text-dark" style={{ fontSize: "1rem" }}>
                        {review.rating}/5 ⭐
                      </span>
                    </td>
                    <td className="align-middle">
                      <strong>{review.learner_name}</strong>
                    </td>
                    <td className="align-middle">
                      <strong>{review.tutor_name}</strong>
                    </td>
                    <td className="align-middle">
                      <span className="badge bg-info text-dark">{review.tutor_modules}</span>
                    </td>
                    <td className="align-middle">
                      {review.comment ? (
                        <small>{review.comment}</small>
                      ) : (
                        <em className="text-muted">No comment</em>
                      )}
                    </td>
                    {/* Story 13 - Show full timestamp (date and time) for review created_at */}
                    <td className="align-middle">
                      <small className="text-muted" title={review.created_at}>
                        {review.created_at ? new Date(review.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/////////////////
///////////////
//// End Iteration 3 - Admin All Reviews Component
///////////////
/////////////////

export default AdminDashboard;
