import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  Slide, 
  IconButton, 
  Button 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import dayjs from 'dayjs';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TaskFeasibilityResultDialog = ({ 
  open, 
  onClose, 
  isFeasible, 
  selectedTask, 
  selectedLocation, 
  selectedDate, 
  selectedTime, 
  resultMessage 
}) => {
  // Updated time formatting to handle 'Now' case
  const formattedTime = selectedTime === 'Now' 
    ? 'Now' 
    : dayjs(`${dayjs().format('YYYY-MM-DD')} ${selectedTime}`).format('hh:mm A');

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 7,
          boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
          position: 'relative'
        }
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500]
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
            gap: 3 
          }}
        >
          {isFeasible ? (
            <CheckCircleOutlineIcon 
              sx={{ 
                fontSize: 80, 
                color: 'success.main',
                mb: 1 
              }} 
            />
          ) : (
            <ErrorOutlineIcon 
              sx={{ 
                fontSize: 80, 
                color: 'warning.main', 
                mb: 1 
              }} 
            />
          )}

          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              mb: 2
            }}
          >
            {isFeasible ? 'Task is recommended' : 'Task is not recommended'}
          </Typography>

          <Box 
            sx={{ 
              width: '100%', 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              mb: 2,
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 2
            }}
          >
            {[{ label: 'Task', value: selectedTask },
              { label: 'Location', value: selectedLocation },
              { label: 'Date', value: dayjs(selectedDate).format('MM/DD/YYYY') },
              { label: 'Time', value: formattedTime }
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    color: 'text.secondary', 
                    mb: 0.5,
                    textTransform: 'uppercase'
                  }}
                >
                  {label}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 500, 
                    color: 'text.primary' 
                  }}
                >
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box 
            sx={{ 
              width: '100%', 
              p: 2,
              bgcolor: isFeasible 
                ? 'rgba(76, 175, 80, 0.12)' 
                : 'rgba(255, 152, 0, 0.12)',
              color: isFeasible 
                ? 'success.dark' 
                : 'warning.dark',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ fontWeight: 500 }}
            >
              {resultMessage}
            </Typography>
          </Box>

          {/* Close Button at the Bottom */}
          <Box sx={{ mt: 2,width: '100%', display: 'grid', }}>
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
              sx={{
                backgroundColor: '#48ccb4',
                color: 'black',
                borderRadius: '9999px',
                py: 1.9, // Increased padding for a fatter button
                textTransform: 'none',
                fontSize: '15px', // Optional: increase font size for a bolder look
                '&:hover': {
                  bgcolor: 'rgb(229, 231, 235)',
                },
                boxShadow: 'none',
              }}
            >
              Close
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFeasibilityResultDialog;