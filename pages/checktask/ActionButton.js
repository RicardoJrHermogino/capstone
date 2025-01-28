import React from 'react';
import { Box, Button } from '@mui/material';

const ActionButtons = ({ handleSubmit, handleClose }) => (
  <Box sx={{ mt: 'auto', pt: 3 }}>
    <Button
      fullWidth
      variant="contained"
      onClick={handleSubmit}
      sx={{
        backgroundColor: '#48ccb4',
        color: 'white',
        borderRadius: '9999px',
        py: 1.9,
        mb: 1,
        textTransform: 'none',
        fontSize: '15px',
      }}
    >
      Check
    </Button>
    <Button
      fullWidth
      variant="contained"
      onClick={handleClose}
      sx={{
        bgcolor: 'rgb(243, 244, 246)',
        color: 'black',
        borderRadius: '9999px',
        py: 1.9,
        textTransform: 'none',
        fontSize: '15px',
        '&:hover': {
          bgcolor: 'rgb(229, 231, 235)',
        },
        boxShadow: 'none',
      }}
    >
      Cancel
    </Button>
  </Box>
);

export default ActionButtons;
