import { createTheme } from '@mui/material/styles';
import '@fontsource/poppins';

const theme = createTheme({
  typography: {
    fontFamily: '"Poppins", sans-serif',
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#5e5c60', // Default border color
              borderRadius: '10px', // Border radius
            },
            '&:hover fieldset': {
              borderColor: '#5e5c60', // Hover border color
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7632cd', // Focus border color
            },
            '& input::placeholder': {
              color: '#5e5c60', // Placeholder text color
            },
            '& input': {
              color: 'black', // Input text color
              backgroundColor: 'transparent', // Set background color to transparent
            },
          },
        },
      },
    },
  },
});

export default theme;
