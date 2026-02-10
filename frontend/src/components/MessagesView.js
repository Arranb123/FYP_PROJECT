// Iteration 4 - Messages View Component
// This component displays all messages for a user (learner or tutor) across all bookings
// ChatGPT conversation reference: https://chatgpt.com/share/6984af21-d9ac-8008-a016-f00a20286dd1

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import BookingMessages from "./BookingMessages";

const MessagesView = ({ userId, userRole }) => {
  // State variables
  const [messageGroups, setMessageGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedBooking, setExpandedBooking] = useState(null);

  // Iteration 4 - Fetch all messages for this user
  const fetchMessages = useCallback(async () => {
    if (!userId || !userRole) return;

    setLoading(true);
    setError("");
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/messages", {
        params: {
          user_id: userId,
          user_role: userRole,
        },
      });
      setMessageGroups(response.data);
    } catch (err) {
      const message =
        err?.response?.data?.error || err?.message || "Failed to load messages.";
      setError(message);
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  // Iteration 4 - Auto-refresh messages every 10 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Iteration 4 - Get unread count for a booking
  const getUnreadCount = (messages) => {
    return messages.filter((msg) => !msg.read_at && msg.sender_role !== userRole).length;
  };

  // Iteration 4 - Get last message preview
  const getLastMessage = (messages) => {
    if (messages.length === 0) return "No messages yet";
    const lastMsg = messages[messages.length - 1];
    const preview = lastMsg.message_text.length > 50
      ? lastMsg.message_text.substring(0, 50) + "..."
      : lastMsg.message_text;
    return preview;
  };

  // Iteration 4 - Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && messageGroups.length === 0) {
    return (
      <div className="card shadow-sm">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading messages...</span>
          </div>
          <p className="text-muted mt-3">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error && messageGroups.length === 0) {
    return (
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  if (messageGroups.length === 0) {
    return (
      <div className="card shadow-sm">
        <div className="card-body text-center py-5">
          <h5 className="fw-semibold mb-2">No Messages</h5>
          <p className="text-muted mb-0">
            You don't have any messages yet. Messages will appear here once you have confirmed bookings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div className="page-header mb-4">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h3 className="mb-0">
                <i className="bi bi-chat-dots me-2"></i>
                Messages
              </h3>
              <p className="text-muted mb-0 mt-2">
                {messageGroups.length} {messageGroups.length === 1 ? "conversation" : "conversations"}
              </p>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={fetchMessages}
              disabled={loading}
              title="Refresh messages"
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-arrow-clockwise me-2"></i>
              )}
              Refresh
            </button>
          </div>
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

        <div className="message-groups">
          {messageGroups.map((group) => {
            const unreadCount = getUnreadCount(group.messages);
            const lastMessage = getLastMessage(group.messages);
            const isExpanded = expandedBooking === group.booking_id;

            return (
              <div key={group.booking_id} className="message-group-card mb-3">
                {/* Booking header - clickable to expand/collapse */}
                <div
                  className="message-group-header"
                  onClick={() => setExpandedBooking(isExpanded ? null : group.booking_id)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h6 className="mb-0 fw-semibold">
                          {userRole === "learner" ? "Tutor" : "Learner"}: {group.other_party_name}
                        </h6>
                        {unreadCount > 0 && (
                          <span className="badge bg-danger rounded-pill">{unreadCount} new</span>
                        )}
                      </div>
                      <div className="small text-muted mb-1">
                        <i className="bi bi-calendar-event me-1"></i>
                        <strong>Session:</strong> {formatDate(group.session_date)} at {group.session_time}
                        {group.module && (
                          <span className="ms-2">
                            <span className="badge bg-info text-dark">{group.module}</span>
                          </span>
                        )}
                      </div>
                      <div className="small text-muted">
                        <i className="bi bi-chat-left me-1"></i>
                        {lastMessage}
                      </div>
                    </div>
                    <div className="ms-3">
                      <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} style={{ fontSize: "1.2rem" }}></i>
                    </div>
                  </div>
                </div>

                {/* Expanded messages view */}
                {isExpanded && (
                  <div className="message-group-content">
                    <BookingMessages
                      bookingId={group.booking_id}
                      userId={userId}
                      userRole={userRole}
                      bookingStatus={group.status}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MessagesView;
