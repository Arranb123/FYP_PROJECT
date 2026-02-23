// Iteration 4 - Booking Messages Component
// This component allows learners and tutors to send messages for accepted bookings
// ChatGPT conversation reference: https://chatgpt.com/share/6984af21-d9ac-8008-a016-f00a20286dd1

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const BookingMessages = ({ bookingId, userId, userRole, bookingStatus }) => {
  // State variables
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Iteration 4 - Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Iteration 4 - Fetch messages for this booking
  const fetchMessages = useCallback(async () => {
    if (!bookingId || !userId || !userRole) return;

    // Only allow messaging for confirmed/accepted bookings
    if (bookingStatus !== "confirmed" && bookingStatus !== "accepted") {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/messages`,
        {
          params: {
            user_id: userId,
            user_role: userRole,
          },
        }
      );
      setMessages(response.data);
      // Scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      const message =
        err?.response?.data?.error || err?.message || "Failed to load messages.";
      setError(message);
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [bookingId, userId, userRole, bookingStatus]);

  // Iteration 4 - Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setError("");
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/messages`,
        {
          sender_id: userId,
          sender_role: userRole,
          message_text: newMessage.trim(),
        }
      );
      setNewMessage("");
      // Refresh messages to show the new one
      await fetchMessages();
    } catch (err) {
      const message =
        err?.response?.data?.error || err?.message || "Failed to send message.";
      setError(message);
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  // Iteration 4 - Auto-refresh messages every 5 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Iteration 4 - Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Don't show messaging if booking is not confirmed/accepted
  if (bookingStatus !== "confirmed" && bookingStatus !== "accepted") {
    return (
      <div className="alert alert-info mb-3">
        <small>
          Messaging is only available for confirmed bookings. Current status:{" "}
          <strong>{bookingStatus}</strong>
        </small>
      </div>
    );
  }

  return (
    <div className="card shadow-sm mb-3">
      <div className="card-header bg-light">
        <h6 className="mb-0 fw-semibold">Messages</h6>
      </div>
      <div className="card-body p-0">
        {/* Messages display area */}
        <div
          style={{
            height: "300px",
            overflowY: "auto",
            padding: "1rem",
            backgroundColor: "#f8f9fa",
          }}
        >
          {loading && messages.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading messages...</span>
              </div>
              <p className="text-muted small mt-2">Loading messages...</p>
            </div>
          ) : error && messages.length === 0 ? (
            <div className="alert alert-warning mb-0">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <p className="mb-0">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div>
              {messages.map((msg) => {
                const isOwnMessage = msg.sender_role === userRole;
                return (
                  <div
                    key={msg.message_id}
                    className={`mb-3 d-flex ${
                      isOwnMessage ? "justify-content-end" : "justify-content-start"
                    }`}
                  >
                    <div
                      className={`rounded p-2 ${
                        isOwnMessage
                          ? "bg-primary text-white"
                          : "bg-white border"
                      }`}
                      style={{ maxWidth: "75%" }}
                    >
                      <div className="small fw-semibold mb-1">
                        {isOwnMessage ? "You" : msg.sender_role === "learner" ? "Learner" : "Tutor"}
                      </div>
                      <div className="small">{msg.message_text}</div>
                      <div
                        className={`small mt-1 ${
                          isOwnMessage ? "text-white-50" : "text-muted"
                        }`}
                        style={{ fontSize: "0.7rem" }}
                      >
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && messages.length > 0 && (
          <div className="alert alert-warning m-3 mb-0">{error}</div>
        )}

        {/* Message input form */}
        <form onSubmit={sendMessage} className="p-3 border-top">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              maxLength={500}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </button>
          </div>
          <small className="text-muted d-block mt-1">
            {newMessage.length}/500 characters
          </small>
        </form>
      </div>
    </div>
  );
};

export default BookingMessages;
