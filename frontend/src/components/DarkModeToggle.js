// StudyHive Frontend – Iteration 5
// Dark Mode Toggle Component
// Author: Arran Ethan Bearman
// 
// Dark Mode Toggle Implementation References:
// 
// Material UI Switch component for theme toggling
// Reference: Material UI Documentation (2025) "Switch" — https://mui.com/material-ui/react-switch/
// Reference: Material UI Documentation (2025) "FormControlLabel" — https://mui.com/material-ui/api/form-control-label/
// Used to provide a toggle switch for switching between light and dark themes.
// 
// Integration with ThemeProvider context
// Reference: React Docs (2025) "useContext" — https://react.dev/reference/react/useContext
// Used to access and update the theme state from the ThemeProvider context.
// Switch + FormControlLabel pattern from ChatGPT — https://chatgpt.com/share/6990e11b-33cc-8008-ad1d-9435b9df7a9f

import React from 'react';
import { Switch, FormControlLabel } from '@mui/material';
import { useTheme } from './ThemeProvider';

// Dark Mode Toggle component
const DarkModeToggle = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <FormControlLabel
      control={
        <Switch
          checked={mode === 'dark'}
          onChange={toggleTheme}
          color="primary"
        />
      }
      label={mode === 'dark' ? 'Dark' : 'Light'}
      sx={{
        marginRight: 1,
        '& .MuiFormControlLabel-label': {
          fontSize: '0.875rem',
          color: 'text.secondary',
        },
      }}
    />
  );
};

export default DarkModeToggle;
