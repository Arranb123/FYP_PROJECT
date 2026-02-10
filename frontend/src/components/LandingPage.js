// Iteration 4 - Landing Page Component
// A modern, professional landing page that introduces StudyHive
// ref: Bootstrap 5.3 components - https://getbootstrap.com/docs/5.3/components/

import React from "react";

const LandingPage = ({ onShowLogin, onShowRegister }) => {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Modern Hero Section */}
      <div 
        className="container-fluid" 
        style={{ 
          position: "relative",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden"
        }}
      >
        {/* Subtle background pattern */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "40px 40px"
        }}></div>

        <div className="container" style={{ position: "relative", zIndex: 1, paddingTop: "6rem", paddingBottom: "6rem" }}>
          <div className="row align-items-center">
            <div className="col-lg-6 text-center text-lg-start mb-5 mb-lg-0">
              {/* Logo */}
              <div className="mb-5">
                <div 
                  className="d-inline-block p-3 rounded-3"
                  style={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)"
                  }}
                >
                  <img 
                    src="/logo.png" 
                    alt="StudyHive Logo" 
                    style={{ 
                      height: "80px", 
                      objectFit: "contain"
                    }} 
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Main Heading */}
              <h1 
                className="display-2 fw-bold mb-4 text-white"
                style={{ 
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  lineHeight: "1.1",
                  letterSpacing: "-0.02em"
                }}
              >
                Connect with Expert Tutors
                <br />
                <span style={{ color: "#fbbf24" }}>Elevate Your Learning</span>
              </h1>

              {/* Subheading */}
              <p 
                className="lead mb-5 text-white"
                style={{ 
                  fontSize: "1.375rem",
                  opacity: 0.95,
                  lineHeight: "1.7",
                  maxWidth: "600px",
                  margin: "0 auto 0 0"
                }}
              >
                Find the perfect tutor for your modules, book sessions seamlessly, 
                and achieve your academic goals with StudyHive.
              </p>

              {/* CTA Buttons */}
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start mb-5">
                <button 
                  className="btn btn-light btn-lg px-5 py-3 fw-semibold"
                  onClick={onShowRegister}
                  style={{ 
                    fontSize: "1.125rem",
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
                  }}
                >
                  Get Started Free
                </button>
                <button 
                  className="btn btn-outline-light btn-lg px-5 py-3 fw-semibold"
                  onClick={onShowLogin}
                  style={{ 
                    fontSize: "1.125rem",
                    borderRadius: "0.75rem",
                    borderWidth: "2px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)"
                  }}
                >
                  Sign In
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="d-flex flex-wrap gap-4 justify-content-center justify-content-lg-start text-white-50">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill" style={{ color: "#10b981", fontSize: "1.25rem" }}></i>
                  <span>Verified Tutors</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-shield-check" style={{ color: "#10b981", fontSize: "1.25rem" }}></i>
                  <span>Secure Platform</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-clock-history" style={{ color: "#10b981", fontSize: "1.25rem" }}></i>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* Right side visual */}
            <div className="col-lg-6 text-center">
              <div style={{
                position: "relative",
                padding: "2rem"
              }}>
                <div style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(20px)",
                  borderRadius: "2rem",
                  padding: "3rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
                }}>
                  <div className="row g-3">
                    <div className="col-6">
                      <div style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        borderRadius: "1rem",
                        padding: "1.5rem",
                        textAlign: "center"
                      }}>
                        <div className="h2 mb-2 text-white fw-bold">500+</div>
                        <div className="text-white-50 small">Active Tutors</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        borderRadius: "1rem",
                        padding: "1.5rem",
                        textAlign: "center"
                      }}>
                        <div className="h2 mb-2 text-white fw-bold">2K+</div>
                        <div className="text-white-50 small">Students</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        borderRadius: "1rem",
                        padding: "1.5rem",
                        textAlign: "center"
                      }}>
                        <div className="h2 mb-2 text-white fw-bold">4.8</div>
                        <div className="text-white-50 small">Avg Rating</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        borderRadius: "1rem",
                        padding: "1.5rem",
                        textAlign: "center"
                      }}>
                        <div className="h2 mb-2 text-white fw-bold">50+</div>
                        <div className="text-white-50 small">Modules</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-5" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="text-center mb-5">
          <h2 
            className="fw-bold mb-3"
            style={{ 
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#1f2937",
              letterSpacing: "-0.02em"
            }}
          >
            Why Choose StudyHive?
          </h2>
          <p className="text-muted lead" style={{ fontSize: "1.25rem", maxWidth: "700px", margin: "0 auto" }}>
            Everything you need to succeed in your studies, all in one powerful platform
          </p>
        </div>

        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div 
              className="card h-100 border-0 shadow-lg"
              style={{ 
                borderTop: "4px solid #6366f1",
                transition: "all 0.3s ease",
                borderRadius: "1rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(99, 102, 241, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="card-body p-5">
                <div 
                  className="mb-4 d-inline-flex align-items-center justify-content-center"
                  style={{ 
                    width: "80px",
                    height: "80px",
                    borderRadius: "1rem",
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)",
                    fontSize: "2.5rem",
                    color: "#6366f1"
                  }}
                >
                  <i className="bi bi-search"></i>
                </div>
                <h4 className="fw-bold mb-3" style={{ color: "#1e293b", fontSize: "1.5rem" }}>
                  Find Expert Tutors
                </h4>
                <p className="text-muted" style={{ lineHeight: "1.7", fontSize: "1.0625rem" }}>
                  Search through verified tutors by module, price, and rating. 
                  Find the perfect match for your learning needs with our advanced filters.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div 
              className="card h-100 border-0 shadow-lg"
              style={{ 
                borderTop: "4px solid #10b981",
                transition: "all 0.3s ease",
                borderRadius: "1rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(16, 185, 129, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="card-body p-5">
                <div 
                  className="mb-4 d-inline-flex align-items-center justify-content-center"
                  style={{ 
                    width: "80px",
                    height: "80px",
                    borderRadius: "1rem",
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
                    fontSize: "2.5rem",
                    color: "#10b981"
                  }}
                >
                  <i className="bi bi-calendar-check"></i>
                </div>
                <h4 className="fw-bold mb-3" style={{ color: "#1e293b", fontSize: "1.5rem" }}>
                  Easy Booking
                </h4>
                <p className="text-muted" style={{ lineHeight: "1.7", fontSize: "1.0625rem" }}>
                  Book sessions at times that work for you. View tutor availability 
                  and schedule sessions with just a few clicks. Calendar integration included.
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div 
              className="card h-100 border-0 shadow-lg"
              style={{ 
                borderTop: "4px solid #f59e0b",
                transition: "all 0.3s ease",
                borderRadius: "1rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(245, 158, 11, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="card-body p-5">
                <div 
                  className="mb-4 d-inline-flex align-items-center justify-content-center"
                  style={{ 
                    width: "80px",
                    height: "80px",
                    borderRadius: "1rem",
                    background: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)",
                    fontSize: "2.5rem",
                    color: "#f59e0b"
                  }}
                >
                  <i className="bi bi-star-fill"></i>
                </div>
                <h4 className="fw-bold mb-3" style={{ color: "#1e293b", fontSize: "1.5rem" }}>
                  Verified & Rated
                </h4>
                <p className="text-muted" style={{ lineHeight: "1.7", fontSize: "1.0625rem" }}>
                  All tutors are verified and rated by students. 
                  Read detailed reviews and make informed decisions before booking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="row g-4 mb-5">
          <div className="col-12">
            <div className="card border-0 shadow-lg" style={{ borderRadius: "1.5rem", overflow: "hidden" }}>
              <div className="card-body p-5">
                <div className="text-center mb-5">
                  <h3 
                    className="fw-bold mb-3"
                    style={{ 
                      fontSize: "2.5rem",
                      color: "#1f2937",
                      letterSpacing: "-0.02em"
                    }}
                  >
                    How It Works
                  </h3>
                  <p className="text-muted lead" style={{ fontSize: "1.125rem" }}>
                    Get started in just four simple steps
                  </p>
                </div>
                <div className="row g-4">
                  <div className="col-md-3 text-center">
                    <div className="mb-4">
                      <div 
                        className="rounded-circle text-white d-inline-flex align-items-center justify-content-center fw-bold"
                        style={{ 
                          width: "80px",
                          height: "80px",
                          fontSize: "2rem",
                          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          boxShadow: "0 10px 25px rgba(99, 102, 241, 0.3)"
                        }}
                      >
                        1
                      </div>
                    </div>
                    <h5 className="fw-bold mb-3" style={{ fontSize: "1.25rem" }}>Sign Up</h5>
                    <p className="text-muted" style={{ lineHeight: "1.6" }}>
                      Create your account as a learner or tutor in seconds
                    </p>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="mb-4">
                      <div 
                        className="rounded-circle text-white d-inline-flex align-items-center justify-content-center fw-bold"
                        style={{ 
                          width: "80px",
                          height: "80px",
                          fontSize: "2rem",
                          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          boxShadow: "0 10px 25px rgba(99, 102, 241, 0.3)"
                        }}
                      >
                        2
                      </div>
                    </div>
                    <h5 className="fw-bold mb-3" style={{ fontSize: "1.25rem" }}>Find or List</h5>
                    <p className="text-muted" style={{ lineHeight: "1.6" }}>
                      Search for tutors or create your tutor profile
                    </p>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="mb-4">
                      <div 
                        className="rounded-circle text-white d-inline-flex align-items-center justify-content-center fw-bold"
                        style={{ 
                          width: "80px",
                          height: "80px",
                          fontSize: "2rem",
                          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          boxShadow: "0 10px 25px rgba(99, 102, 241, 0.3)"
                        }}
                      >
                        3
                      </div>
                    </div>
                    <h5 className="fw-bold mb-3" style={{ fontSize: "1.25rem" }}>Book Sessions</h5>
                    <p className="text-muted" style={{ lineHeight: "1.6" }}>
                      Schedule tutoring sessions at convenient times
                    </p>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="mb-4">
                      <div 
                        className="rounded-circle text-white d-inline-flex align-items-center justify-content-center fw-bold"
                        style={{ 
                          width: "80px",
                          height: "80px",
                          fontSize: "2rem",
                          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          boxShadow: "0 10px 25px rgba(99, 102, 241, 0.3)"
                        }}
                      >
                        4
                      </div>
                    </div>
                    <h5 className="fw-bold mb-3" style={{ fontSize: "1.25rem" }}>Learn & Grow</h5>
                    <p className="text-muted" style={{ lineHeight: "1.6" }}>
                      Attend sessions and achieve your academic goals
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-5">
          <div 
            className="card border-0 shadow-lg"
            style={{ 
              background: "linear-gradient(135deg, #6366f1 0%, #764ba2 100%)",
              color: "white",
              padding: "4rem 3rem",
              borderRadius: "1.5rem",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{
              position: "absolute",
              top: "-50%",
              right: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
              animation: "rotate 20s linear infinite"
            }}></div>
            <style>{`
              @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{ position: "relative", zIndex: 1 }}>
              <h3 
                className="fw-bold mb-4"
                style={{ 
                  color: "white",
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  letterSpacing: "-0.02em"
                }}
              >
                Ready to Get Started?
              </h3>
              <p 
                className="mb-5 lead"
                style={{ 
                  fontSize: "1.375rem",
                  opacity: 0.95,
                  maxWidth: "600px",
                  margin: "0 auto 2rem"
                }}
              >
                Join StudyHive today and connect with expert tutors or start teaching
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <button 
                  className="btn btn-light btn-lg px-5 py-3 fw-semibold"
                  onClick={onShowRegister}
                  style={{ 
                    fontSize: "1.125rem",
                    borderRadius: "0.75rem",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
                  }}
                >
                  Create Account
                </button>
                <button 
                  className="btn btn-outline-light btn-lg px-5 py-3 fw-semibold"
                  onClick={onShowLogin}
                  style={{ 
                    fontSize: "1.125rem",
                    borderRadius: "0.75rem",
                    borderWidth: "2px",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)"
                  }}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer 
        className="border-top py-5"
        style={{ 
          background: "#f9fafb",
          marginTop: "4rem"
        }}
      >
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h5 className="fw-bold mb-3" style={{ color: "#1f2937" }}>StudyHive</h5>
              <p className="text-muted mb-2" style={{ maxWidth: "500px", margin: "0 auto 1rem" }}>
                Connecting students with expert tutors to achieve academic excellence.
              </p>
              <p className="text-muted mb-0 small">
                 2024 StudyHive. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
