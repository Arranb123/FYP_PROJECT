// StudyHive Frontend – Iteration 5
// Tutor How-To Guide Component
// Author: Arran Ethan Bearman
//
// References:
// Reference: Bootstrap 5.3 Documentation (2025) "Cards" — https://getbootstrap.com/docs/5.3/components/card/
// Reference: Bootstrap 5.3 Documentation (2025) "Badges" — https://getbootstrap.com/docs/5.3/components/badge/
// Used for the step card layout and numbered step badges.

import React from "react";

// Steps shown in the tutor guide.
// To add a screenshot, drop the image file into frontend/public/screenshots/
// using the filename listed in the 'image' field below.
const TUTOR_STEPS = [
  {
    title: "Register as a Tutor",
    description:
      "Click \"Get Started\" on the home page. Fill in your name, email and password, then choose \"Tutor\" as your role. After registering, an admin will review and approve your account before your profile appears in search results.",
    image: "tutor-step-1.png",
  },
  {
    title: "Complete Your Profile",
    description:
      "Once approved, go to Edit Profile from the navigation bar. Set the modules you teach (comma-separated, e.g. \"Maths, Physics\"), your hourly rate in euro, and a bio that tells learners about your experience. Upload a proof document (e.g. degree certificate) if required.",
    image: "tutor-step-2.png",
  },
  {
    title: "Set Your Availability",
    description:
      "Go to the Availability page. Choose which days of the week you are available and set your start and end times for each day. Learners can only book sessions within your available slots.",
    image: "tutor-step-3.png",
  },
  {
    title: "Accept or Decline Bookings",
    description:
      "When a learner books a session with you, it appears in My Bookings with a \"Pending\" status. Review the session details (date, time, module, duration) and click Accept or Decline. Accepted bookings become confirmed.",
    image: "tutor-step-4.png",
  },
  {
    title: "Message Your Learners",
    description:
      "Go to the Messages page to see all conversations with your learners. Click on a booking thread to expand it and send messages. Use this to confirm session details, share resources, or follow up after a session.",
    image: "tutor-step-5.png",
  },
  {
    title: "View Your Calendar",
    description:
      "The Calendar page shows all your confirmed upcoming sessions in a monthly view. Click on a session event to view the booking details, including the learner's name, module, and time.",
    image: "tutor-step-6.png",
  },
  {
    title: "Track Your Earnings",
    description:
      "The Earnings page shows your total income from completed sessions, total hours taught, and your hourly rate. A full breakdown table lists every completed session and the amount earned. Use the Refresh button to update the figures.",
    image: "tutor-step-7.png",
  },
];

// Single step card
const StepCard = ({ step, title, description, image }) => (
  <div className="card mb-4 shadow-sm">
    <div className="card-body">
      <div className="d-flex align-items-start gap-3">
        {/* Step number circle */}
        <div
          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
          style={{ width: 44, height: 44, fontSize: "1.1rem" }}
        >
          {step}
        </div>

        <div className="flex-grow-1">
          <h5 className="fw-bold mb-1">{title}</h5>
          <p className="text-muted mb-3">{description}</p>

          {/* Screenshot — silently hides if file is missing */}
          <div
            className="rounded overflow-hidden border"
            style={{ maxWidth: 700 }}
          >
            <img
              src={`/screenshots/${image}`}
              alt={title}
              className="img-fluid d-block"
              onError={(e) => {
                e.target.parentElement.style.display = "none";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TutorGuide = ({ onReturn }) => (
  <div className="container py-4" style={{ maxWidth: 860 }}>
    {/* Return button */}
    {onReturn && (
      <button
        className="btn btn-outline-secondary btn-sm mb-4"
        onClick={onReturn}
      >
        <i className="bi bi-arrow-left me-1"></i>
        Return to previous page
      </button>
    )}

    {/* Page header */}
    <div className="mb-5">
      <h2 className="fw-bold mb-1">
        <i className="bi bi-question-circle me-2 text-primary"></i>
        Tutor Guide
      </h2>
      <p className="text-muted mb-0">
        New to StudyHive as a tutor? Follow these steps to set up your profile and start taking bookings.
      </p>
    </div>

    {/* Step cards */}
    {TUTOR_STEPS.map((step, index) => (
      <StepCard
        key={index}
        step={index + 1}
        title={step.title}
        description={step.description}
        image={step.image}
      />
    ))}

    {/* Footer tip */}
    <div className="alert alert-info mt-2">
      <i className="bi bi-lightbulb me-2"></i>
      <strong>Tip:</strong> Keep your availability up to date so learners can always find and book a suitable time with you.
    </div>
  </div>
);

export default TutorGuide;
