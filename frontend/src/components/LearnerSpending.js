// UX Improvement - Learner Spending/Payment History Component
// Displays payment history and spending information for learners
// ref: React useState hook - https://react.dev/reference/react/useState
//
// Pagination
// Reference: Bootstrap 5.3 Documentation (2025) "Pagination" — https://getbootstrap.com/docs/5.3/components/pagination/
// Used to split the payment history table across multiple pages (10 items per page).
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const LearnerSpending = ({ learnerId }) => {
  const [spending, setSpending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch spending data
  const fetchSpending = useCallback(async () => {
    if (!learnerId) return;

    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/learners/${learnerId}/earnings`
      );
      setSpending(response.data);
    } catch (err) {
      const message =
        err?.response?.data?.error || err?.message || "Failed to load payment history.";
      setError(message);
      console.error("Error fetching spending:", err);
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  useEffect(() => {
    fetchSpending();
  }, [fetchSpending]);

  useEffect(() => {
    setCurrentPage(1);
  }, [spending]);

  if (loading && !spending) {
    return (
      <div className="card shadow-sm">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (error && !spending) {
    return (
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  if (!spending) {
    return null;
  }

  // Calculate total spending (sum of all session costs)
  const totalSpending = spending.earnings_breakdown.reduce((sum, session) => sum + (session.session_cost || 0), 0);
  const paginatedSessions = spending.earnings_breakdown.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      {/* Summary Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="stats-card bg-primary text-white">
            <div className="value">€{totalSpending.toFixed(2)}</div>
            <div className="label">Total Spent</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stats-card bg-success text-white">
            <div className="value">{spending.total_sessions_completed}</div>
            <div className="label">Sessions Completed</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="stats-card bg-info text-white">
            <div className="value">{spending.total_hours.toFixed(1)}</div>
            <div className="label">Total Hours</div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="card-title mb-1 fw-bold" style={{ fontSize: "1.75rem" }}>Payment History</h3>
              <small className="text-muted">Track your spending on completed tutoring sessions</small>
            </div>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={fetchSpending}
              disabled={loading}
              title="Refresh payment history"
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="alert alert-warning alert-dismissible fade show">
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError("")}
                aria-label="Close"
              ></button>
            </div>
          )}

          {/* Pending Sessions Info */}
          {spending.pending_sessions > 0 && (
            <div className="alert alert-info mb-4">
              <i className="bi bi-info-circle me-2"></i>
              <strong>{spending.pending_sessions}</strong> session{spending.pending_sessions !== 1 ? 's' : ''} pending.
              Payment will be processed once sessions are completed.
            </div>
          )}

          {/* Payment History Table */}
          <div className="mb-3">
            <h5 className="fw-semibold mb-3">Session Payments</h5>
            {spending.earnings_breakdown.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-4" style={{ fontSize: "4rem", opacity: 0.3 }}>
                  <i className="bi bi-receipt"></i>
                </div>
                <h5 className="fw-semibold mb-2">No Payment History Yet</h5>
                <p className="text-muted mb-0">
                  Your payment history will appear here once you complete tutoring sessions.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Tutor</th>
                      <th>Module</th>
                      <th>Duration</th>
                      <th>Rate</th>
                      <th className="text-end">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSessions.map((session) => (
                      <tr key={session.booking_id}>
                        <td>
                          <div>
                            <strong>
                              {new Date(session.session_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </strong>
                          </div>
                          <small className="text-muted">{session.session_time}</small>
                        </td>
                        <td className="align-middle">
                          <strong>{session.tutor_name}</strong>
                        </td>
                        <td className="align-middle">
                          {session.module ? (
                            <span className="badge bg-info text-dark">{session.module}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="align-middle">{session.duration_hours} hrs</td>
                        <td className="align-middle">€{session.hourly_rate.toFixed(2)}/hr</td>
                        <td className="align-middle text-end">
                          <strong className="text-success">
                            €{session.session_cost.toFixed(2)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-active">
                      <td colSpan="5" className="text-end fw-bold">Total Spent:</td>
                      <td className="text-end fw-bold">€{totalSpending.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            {Math.ceil(spending.earnings_breakdown.length / ITEMS_PER_PAGE) > 1 && (
              <nav className="mt-3 d-flex justify-content-center">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                  </li>
                  {Array.from({ length: Math.ceil(spending.earnings_breakdown.length / ITEMS_PER_PAGE) }, (_, i) => (
                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === Math.ceil(spending.earnings_breakdown.length / ITEMS_PER_PAGE) ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                  </li>
                </ul>
              </nav>
            )}
          </div>

          {/* Info Note */}
          <div className="alert alert-light border">
            <h6 className="fw-semibold mb-2">
              <i className="bi bi-info-circle me-2"></i>
              About Payment History
            </h6>
            <p className="mb-0 small text-muted">
              This shows all payments made for completed tutoring sessions. Payments are calculated based on 
              the tutor's hourly rate and session duration. Pending sessions will appear here once completed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerSpending;
