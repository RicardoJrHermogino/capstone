import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Grid, 
  FormControl, InputLabel, Select, 
  MenuItem, Box, IconButton, TextField, 
  Autocomplete 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { locationCoordinates } from '@/utils/locationCoordinates';

const EditTaskDialog = ({ 
  open, 
  onClose, 
  task, 
  setTask, 
  onUpdate, 
  availableTasks 
}) => {
  const createTimeIntervals = () => {
    const timeIntervals = ['Now', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00'];
    return timeIntervals.map((time) => {
      const fullTime = time === 'Now' ? dayjs() : dayjs(`2024-01-01 ${time}`);
      return (
        <MenuItem key={time} value={time}>
          {time === 'Now' ? 'Now' : fullTime.format('hh:mm A')}
        </MenuItem>
      );
    });
  };

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

  return (
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

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Date</InputLabel>
                <Select
                  value={task?.date || ''}
                  label="Date"
                  onChange={(e) => setTask({ ...task, date: e.target.value })}
                  size="medium"
                >
                  {dateOptions}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Time</InputLabel>
                <Select
                  value={task?.time || ''}
                  label="Time"
                  onChange={(e) => setTask({ ...task, time: e.target.value })}
                  size="medium"
                >
                  {createTimeIntervals()}
                </Select>
              </FormControl>
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
            onClick={onUpdate}
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
  );
};

export default EditTaskDialog;