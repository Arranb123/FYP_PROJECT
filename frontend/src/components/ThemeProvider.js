// StudyHive Frontend – Iteration 5
// Theme Provider Component for Dark Mode Support
// Author: Arran Ethan Bearman
// 
// Dark Mode Implementation References:
// 
// Material UI Theme Provider integration
// Reference: Material UI Documentation (2025) "Theming" — https://mui.com/material-ui/customization/theming/
// Reference: Material UI Documentation (2025) "Dark Mode" — https://mui.com/material-ui/customization/dark-mode/
// Used to create and manage the application theme, including light and dark mode support.
// 
// Material Design Dark Theme Guidelines
// Reference: Material Design (2025) "Dark Theme" — https://material.io/design/color/dark-theme.html
// Used Material Design's recommended dark theme color palette and contrast ratios for better visual appeal.
// 
// React Context API for theme state management
// Reference: React Docs (2025) "useContext, createContext" — https://react.dev/reference/react/useContext
// Reference: React Docs (2025) "useState, useEffect, useMemo" — https://react.dev/reference/react
// Used to share theme state across all components without prop drilling and manage theme persistence.
//
// ChatGPT conversation on MUI setup, dark mode, and CoreUI integration — https://chatgpt.com/share/6990e11b-33cc-8008-ad1d-9435b9df7a9f

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Create a context for theme management
const ThemeContext = createContext();

// Custom hook to access theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider component
export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to 'light'
  // Reference: MDN Web Docs (2025) "Window.localStorage" — https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
  // Used to persist theme preference across page reloads.
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  // Create MUI theme based on current mode
  // Reference: Material UI Documentation (2025) "createTheme" — https://mui.com/material-ui/customization/theming/#createtheme
  // Reference: Material Design (2025) "Color System" — https://material.io/design/color/the-color-system.html
  // Used to generate theme configuration with custom colors for light and dark modes.
  // Enhanced color palette based on Material Design guidelines for better visual appeal.
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode,
          primary: {
            main: mode === 'dark' ? '#3b82f6' : '#0d6efd',
            light: mode === 'dark' ? '#60a5fa' : '#3d8bfd',
            dark: mode === 'dark' ? '#2563eb' : '#0a58ca',
          },
          secondary: {
            main: mode === 'dark' ? '#8b5cf6' : '#6f42c1',
            light: mode === 'dark' ? '#a78bfa' : '#8b6fc1',
            dark: mode === 'dark' ? '#7c3aed' : '#5a32a1',
          },
          background: {
            default: mode === 'dark' ? '#0f0f0f' : '#ffffff',
            paper: mode === 'dark' ? '#1a1a1a' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#e8e8e8' : '#0f172a',
            secondary: mode === 'dark' ? '#a0a0a0' : '#64748b',
          },
        },
      }),
    [mode]
  );

  // Apply theme class to body for global styling
  useEffect(() => {
    document.body.setAttribute('data-theme', mode);
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [mode]);

  const value = {
    mode,
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
