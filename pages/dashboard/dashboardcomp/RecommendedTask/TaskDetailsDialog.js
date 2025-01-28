import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  Typography, 
  Box,
  IconButton,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';

const TaskDetailsDialog = ({ open, task, location, selectedDate, selectedTime, onClose }) => {
  if (!task) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          background: 'transparent',
          boxShadow: 'none'
        }
      }}
    >
      <Paper 
        elevation={6} 
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #E6F3E6 0%, #C5E1C5 100%)',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            p: 2,
            background: 'linear-gradient(90deg, #2E8B57 0%, #3CB371 100%)',
            color: 'white'
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {task.task_name}
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MapIcon sx={{ color: '#2E8B57' }} />
              <Typography variant="body1" color="text.secondary">
                {task.storedLocation || location}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EventIcon sx={{ color: '#2E8B57' }} />
              <Typography variant="body1" color="text.secondary">
                {task.storedDate || selectedDate}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AccessTimeIcon sx={{ color: '#2E8B57' }} />
              <Typography variant="body1" color="text.secondary">
                {dayjs(task.storedTime || selectedTime, 'HH:mm').format('h:mm A')}
              </Typography>
            </Box>
          </Box>

          <Box mt={3}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.primary',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: 2,
                p: 2,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {task.details}
            </Typography>
          </Box>
        </DialogContent>
      </Paper>
    </Dialog>
  );
};

export default TaskDetailsDialog;