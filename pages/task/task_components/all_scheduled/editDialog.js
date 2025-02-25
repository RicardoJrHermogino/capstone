import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Grid, 
  FormControl, InputLabel, Select, 
  MenuItem, Box, IconButton, TextField, 
  Autocomplete 
} from '@mui/material';
import axios from 'axios';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { locationCoordinates } from '@/utils/locationCoordinates';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import TimeSelector from './TimeSelector';
import DateSelector from './DateSelector';
import API_BASE_URL from '@/config/apiConfig';

const EditTaskDialog = ({ 
  open, 
  onClose, 
  task, 
  setTask, 
  onUpdate, 
  availableTasks 
}) => {
  const [selectedDate, setSelectedDate] = useState(task?.date || null);
  const [selectedTime, setSelectedTime] = useState(task?.time || null);  
  const [availableForecastTimes, setAvailableForecastTimes] = useState([]);
  const [hasInteractedWithTime, setHasInteractedWithTime] = useState(false);   

  useEffect(() => {
    if (task && task.date && task.time) {
      setSelectedDate(task.date);
      setSelectedTime(task.time);
    }
  }, [task]); 
  

// Update the task state when date or time changes - fixed version
useEffect(() => {
  if (task && (selectedDate !== task.date || selectedTime !== task.time)) {
    // Only update if the values are actually different and not null/undefined
    if (selectedDate !== null && selectedTime !== null) {
      setTask(prevTask => ({
        ...prevTask,
        date: selectedDate,
        time: selectedTime
      }));
    }
  }
}, [selectedDate, selectedTime]);  // Remove task and setTask from dependencies


  const dateOptions = Array.from({ length: 6 }, (_, index) => {
    const date = dayjs().add(index, 'day');
    return (
      <MenuItem 
        key={date.format('YYYY-MM-DD')} 
        value={date.format('YYYY-MM-DD')}
      >
        {date.format('dddd, MMMM D, YYYY')}
      </MenuItem>
    );
  });

  // Handle update with proper validation
  const handleUpdate = () => {
    if (!selectedDate || !selectedTime || !task.location || !task.task_name) {
      // Show error or validation message
      console.error('Missing required fields');
      return;
    }
    
    // Call the parent's onUpdate function
    onUpdate();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        fullWidth 
        maxWidth="md"
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(5px)',
          },
          '& .MuiDialog-paper': {
            padding: '4px',
            p: '10px',
            height: '80%',
            maxHeight: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '30px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <DialogTitle sx={{ 
          pb: 3,
          fontSize: '24px',
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          color: '#333',
          mb: '20px',
        }}>
          Edit Task
          <IconButton 
            onClick={onClose} 
            sx={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              cursor: 'pointer',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            flex: 1,
            overflow: 'auto',
          }}
        >
          <Box 
            component="form" 
            sx={{ 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={availableTasks.map((t) => t.task_name)}
                    renderInput={(params) => 
                      <TextField {...params} label="Select Task" size="medium" />
                    }
                    value={task?.task_name || ''}
                    onChange={(_, newValue) => setTask({ ...task, task_name: newValue })}
                  />
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateSelector 
                  selectedDate={selectedDate} 
                  setSelectedDate={setSelectedDate} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TimeSelector
                  selectedTime={selectedTime}
                  setSelectedTime={setSelectedTime}
                  selectedDate={selectedDate}
                  availableTimes={availableForecastTimes}
                  setHasInteractedWithTime={setHasInteractedWithTime}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    options={Object.keys(locationCoordinates)}
                    renderInput={(params) => 
                      <TextField {...params} label="Select Location" size="medium" />
                    }
                    value={task?.location || ''}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        setTask({
                          ...task,
                          location: newValue,
                          lat: locationCoordinates[newValue].lat,
                          lon: locationCoordinates[newValue].lon
                        });
                      } else {
                        setTask({ ...task, location: '', lat: null, lon: null });
                      }
                    }}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Box sx={{ width: '100%', px: 3, pb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleUpdate}
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
              Edit
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={onClose}
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
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditTaskDialog;