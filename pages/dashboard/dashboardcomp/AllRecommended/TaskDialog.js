import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Box,
  Paper
} from '@mui/material';
import { X } from 'lucide-react';

const TaskModal = ({ task, open, onClose }) => {
  if (!task) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          background: 'linear-gradient(to bottom, #FFFFFF, #F8F9FA)',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.05)'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 3,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
        <Typography variant="h6" sx={{ 
          fontWeight: '600',
          color: '#1A1A1A',
          fontSize: '1.25rem'
        }}>
          Task Details
        </Typography>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            color: '#666',
            '&:hover': { 
              color: '#333',
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: '700',
              color: '#007AFF',
              mb: 2,
              fontSize: '1.5rem',
              lineHeight: 1.3
            }}
          >
            {task.task_name || task.task}
          </Typography>
        </Box>

        <Paper 
          elevation={0}
          sx={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '16px',
            p: 3,
            border: '1px solid rgba(0, 0, 0, 0.04)'
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: '600',
              color: '#1A1A1A',
              mb: 2,
              fontSize: '1rem'
            }}
          >
            Description
          </Typography>
          <Typography sx={{ 
            color: '#666',
            lineHeight: 1.6,
            fontSize: '0.938rem'
          }}>
            {task.details || task.description || "No description available"}
          </Typography>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
