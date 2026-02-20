// StudyHive Frontend – Iteration 5
// Learner How-To Guide Component
// Author: Arran Ethan Bearman
//
// References:
// Reference: Bootstrap 5.3 Documentation (2025) "Cards" — https://getbootstrap.com/docs/5.3/components/card/
// Reference: Bootstrap 5.3 Documentation (2025) "Badges" — https://getbootstrap.com/docs/5.3/components/badge/
// Used for the step card layout and numbered step badges.

import React from "react";

// Steps shown in the learner guide.
// To add a screenshot, drop the image file into frontend/public/screenshots/
// using the filename listed in the 'image' field below.
const LEARNER_STEPS = [
  {
    title: "Create an Account",
    description:
      "Click \"Get Started\" on the home page. Fill in your first name, last name, email address, and password, then choose \"Learner\" as your role. Click Register to create your account.",
    image: "learner-step-1.png",
  },
  {
    title: "Search for a Tutor",
    description:
      "Go to the Tutor Search page from the navigation bar. Use the filters to search by module, maximum price per hour, or minimum rating. Click on any tutor card to open their full profile.",
    image: "learner-step-2.png",
  },
  {
    title: "Book a Session",
    description:
      "On a tutor's profile page, click the \"Book Session\" button. Choose your preferred date, start time, session duration (in hours), and the module you need help with. Click Confirm to send the booking request.",
    image: "learner-step-3.png",
  },
  {
    title: "Message Your Tutor",
    description:
      "Once a booking is confirmed by your tutor, go to the Messages page from the navigation bar. Click on the conversation to expand it and send messages to discuss the session details.",
    image: "learner-step-4.png",
  },
  {
    title: "View Your Calendar",
    description:
      "The Calendar page displays all your upcoming and past sessions in a monthly calendar view. Click on any session event to see booking details such as tutor name, module, and time.",
    image: "learner-step-5.png",
  },
  {
    title: "Leave a Review",
    description:
      "After a session has been marked as completed, go to My Bookings. Find the completed booking and click \"Leave Review\". Give a star rating (1–5) and write a short comment about your experience.",
    image: "learner-step-6.png",
  },
  {
    title: "Track Your Spending",
    description:
      "The Payment History page shows every tutoring session you have paid for, including the tutor name, module, duration, hourly rate, and amount paid. A summary at the top shows your total spend and hours learned.",
    image: "learner-step-7.png",
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

const LearnerGuide = ({ onReturn }) => (
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
        Learner Guide
      </h2>
      <p className="text-muted mb-0">
        New to StudyHive? Follow these steps to book your first tutoring session and get the most out of the platform.
      </p>
    </div>

    {/* Step cards */}
    {LEARNER_STEPS.map((step, index) => (
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
      <strong>Tip:</strong> If you have any issues, use the Messages page to contact your tutor directly.
    </div>
  </div>
);

export default LearnerGuide;
