// StudyHive Frontend – Iteration 1
// Admin Dashboard Component
// Author: Arran Ethan Bearman
// Iteration 5 - Integrated CoreUI Free React Admin Template
// used the coreui free react admin template from https://github.com/coreui/coreui-free-react-admin-template
// components are from the @coreui/react package
//
// Pagination
// Reference: Bootstrap 5.3 Documentation (2025) "Pagination" — https://getbootstrap.com/docs/5.3/components/pagination/
// Used to split the users table, bookings table, reviews table, and pending tutors table across multiple pages (10 items per page).

// Imports
// Reference 
// React Docs (2025) "useState, useEffect" — https://react.dev/reference/react
// Reference (Axios HTTP Library):
// Axios Docs (2025) "Making Requests" — https://axios-http.com/docs/intro
// Used for making GET / PUT / DELETE requests to the Flask backend.
import React, { useEffect, useState } from "react";
import axios from "axios";
// coreui react components - got these from the github repo
import {
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
  CSidebarToggler,
  CNavItem,
  CNavLink,
  CHeader,
  CHeaderBrand,
  CHeaderNav,
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CCardTitle,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider
} from '@coreui/react';
// Iteration 5 - Dark Mode Toggle component
// Reference: Material UI Documentation (2025) "Switch" — https://mui.com/material-ui/react-switch/
// Used to provide a toggle switch for switching between light and dark themes in the admin dashboard.
// CoreUI + MUI dark mode sync (data-coreui-theme, sidebar placement) from ChatGPT — https://chatgpt.com/share/6990e11b-33cc-8008-ad1d-9435b9df7a9f
import DarkModeToggle from './DarkModeToggle';

/////////////////
///////////////
//// START OF ITERATION 1 CODE
///////////////
/////////////////

// admin dashboard - view unverified tutors, approve/reject them
//reference ,mdn resource for develpers (2025) https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch used throughout majority of file to assist with 
//understanding how to make HTTP requests (GET, POST, PUT, DELETE) to the Flask backend, handle JSON responses, and update React state based on returned data.
function AdminDashboard({ onLogout, currentUser }) {
  //store unverified tutors retrieved from the backend
  const [tutors, setTutors] = useState([]);
    //  endpoint for unverified tutor list
  const API_URL = "http://127.0.0.1:5000/api/tutors/unverified";
  const [tutorsCurrentPage, setTutorsCurrentPage] = useState(1);
  const TUTORS_PER_PAGE = 10;
  

  // Story 15 - Modal state for viewing proof documents
  // file reference: https://react.dev/reference/react/useState (lines 33-34, 180-193, 246-294)
  const [viewingDocument, setViewingDocument] = useState(null);

  // Iteration 4 - Platform report state
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // UX Improvement - Admin section navigation state
  const [activeSection, setActiveSection] = useState('dashboard'); // Default to dashboard
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Iteration 4 - User management state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  // Iteration 5 - Pagination for users table
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;
  
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
    // Fetch tutors when Pending Tutors section is selected
    if (section === 'pending-tutors') {
      fetchTutors();
    }
  };

  // Fetch unverified tutors on load
  useEffect(() => {
    fetchTutors();
    generateReport(); // Load dashboard stats on mount
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
      if (window.showToast) {
        window.showToast("Tutor approved successfully!", "success", 3000);
      } else {
        alert("Tutor approved!");
      }
      fetchTutors();//updates after either action
      generateReport(); // Refresh stats
    } catch (error) {
      console.error("Error approving tutor:", error);
      if (window.showToast) {
        window.showToast("Error approving tutor", "error", 3000);
      }
    }
  };

  // Reject tutor (delete record)
  const handleReject = async (id) => {  //called if reject is called 
    if (!window.confirm("Are you sure you want to reject this tutor?")) return; //confirm button
    try {
      await axios.delete(`http://127.0.0.1:5000/api/tutors/${id}`); //sends request to delete and its gone then
      if (window.showToast) {
        window.showToast("Tutor rejected and removed!", "success", 3000);
      } else {
        alert("Tutor rejected and removed!");
      }
      fetchTutors();//updates after either action
      generateReport(); // Refresh stats
    } catch (error) {
      console.error("Error rejecting tutor:", error);
      if (window.showToast) {
        window.showToast("Error rejecting tutor", "error", 3000);
      }
    }
  };

  // Iteration 4 - Generate platform report
  const generateReport = async () => {
    setLoadingReport(true);
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/admin/report");
      setReport(response.data);
    } catch (error) {
      console.error("Error generating report:", error);
      if (window.showToast) {
        window.showToast("Failed to generate report. Please try again.", "error", 4000);
      }
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

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validation
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (passwordForm.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordForm.current_password === passwordForm.new_password) {
      setPasswordError('New password must be different from current password');
      return;
    }
    
    setChangingPassword(true);
    try {
      await axios.put('http://127.0.0.1:5000/api/admin/change-password', {
        email: currentUser?.email,
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      if (window.showToast) {
        window.showToast('Password changed successfully!', 'success', 3000);
      }
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowSettingsModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      const errorMsg = error?.response?.data?.error || 'Failed to change password';
      setPasswordError(errorMsg);
      if (window.showToast) {
        window.showToast(errorMsg, 'error', 4000);
      }
    } finally {
      setChangingPassword(false);
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

// references:
  // W3Schools (2025) "React JSX" — https://www.w3schools.com
  // Uses React JSX to mix HTML, JS, and CSS dynamically.
  // 
  // Bootstrap 5.3 - https://getbootstrap.com/docs/5.3/
  // used for: UI styling, responsive layout, modals, buttons, cards, and other components throughout the frontend
  //
  // coreui free react admin template - https://github.com/coreui/coreui-free-react-admin-template
  // used the layout structure and components from this template for the admin dashboard

  return (
    <div className="wrapper d-flex flex-column min-vh-100 bg-light">
      {/* sidebar component from coreui - based on the template structure at https://github.com/coreui/coreui-free-react-admin-template */}
      <CSidebar 
        className="border-end" 
        position="fixed"
        visible={!sidebarCollapsed}
        onVisibleChange={(visible) => setSidebarCollapsed(!visible)}
        narrow={sidebarCollapsed}
      >
        <CSidebarBrand className="d-none d-md-flex" style={{ 
          padding: sidebarCollapsed ? '1rem 0.5rem' : '1.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}>
          <img 
            src="/logo.png" 
            alt="StudyHive Logo" 
            style={{ 
              height: sidebarCollapsed ? "45px" : "70px", 
              width: "auto",
              maxWidth: "100%",
              objectFit: "contain",
              transition: 'all 0.3s ease'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span style={{ display: 'none' }}>StudyHive</span>
        </CSidebarBrand>
        <CSidebarNav>
          <CNavItem>
            <CNavLink 
              href="#" 
              active={activeSection === 'dashboard'}
              onClick={(e) => { e.preventDefault(); handleSectionChange('dashboard'); }}
            >
              <i className="bi bi-speedometer2 me-2"></i> {!sidebarCollapsed && <span>Dashboard</span>}
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink 
              href="#" 
              active={activeSection === 'pending-tutors'}
              onClick={(e) => { e.preventDefault(); handleSectionChange('pending-tutors'); }}
            >
              <i className="bi bi-person-check me-2"></i> {!sidebarCollapsed && (
                <>
                  <span>Pending Tutors</span>
                  {tutors.length > 0 && (
                    <CBadge color="danger" className="ms-2">{tutors.length}</CBadge>
                  )}
                </>
              )}
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink 
              href="#" 
              active={activeSection === 'all-bookings'}
              onClick={(e) => { e.preventDefault(); handleSectionChange('all-bookings'); }}
            >
              <i className="bi bi-calendar-check me-2"></i> {!sidebarCollapsed && <span>All Bookings</span>}
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink 
              href="#" 
              active={activeSection === 'all-reviews'}
              onClick={(e) => { e.preventDefault(); handleSectionChange('all-reviews'); }}
            >
              <i className="bi bi-star me-2"></i> {!sidebarCollapsed && <span>All Reviews</span>}
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink 
              href="#" 
              active={activeSection === 'user-management'}
              onClick={(e) => { e.preventDefault(); handleSectionChange('user-management'); }}
            >
              <i className="bi bi-people me-2"></i> {!sidebarCollapsed && <span>User Management</span>}
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink 
              href="#" 
              active={activeSection === 'platform-report'}
              onClick={(e) => { e.preventDefault(); handleSectionChange('platform-report'); }}
            >
              <i className="bi bi-graph-up me-2"></i> {!sidebarCollapsed && <span>Platform Report</span>}
            </CNavLink>
          </CNavItem>
        </CSidebarNav>
        <CSidebarToggler onClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </CSidebar>

      {/* header component from coreui template - reference the github repo for the original structure */}
      <CHeader className="mb-0" style={{ marginLeft: sidebarCollapsed ? '64px' : '256px', transition: 'margin-left 0.3s' }}>
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ 
            display: 'block', 
            visibility: 'visible',
            opacity: 1,
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            padding: '0.5rem 1rem',
            fontSize: '1.5rem',
            color: '#6c757d',
            lineHeight: 1
          }}
          className="me-3"
        >
          <i className="bi bi-list"></i>
        </button>
        <CHeaderBrand className="mx-auto d-md-none" to="/">
          <img 
            src="/logo.png" 
            alt="StudyHive Logo" 
            style={{ height: "45px", width: "auto" }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </CHeaderBrand>
        <CHeaderNav className="ms-auto">
            <div className="d-flex align-items-center me-3">
              <DarkModeToggle />
            </div>
            <CDropdown variant="nav-item">
              <CDropdownToggle caret={false}>
                <i className="bi bi-person-circle me-2"></i> Admin
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem href="#">
                  <i className="bi bi-person me-2"></i>Profile
                </CDropdownItem>
                <CDropdownItem 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowSettingsModal(true);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setPasswordForm({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                >
                  <i className="bi bi-gear me-2"></i>Settings
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (onLogout) {
                      onLogout();
                    }
                  }}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>Logout
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </CHeaderNav>
        </CHeader>

      {/* main content container - using coreui layout from the template repo */}
      <div className="flex-grow-1 px-3" style={{ marginLeft: sidebarCollapsed ? '64px' : '256px', transition: 'margin-left 0.3s', overflow: 'auto' }}>
          <CContainer fluid className="py-4">
          {/* dashboard overview - using coreui components from the github template */}
          {activeSection === 'dashboard' && (
            <>
              <h1 className="mb-3">Dashboard</h1>
              <p className="text-muted mb-4">Platform Overview</p>

              {/* stats widgets - using coreui CRow and CCol components */}
              <CRow className="g-4 mb-4">
                <CCol md={3}>
                  <CCard>
                    <CCardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                          <i className="bi bi-people fs-1 text-primary"></i>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="fs-4 fw-bold">{report?.summary?.total_users || 0}</div>
                          <div className="text-muted small">Total Users</div>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard>
                    <CCardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                          <i className="bi bi-calendar-check fs-1 text-success"></i>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="fs-4 fw-bold">{report?.summary?.total_bookings || 0}</div>
                          <div className="text-muted small">Total Bookings</div>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard>
                    <CCardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                          <i className="bi bi-person-check fs-1 text-info"></i>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="fs-4 fw-bold">{report?.summary?.total_verified_tutors || 0}</div>
                          <div className="text-muted small">Verified Tutors</div>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={3}>
                  <CCard>
                    <CCardBody>
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                          <i className="bi bi-exclamation-triangle fs-1 text-warning"></i>
                        </div>
                        <div className="flex-grow-1 ms-3">
                          <div className="fs-4 fw-bold">{tutors.length}</div>
                          <div className="text-muted small">Pending Tutors</div>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>

              {/* quick actions - using coreui CCard component */}
              <CRow className="g-4">
                <CCol md={6}>
                  <CCard>
                    <CCardHeader>
                      <CCardTitle>Quick Actions</CCardTitle>
                    </CCardHeader>
                    <CCardBody>
                      <div className="d-grid gap-2">
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleSectionChange('pending-tutors')}
                        >
                          <i className="bi bi-person-check me-2"></i>
                          Review Pending Tutors ({tutors.length})
                        </button>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleSectionChange('all-bookings')}
                        >
                          <i className="bi bi-calendar-check me-2"></i>
                          View All Bookings
                        </button>
                        <button 
                          className="btn btn-info"
                          onClick={() => handleSectionChange('platform-report')}
                        >
                          <i className="bi bi-graph-up me-2"></i>
                          View Platform Report
                        </button>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={6}>
                  <CCard>
                    <CCardHeader>
                      <CCardTitle>Platform Statistics</CCardTitle>
                    </CCardHeader>
                    <CCardBody>
                      {loadingReport ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : report ? (
                        <div>
                          <div className="d-flex justify-content-between py-2 border-bottom">
                            <span>Average Rating:</span>
                            <strong>{report.summary?.average_tutor_rating || 0}/5 ⭐</strong>
                          </div>
                          <div className="d-flex justify-content-between py-2 border-bottom">
                            <span>Total Revenue:</span>
                            <strong>€{report.summary?.total_revenue || 0}</strong>
                          </div>
                          <div className="d-flex justify-content-between py-2">
                            <span>Active Sessions:</span>
                            <strong>{report.summary?.active_bookings || 0}</strong>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted">No statistics available</p>
                      )}
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </>
          )}

          {/* pending tutor applications - using coreui CCard from the template */}
          {activeSection === 'pending-tutors' && (
            <>
              <h1 className="mb-3">Pending Tutor Applications</h1>
              <p className="text-muted mb-4">Review and approve tutor applications</p>

              <CCard>
                <CCardHeader>
                  <CCardTitle>Tutor Applications</CCardTitle>
                </CCardHeader>
                <CCardBody>
                {tutors.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-check-circle" style={{ fontSize: "3rem", color: "#10b981" }}></i>
                    <h5 className="mt-3">All Clear!</h5>
                    <p className="text-muted">No unverified tutors found. All tutor applications have been processed.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
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
                        {tutors.slice((tutorsCurrentPage - 1) * TUTORS_PER_PAGE, tutorsCurrentPage * TUTORS_PER_PAGE).map((tutor) => (
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
                    {Math.ceil(tutors.length / TUTORS_PER_PAGE) > 1 && (
                      <nav className="mt-3 d-flex justify-content-center">
                        <ul className="pagination">
                          <li className={`page-item ${tutorsCurrentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setTutorsCurrentPage(p => p - 1)}>Previous</button>
                          </li>
                          {Array.from({ length: Math.ceil(tutors.length / TUTORS_PER_PAGE) }, (_, i) => (
                            <li key={i + 1} className={`page-item ${tutorsCurrentPage === i + 1 ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => setTutorsCurrentPage(i + 1)}>{i + 1}</button>
                            </li>
                          ))}
                          <li className={`page-item ${tutorsCurrentPage === Math.ceil(tutors.length / TUTORS_PER_PAGE) ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setTutorsCurrentPage(p => p + 1)}>Next</button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </div>
                )}
                </CCardBody>
              </CCard>
            </>
          )}

          {/* all bookings section - coreui CCard component */}
          {activeSection === 'all-bookings' && (
            <>
              <h1 className="mb-3">All Bookings</h1>
              <p className="text-muted mb-4">View all platform bookings</p>
              <CCard>
                <CCardHeader>
                  <CCardTitle>Booking List</CCardTitle>
                </CCardHeader>
                <CCardBody>
                  <AdminAllBookings />
                </CCardBody>
              </CCard>
            </>
          )}

          {/* all reviews section - using coreui components */}
          {activeSection === 'all-reviews' && (
            <>
              <h1 className="mb-3">All Reviews</h1>
              <p className="text-muted mb-4">View all platform reviews</p>
              <CCard>
                <CCardHeader>
                  <CCardTitle>Review List</CCardTitle>
                </CCardHeader>
                <CCardBody>
                  <AdminAllReviews />
                </CCardBody>
              </CCard>
            </>
          )}

          {/* user management section - coreui CCard from the github template */}
          {activeSection === 'user-management' && (
            <>
              <h1 className="mb-3">User Management</h1>
              <p className="text-muted mb-4">Manage platform users</p>
              <CCard>
                <CCardHeader>
                  <CCardTitle>Users</CCardTitle>
                </CCardHeader>
                <CCardBody>
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
                  <div className="text-center py-5">
                    <i className="bi bi-people" style={{ fontSize: "3rem", color: "#64748b" }}></i>
                    <h5 className="mt-3">No Users Found</h5>
                    <p className="text-muted">No users registered in the system.</p>
                  </div>
                ) : (
                  <>
                  <div className="table-responsive">
                    <table className="table table-hover">
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
                        {/* Iteration 5 - Paginated slice */}
                        {users.slice((usersCurrentPage - 1) * USERS_PER_PAGE, usersCurrentPage * USERS_PER_PAGE).map((user) => (
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

                  {/* Iteration 5 - Pagination controls */}
                  {Math.ceil(users.length / USERS_PER_PAGE) > 1 && (
                    <nav className="mt-3 d-flex justify-content-center">
                      <ul className="pagination">
                        <li className={`page-item ${usersCurrentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => setUsersCurrentPage(p => p - 1)}>Previous</button>
                        </li>
                        {Array.from({ length: Math.ceil(users.length / USERS_PER_PAGE) }, (_, i) => (
                          <li key={i + 1} className={`page-item ${usersCurrentPage === i + 1 ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setUsersCurrentPage(i + 1)}>{i + 1}</button>
                          </li>
                        ))}
                        <li className={`page-item ${usersCurrentPage === Math.ceil(users.length / USERS_PER_PAGE) ? 'disabled' : ''}`}>
                          <button className="page-link" onClick={() => setUsersCurrentPage(p => p + 1)}>Next</button>
                        </li>
                      </ul>
                    </nav>
                  )}
                  </>
                )}
                </CCardBody>
              </CCard>
            </>
          )}

          {/* platform report section - using coreui components from https://github.com/coreui/coreui-free-react-admin-template */}
          {activeSection === 'platform-report' && (
            <>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h1 className="mb-2">Platform Report</h1>
                  <p className="text-muted">Overview of platform statistics and metrics</p>
                </div>
                <div className="d-flex gap-2">
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
                        Refresh
                      </>
                    )}
                  </button>
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
                {/* stats grid - coreui CRow and CCol from the template */}
                <CRow className="g-4 mb-4">
                  <CCol md={3}>
                    <CCard>
                      <CCardBody>
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i className="bi bi-people fs-1 text-primary"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="fs-4 fw-bold">{report.summary?.total_users || 0}</div>
                            <div className="text-muted small">Total Users</div>
                          </div>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                  <CCol md={3}>
                    <CCard>
                      <CCardBody>
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i className="bi bi-calendar-check fs-1 text-success"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="fs-4 fw-bold">{report.summary?.total_bookings || 0}</div>
                            <div className="text-muted small">Total Bookings</div>
                          </div>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                  <CCol md={3}>
                    <CCard>
                      <CCardBody>
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i className="bi bi-person-check fs-1 text-info"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="fs-4 fw-bold">{report.summary?.total_verified_tutors || 0}</div>
                            <div className="text-muted small">Verified Tutors</div>
                          </div>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                  <CCol md={3}>
                    <CCard>
                      <CCardBody>
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <i className="bi bi-star fs-1 text-warning"></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="fs-4 fw-bold">{report.summary?.average_tutor_rating || 0}/5</div>
                            <div className="text-muted small">Avg Rating</div>
                          </div>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                </CRow>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Note:</strong> Click "Refresh" to update the statistics.
                </div>
                </>
              ) : (
                <CCard>
                <CCardBody className="text-center py-5">
                  <i className="bi bi-graph-up" style={{ fontSize: "3rem", color: "#64748b" }}></i>
                  <h5 className="mt-3">No Report Generated</h5>
                  <p className="text-muted mb-4">Click "Refresh" to generate a platform report.</p>
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
                </CCardBody>
                </CCard>
              )}
            </>
          )}
        </CContainer>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-gear me-2"></i>Settings
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setPasswordForm({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <h6 className="mb-3">Change Password</h6>
                
                {passwordError && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {passwordError}
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    {passwordSuccess}
                  </div>
                )}
                
                <form onSubmit={handlePasswordChange}>
                  <div className="mb-3">
                    <label htmlFor="current_password" className="form-label">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="current_password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                      required
                      disabled={changingPassword}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="new_password" className="form-label">
                      New Password *
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="new_password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                      required
                      minLength="6"
                      disabled={changingPassword}
                    />
                    <small className="text-muted">Must be at least 6 characters long</small>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="confirm_password" className="form-label">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirm_password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                      required
                      minLength="6"
                      disabled={changingPassword}
                    />
                  </div>
                  
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowSettingsModal(false);
                        setPasswordError('');
                        setPasswordSuccess('');
                        setPasswordForm({
                          current_password: '',
                          new_password: '',
                          confirm_password: ''
                        });
                      }}
                      disabled={changingPassword}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={changingPassword}
                    >
                      {changingPassword ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Changing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-key me-2"></i>
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

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

  // Iteration 5 - Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
    <div>
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
        <>
        <div className="table-responsive">
          <table className="table table-hover">
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
              {/* Iteration 5 - Paginated slice */}
              {bookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((booking) => (
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

        {/* Iteration 5 - Pagination controls */}
        {Math.ceil(bookings.length / ITEMS_PER_PAGE) > 1 && (
          <nav className="mt-3 d-flex justify-content-center">
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
              </li>
              {Array.from({ length: Math.ceil(bookings.length / ITEMS_PER_PAGE) }, (_, i) => (
                <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${currentPage === Math.ceil(bookings.length / ITEMS_PER_PAGE) ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button>
              </li>
            </ul>
          </nav>
        )}
        </>
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

  // Iteration 5 - Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
    <div>
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
        <>
        <div className="table-responsive">
          <table className="table table-hover">
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
              {/* Iteration 5 - Paginated slice */}
              {reviews.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((review) => (
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

        {/* Iteration 5 - Pagination controls */}
        {Math.ceil(reviews.length / ITEMS_PER_PAGE) > 1 && (
          <nav className="mt-3 d-flex justify-content-center">
            <ul className="pagination">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
              </li>
              {Array.from({ length: Math.ceil(reviews.length / ITEMS_PER_PAGE) }, (_, i) => (
                <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${currentPage === Math.ceil(reviews.length / ITEMS_PER_PAGE) ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button>
              </li>
            </ul>
          </nav>
        )}
        </>
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
