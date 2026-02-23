// Iteration 3 - Login Component
// Iteration 5 - Redesigned with Material UI Sign-In template
//
// Material UI Sign-In template reference
// Reference: Material UI Documentation (2025) "Sign-in page template" — https://mui.com/material-ui/getting-started/templates/sign-in/
// Used as the design basis for the login form layout and component choices.
//
// Material UI component references:
// Reference: Material UI Documentation (2025) "TextField" — https://mui.com/material-ui/react-text-field/
// Reference: Material UI Documentation (2025) "Button" — https://mui.com/material-ui/react-button/
// Reference: Material UI Documentation (2025) "Card" — https://mui.com/material-ui/react-card/
// Reference: Material UI Documentation (2025) "Alert" — https://mui.com/material-ui/react-alert/
// Used to build the sign-in form with Material Design components.
//
// Original logic references:
// file references: https://react.dev/reference/react/useState
// file references: https://axios-http.com/docs/intro
//
// ChatGPT helped with MUI login layout and password visibility toggle — https://chatgpt.com/share/6990e11b-33cc-8008-ad1d-9435b9df7a9f

import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Link,
  Stack,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

// Login component
// onLoginSuccess - called with user data after successful login
// onBack - called when user clicks "Back to Home"
// onNavigateToRegister - called when user clicks "Register here"
const Login = ({ onLoginSuccess, onBack, onNavigateToRegister }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Update form fields
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit login form
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!formData.email || !formData.password) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      if (response.data && onLoginSuccess) {
        onLoginSuccess(response.data);
      }

      setMessage({ type: "success", text: "Login successful! Redirecting..." });
      if (window.showToast) {
        window.showToast("Login successful! Welcome back.", "success", 2000);
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Login failed. Please check your credentials and try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Card
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <img
              src="/logo.png"
              alt="StudyHive Logo"
              style={{ height: 64, objectFit: "contain" }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            component="h1"
            variant="h4"
            sx={{ textAlign: "center", fontWeight: 700, mb: 0.5 }}
          >
            Sign in
          </Typography>
          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "text.secondary", mb: 3 }}
          >
            Sign in to your StudyHive account
          </Typography>

          {/* Form */}
          <Stack component="form" onSubmit={handleSubmit} spacing={2}>
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              autoComplete="email"
              placeholder="your.email@college.edu"
              size="small"
            />

            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      size="small"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {message.text && (
              <Alert
                severity={message.type === "success" ? "success" : "error"}
                onClose={() => setMessage({ type: "", text: "" })}
              >
                {message.text}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{ py: 1.2, fontWeight: 600, textTransform: "none", fontSize: "1rem" }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>

          <Divider sx={{ my: 2.5 }} />

          {/* Navigation links */}
          <Stack spacing={1} sx={{ textAlign: "center" }}>
            {onNavigateToRegister && (
              <Typography variant="body2" color="text.secondary">
                Don&apos;t have an account?{" "}
                <Link
                  component="button"
                  variant="body2"
                  onClick={onNavigateToRegister}
                  sx={{ fontWeight: 600, cursor: "pointer" }}
                >
                  Register here
                </Link>
              </Typography>
            )}
            {onBack && (
              <Typography variant="body2">
                <Link
                  component="button"
                  variant="body2"
                  onClick={onBack}
                  color="text.secondary"
                  sx={{ cursor: "pointer" }}
                >
                  ← Back to Home
                </Link>
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
