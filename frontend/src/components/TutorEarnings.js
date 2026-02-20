// Iteration 4 - Tutor Earnings Component
// Shows tutor earnings info
// ref: Axios HTTP requests - https://axios-http.com/docs/intro
//
// Pagination
// Reference: Bootstrap 5.3 Documentation (2025) "Pagination" — https://getbootstrap.com/docs/5.3/components/pagination/
// Used to split the earnings breakdown table across multiple pages (10 items per page).

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const TutorEarnings = ({ tutorId }) => {
  // State variables
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Iteration 4 - Fetch earnings data
  const fetchEarnings = useCallback(async () => {
    if (!tutorId) return;

    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/api/tutors/${tutorId}/earnings`
      );
      setEarnings(response.data);
    } catch (err) {
      const message =
        err?.response?.data?.error || err?.message || "Failed to load earnings.";
      setError(message);
      console.error("Error fetching earnings:", err);
    } finally {
      setLoading(false);
    }
  }, [tutorId]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [earnings]);

  if (loading && !earnings) {
    return (
      <div className="card shadow-sm">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading earnings...</span>
          </div>
          <p className="text-muted mt-3">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (error && !earnings) {
    return (
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  if (!earnings) {
    return null;
  }

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="card-title mb-1 fw-bold">My Earnings</h3>
            <small className="text-muted">Track your earnings from completed tutoring sessions</small>
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={fetchEarnings}
            disabled={loading}
            title="Refresh earnings"
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              "Refresh"
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

        {/* Summary Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3">
            <div className="stats-card bg-primary text-white">
              <div className="value">€{earnings.total_earnings.toFixed(2)}</div>
              <div className="label">Total Earnings</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card bg-success text-white">
              <div className="value">{earnings.total_sessions_completed}</div>
              <div className="label">Sessions Completed</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card bg-info text-white">
              <div className="value">{earnings.total_hours.toFixed(1)}</div>
              <div className="label">Total Hours</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card bg-warning text-dark">
              <div className="value">€{earnings.hourly_rate.toFixed(2)}</div>
              <div className="label">Hourly Rate</div>
            </div>
          </div>
        </div>

        {/* Pending Sessions Info */}
        {earnings.pending_sessions > 0 && (
          <div className="alert alert-info mb-4">
            <strong>{earnings.pending_sessions}</strong> session{earnings.pending_sessions !== 1 ? 's' : ''} pending completion.
            Earnings will be updated once sessions are completed.
          </div>
        )}

        {/* Earnings Breakdown */}
        <div className="mb-3">
          <h5 className="fw-semibold mb-3">Earnings Breakdown</h5>
          {earnings.earnings_breakdown.length === 0 ? (
            <div className="alert alert-info">
              <p className="mb-0">
                No completed sessions yet. Your earnings will appear here once you complete tutoring sessions.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Learner</th>
                    <th>Module</th>
                    <th>Duration</th>
                    <th>Rate</th>
                    <th>Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.earnings_breakdown.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((session) => (
                    <tr key={session.booking_id}>
                      <td>
                        {new Date(session.session_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        <br />
                        <small className="text-muted">{session.session_time}</small>
                      </td>
                      <td>{session.learner_name}</td>
                      <td>
                        {session.module ? (
                          <span className="badge bg-info text-dark">{session.module}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{session.duration_hours} hrs</td>
                      <td>€{session.hourly_rate.toFixed(2)}/hr</td>
                      <td>
                        <strong className="text-success">
                          €{session.earnings.toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-active">
                    <td colSpan="5" className="text-end fw-bold">Total Earnings:</td>
                    <td className="fw-bold">€{earnings.total_earnings.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {Math.ceil(earnings.earnings_breakdown.length / ITEMS_PER_PAGE) > 1 && (
            <nav className="mt-3 d-flex justify-content-center">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                </li>
                {Array.from({ length: Math.ceil(earnings.earnings_breakdown.length / ITEMS_PER_PAGE) }, (_, i) => (
                  <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === Math.ceil(earnings.earnings_breakdown.length / ITEMS_PER_PAGE) ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                </li>
              </ul>
            </nav>
          )}
        </div>

        {/* Info Note */}
        <div className="alert alert-light border">
          <h6 className="fw-semibold mb-2">About Earnings</h6>
          <p className="mb-0 small text-muted">
            Earnings are calculated from completed tutoring sessions based on your hourly rate and session duration.
            Pending and confirmed sessions will be added to your earnings once they are completed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TutorEarnings;
