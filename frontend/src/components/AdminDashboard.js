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

  // Iteration 4 - Platform report state
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  // UX Improvement - Admin section navigation state
  const [activeSection, setActiveSection] = useState('pending-tutors'); // Default to pending tutors
  
  // Iteration 4 - User management state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");
  
  // UX Improvement - Handle section change and fetch data if needed
  const handleSectionChange = (section) => {
    setActiveSection(section);
    // Fetch users when User Management section is selected
    if (section === 'user-management' && users.length === 0) {
      fetchUsers();
    }
    // Generate report when Platform Report section is selected
    if (section === 'platform-report' && !report) {
      generateReport();
    }
  };

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

  // Iteration 4 - Generate platform report
  const generateReport = async () => {
    setLoadingReport(true);
    setReportError("");
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/admin/report");
      setReport(response.data);
    } catch (error) {
      setReportError("Failed to generate report. Please try again.");
      console.error("Error generating report:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  // Iteration 4 - Export report as JSON
  const exportReport = () => {
    if (!report) return;
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `platform-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Iteration 4 - Fetch all users for management
  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError("");
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/admin/users");
      setUsers(response.data);
    } catch (error) {
      setUsersError(error?.response?.data?.error || "Failed to load users. Please try again.");
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Iteration 4 - Update user status (activate/deactivate)
  const updateUserStatus = async (userId, isActive) => {
    try {
      const response = await axios.put(`http://127.0.0.1:5000/api/admin/users/${userId}/status`, {
        is_active: isActive
      });
      
      if (window.showToast) {
        window.showToast(response.data.message, "success", 3000);
      }
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      const errorMsg = error?.response?.data?.error || "Failed to update user status";
      if (window.showToast) {
        window.showToast(errorMsg, "error", 4000);
      }
      console.error("Error updating user status:", error);
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
    <div className="container py-4">
      {/* Professional Header */}
      <div className="page-header mb-5">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h1 className="mb-2">Admin Dashboard</h1>
            <p className="text-muted mb-0">Manage your platform and users</p>
          </div>
          {activeSection === 'platform-report' && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={generateReport}
              disabled={loadingReport}
            >
              {loadingReport ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh Report
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Professional Navigation Tabs */}
      <div className="card mb-4">
        <div className="card-body p-0">
          <ul className="nav nav-tabs nav-justified" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeSection === 'pending-tutors' ? 'active' : ''}`}
                onClick={() => handleSectionChange('pending-tutors')}
                type="button"
              >
                <i className="bi bi-person-check me-2"></i>
                Pending Tutors
                {tutors.length > 0 && (
                  <span className="badge bg-warning text-dark ms-2">{tutors.length}</span>
                )}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeSection === 'all-bookings' ? 'active' : ''}`}
                onClick={() => handleSectionChange('all-bookings')}
                type="button"
              >
                <i className="bi bi-calendar-check me-2"></i>
                All Bookings
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeSection === 'all-reviews' ? 'active' : ''}`}
                onClick={() => handleSectionChange('all-reviews')}
                type="button"
              >
                <i className="bi bi-star me-2"></i>
                All Reviews
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeSection === 'user-management' ? 'active' : ''}`}
                onClick={() => handleSectionChange('user-management')}
                type="button"
              >
                <i className="bi bi-people me-2"></i>
                User Management
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeSection === 'platform-report' ? 'active' : ''}`}
                onClick={() => handleSectionChange('platform-report')}
                type="button"
              >
                <i className="bi bi-graph-up me-2"></i>
                Platform Report
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Error Messages */}
      {reportError && (
        <div className="alert alert-danger mb-3">{reportError}</div>
      )}

      {/* Content Sections - Only show active section */}
      <div className="tab-content">
        {/* Pending Tutor Applications */}
        {activeSection === 'pending-tutors' && (
          <div className="card">
            <div className="card-body">
              <div className="page-header mb-4">
                <h3 className="mb-0">
                  <i className="bi bi-person-check me-2"></i>
                  Pending Tutor Applications
                </h3>
              </div>
      {tutors.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <i className="bi bi-check-circle"></i>
                  </div>
                  <h5>All Clear!</h5>
                  <p>
              No unverified tutors found. All tutor applications have been processed.
            </p>
        </div>
      ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Modules</th>
                    <th>Hourly Rate</th>
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
                      <td className="align-middle">
                        <a href={`mailto:${tutor.college_email}`} className="text-decoration-none">
                          {tutor.college_email}
                        </a>
                      </td>
                      <td className="align-middle">
                        <span className="badge bg-info text-dark">{tutor.modules}</span>
                      </td>
                      <td className="align-middle">
                        <span className="fw-bold text-success">€{tutor.hourly_rate}</span>
                      </td>
                      <td className="align-middle">
                        <small className="text-muted" style={{ maxWidth: "200px", display: "block" }}>
                          {tutor.bio || <em>No bio provided</em>}
                        </small>
                      </td>
                      <td className="align-middle">
                        {tutor.proof_doc ? (
                          <button
                            onClick={() => setViewingDocument(tutor.tutor_id)}
                            className="btn btn-sm btn-outline-primary"
                            title="View proof document"
                          >
                                View Document
                          </button>
                        ) : (
                          <span className="badge bg-secondary">No document</span>
                        )}
                      </td>
                      <td className="text-center align-middle">
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
              )}
            </div>
          </div>
        )}

        {/* All Bookings Section */}
        {activeSection === 'all-bookings' && (
          <div className="card">
            <div className="card-body">
              <div className="page-header mb-4">
                <h3 className="mb-0">
                  <i className="bi bi-calendar-check me-2"></i>
                  All Bookings
                </h3>
              </div>
              <AdminAllBookings />
          </div>
        </div>
      )}

        {/* All Reviews Section */}
        {activeSection === 'all-reviews' && (
          <div className="card">
            <div className="card-body">
              <div className="page-header mb-4">
                <h3 className="mb-0">
                  <i className="bi bi-star me-2"></i>
                  All Reviews
                </h3>
              </div>
              <AdminAllReviews />
            </div>
          </div>
        )}

        {/* User Management Section */}
        {activeSection === 'user-management' && (
          <div className="card">
            <div className="card-body">
              <div className="page-header mb-4">
                <h3 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  User Management
                </h3>
              </div>
              
              {loadingUsers && (
                <div className="alert alert-info d-flex align-items-center">
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Loading users...
                </div>
              )}
              
              {usersError && (
                <div className="alert alert-danger">{usersError}</div>
              )}

              {!loadingUsers && !usersError && users.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <i className="bi bi-people"></i>
                  </div>
                  <h5>No Users Found</h5>
                  <p>No users registered in the system.</p>
                </div>
              ) : (
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Linked Profile</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.user_id}>
                            <td className="align-middle">
                              <strong>{user.email}</strong>
                            </td>
                            <td className="align-middle">
                              <span className={`badge ${
                                user.role === 'admin' ? 'bg-danger' :
                                user.role === 'tutor' ? 'bg-primary' :
                                'bg-info'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="align-middle">
                              {user.role === 'learner' && user.student_name && (
                                <span className="text-muted small">{user.student_name}</span>
                              )}
                              {user.role === 'tutor' && user.tutor_name && (
          <div>
                                  <span className="text-muted small">{user.tutor_name}</span>
                                  {user.tutor_verified === 1 && (
                                    <span className="badge bg-success ms-2" style={{ fontSize: "0.7rem" }}>Verified</span>
                                  )}
                                </div>
                              )}
                              {(!user.student_name && !user.tutor_name) && (
                                <span className="text-muted small">Not linked</span>
                              )}
                            </td>
                            <td className="align-middle">
                              <span className={`badge ${
                                user.is_active === 1 ? 'bg-success' : 'bg-danger'
                              }`}>
                                {user.is_active === 1 ? 'Active' : 'Deactivated'}
                              </span>
                            </td>
                            <td className="align-middle">
                              <small className="text-muted">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                              </small>
                            </td>
                            <td className="text-center align-middle">
                              {user.role !== 'admin' && (
                                <div className="d-flex gap-2 justify-content-center">
                                  {user.is_active === 1 ? (
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to deactivate ${user.email}?`)) {
                                          updateUserStatus(user.user_id, false);
                                        }
                                      }}
                                      title="Deactivate account"
                                    >
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to activate ${user.email}?`)) {
                                          updateUserStatus(user.user_id, true);
                                        }
                                      }}
                                      title="Activate account"
                                    >
                                      Activate
                                    </button>
                                  )}
                                </div>
                              )}
                              {user.role === 'admin' && (
                                <span className="text-muted small">Protected</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Platform Report Section */}
        {activeSection === 'platform-report' && (
          <div className="card">
            <div className="card-body">
              <div className="page-header mb-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="mb-0">
                      <i className="bi bi-graph-up me-2"></i>
                      Platform Report
                    </h3>
                    <p className="text-muted mb-0 mt-2">Overview of platform statistics and metrics</p>
                  </div>
                  <button 
                    className="btn btn-outline-secondary btn-sm" 
                    onClick={exportReport}
                    disabled={!report}
                    title="Export Report"
                  >
                    <i className="bi bi-download me-2"></i>
                    Export
                  </button>
        </div>
      </div>

              {loadingReport ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted mt-3 mb-0">Generating platform report...</p>
                </div>
              ) : report ? (
                <>
                  {/* Professional Stats Grid */}
                  <div className="row g-4 mb-4">
                    <div className="col-md-3">
                      <div className="stats-card bg-primary text-white">
                        <div className="value">{report.summary?.total_users || 0}</div>
                        <div className="label">Total Users</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stats-card bg-success text-white">
                        <div className="value">{report.summary?.total_bookings || 0}</div>
                        <div className="label">Total Bookings</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stats-card bg-info text-white">
                        <div className="value">{report.summary?.total_verified_tutors || 0}</div>
                        <div className="label">Verified Tutors</div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="stats-card bg-warning text-dark">
                        <div className="value">{report.summary?.average_tutor_rating || 0}/5</div>
                        <div className="label">Avg Rating</div>
                      </div>
                    </div>
                  </div>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Note:</strong> Click "Refresh Report" in the header to update the statistics.
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <i className="bi bi-graph-up"></i>
                  </div>
                  <h5>No Report Generated</h5>
                  <p className="mb-4">Click "Refresh Report" in the header to generate a platform report.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={generateReport}
                    disabled={loadingReport}
                  >
                    {loadingReport ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="bi bi-arrow-clockwise me-2"></i>
                    )}
                    Generate Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Story 15 - Modal for viewing proof documents */}
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
                  Download
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
    <div className="p-3">
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
                      <span className="badge bg-info text-dark">{booking.module || 'N/A'}</span>
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
    <div className="p-3">
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
  );
};

/////////////////
///////////////
//// End Iteration 3 - Admin All Reviews Component
///////////////
/////////////////

export default AdminDashboard;
