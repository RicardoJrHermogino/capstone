import React, { useState, useEffect } from 'react';
import { 
  Typography, Grid, Box, Card, CardContent, 
  IconButton, Dialog, DialogTitle, DialogContent, 
  TextField, DialogActions, Button, FormControl, 
  InputLabel, Select, MenuItem,Autocomplete, Tooltip,
} from '@mui/material';
import { Edit, Delete, CheckCircle, Cancel } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';

import dayjs from 'dayjs';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import API_BASE_URL from '@/config/apiConfig';
import { locationCoordinates } from '@/utils/locationCoordinates';
import Navbar from '@/pages/components/navbar';



const AllScheduled = () => {
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [lastForecastDateTime, setLastForecastDateTime] = useState(null);
  const [lastForecastDate, setLastForecastDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [taskRequirements, setTaskRequirements] = useState([]);
  

  // Edit Task State
  const [editTask, setEditTask] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // Delete Task State
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);



  // Add new function to check task feasibility
  const checkTaskFeasibility = (task, weatherData, taskRequirements) => {
    // Format the task's date to 'YYYY-MM-DD' format
    const taskDateFormatted = dayjs(task.date).format('YYYY-MM-DD');
    
    console.log('Formatted Task Date:', taskDateFormatted);  // Log the formatted task date
  
    // Find matching weather data for task date and time
    const weatherInfo = weatherData.find(w => 
      w.date === taskDateFormatted &&  // Compare with the formatted task date
      w.time === task.time && 
      w.location === task.location
    );
  
    console.log('Selected Task Weather Info:', weatherInfo);  // Log the weather info
  
    if (!weatherInfo) {
      console.log('No weather data found for this task.');
      return { feasible: false, reason: 'No weather data available' };
    }
  
    // Find task requirements
    const requirements = taskRequirements.find(r => r.task_name === task.task_name);
    if (!requirements) {
      console.log('Task requirements not found for task:', task.task_name);
      return { feasible: false, reason: 'Task requirements not found' };
    }
  
    // Parse weather restrictions
    const weatherRestrictions = JSON.parse(requirements.weatherRestrictions);
  
    // Initialize a flag to check feasibility
    let feasible = true;
    let reason = 'All conditions suitable';
  
    // Log the task requirements for debugging
    console.log('Task Requirements:', requirements);
  
    // Check all conditions
    const checks = {
      temperature: weatherInfo.temperature >= requirements.requiredTemperature_min && 
                  weatherInfo.temperature <= requirements.requiredTemperature_max,
      humidity: weatherInfo.humidity >= requirements.idealHumidity_min && 
                weatherInfo.humidity <= requirements.idealHumidity_max,
      windSpeed: weatherInfo.wind_speed <= requirements.requiredWindSpeed_max,
      windGust: weatherInfo.wind_gust <= requirements.requiredWindGust_max,
      pressure: weatherInfo.pressure >= requirements.requiredPressure_min && 
                weatherInfo.pressure <= requirements.requiredPressure_max,
      weather: weatherRestrictions.includes(weatherInfo.weather_id)
    };
  
    // Log each individual check to see which one fails
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  
    // If any check fails, set feasible to false and specify the reason
    if (!checks.temperature) {
      feasible = false;
      reason = 'Temperature outside acceptable range';
      console.log('Temperature check failed');
    }
    if (!checks.humidity) {
      feasible = false;
      reason = 'Humidity outside acceptable range';
      console.log('Humidity check failed');
    }
    if (!checks.windSpeed) {
      feasible = false;
      reason = 'Wind speed too high';
      console.log('Wind speed check failed');
    }
    if (!checks.windGust) {
      feasible = false;
      reason = 'Wind gusts too strong';
      console.log('Wind gust check failed');
    }
    if (!checks.pressure) {
      feasible = false;
      reason = 'Atmospheric pressure outside acceptable range';
      console.log('Pressure check failed');
    }
    if (!checks.weather) {
      feasible = false;
      reason = 'Weather conditions unsuitable';
      console.log('Weather conditions check failed');
    }
  
    console.log('Feasibility result:', feasible ? 'Feasible' : 'Not Feasible');
    console.log('Reason:', reason);
  
    return { feasible, reason };
  };
  
  
  

  // Add useEffect to fetch weather data and task requirements
  useEffect(() => {
    const fetchWeatherAndTasks = async () => {
      try {
        const [weatherResponse, tasksResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/getWeatherData`),
          axios.get(`${API_BASE_URL}/api/coconut_tasks`)
        ]);
        
        setWeatherData(weatherResponse.data);
        setTaskRequirements(tasksResponse.data.coconut_tasks);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchWeatherAndTasks();
  }, []);

 // In the fetchAvailableTimes function, add:
 const getLastAvailableDateTime = (forecastData) => {
  const lastRecord = forecastData.reduce((latest, record) => {
    const recordDateTime = dayjs(`${record.date} ${record.time}`);
    return !latest || recordDateTime.isAfter(latest) ? recordDateTime : latest;
  }, null);
  return lastRecord;
};

const fetchAvailableTimes = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
    const forecastData = response.data;

    const lastDateTime = getLastAvailableDateTime(forecastData);
    setLastForecastDateTime(lastDateTime);

    
    
    // Group data by date
    const dateGroups = forecastData.reduce((acc, record) => {
      const date = dayjs(record.date).format('YYYY-MM-DD');
      if (!acc[date]) {
        acc[date] = [];
      }
      // Format time consistently
      const formattedTime = dayjs(record.time, 'HH:mm:ss').format('HH:mm');
      if (!acc[date].includes(formattedTime)) {
        acc[date].push(formattedTime);
      }
      return acc;
    }, {});

    // Find the last date in the forecast
    const dates = Object.keys(dateGroups).sort();
    const lastDate = dates[dates.length - 1];
    
    console.log('Last available date:', lastDate);
    console.log('Available times for last date:', dateGroups[lastDate]);
    
    setLastForecastDate(lastDate);
    setAvailableTimes(dateGroups[lastDate] || []);
  } catch (error) {
    console.error('Error fetching available times:', error);
    toast.error('Failed to fetch available time slots');
  }
};


 const dateOptions = Array.from({ length: 6 }, (_, index) => {
    const now = dayjs();
    const currentHour = now.hour();
    const isLateNight = currentHour >= 19 || currentHour <= 2; // Between 7 PM and 2 AM
    const isToday = index === 0; // First date option is today
  
    if (isLateNight && isToday) {
      return null; // Exclude the current date during late-night hours
    }
  
    return {
      label: now.add(index, 'day').format('dddd, MM/DD/YYYY'),
      value: now.add(index, 'day'),
    };
  }).filter(Boolean); // Remove null values

  const createTimeIntervals = (date) => {
    const timeIntervals = ['03:00', '06:00', '09:00', '12:00', '15:00', '18:00'];
    const now = dayjs();
    const isToday = date === now.format('YYYY-MM-DD');
    if (isToday) {
      timeIntervals.unshift('Now');
    }
    return timeIntervals.map((time) => {
      const fullTime = time === 'Now' ? now : dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
      return {
        value: time,
        label: time === 'Now' ? 'Now' : fullTime.format('hh:mm A'),
        disabled: !isToday && time === 'Now',
      };
    });
  };

  // Add this useEffect to fetch available times when component mounts
  useEffect(() => {
      fetchAvailableTimes();

  }, []);

 // Add this useEffect to reset time when date changes
 useEffect(() => {
  setSelectedTime(''); // Reset time whenever date changes
}, [selectedDate]);

// Update the getTimeOptions function to handle disabled states
const getTimeOptions = () => {
  const standardTimes = ['Now', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00'];
  const currentDate = dayjs();
  const isToday = selectedDate === currentDate.format('YYYY-MM-DD');
  
  return standardTimes.map((time) => {
    const isLastForecastDate = selectedDate === lastForecastDate;
    
    // Check if the time is unavailable for the last forecast date
    const isUnavailableOnLastDate = isLastForecastDate && 
      time !== 'Now' && 
      !availableTimes.includes(time.padStart(5, '0'));

    // Check if it's a past time on today's date
    const isPastTime = isToday && 
      time !== 'Now' && 
      dayjs(`${selectedDate} ${time}`).isBefore(currentDate);

    // Disable times beyond the last available forecast date
    const isDateBeyondLastForecast = dayjs(selectedDate).isAfter(dayjs(lastForecastDate));

    // Disable "Now" if not today
    const isNowDisabled = time === 'Now' && !isToday;

    const isDisabled = isPastTime || 
      isUnavailableOnLastDate || 
      isNowDisabled || 
      isDateBeyondLastForecast;
    
    return (
      <MenuItem 
        key={time} 
        value={time}
        disabled={isDisabled}
      >
        {time === 'Now' ? 'Now' : dayjs(`2024-01-01 ${time}`).format('hh:mm A')}
      </MenuItem>
    );
  });
};





  // Fetch userId
  useEffect(() => {
    const fetchUserId = async () => {
      const { value: id } = await Preferences.get({ key: 'userId' });
      setUserId(id);
    };

    fetchUserId();
  }, []);

  // Fetch available tasks
  useEffect(() => {
    const fetchAvailableTasks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/coconut_tasks`);
        if (response.ok) {
          const data = await response.json();
          setAvailableTasks(data.coconut_tasks || []);
        } else {
          console.error('Failed to fetch tasks');
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchAvailableTasks();
  }, []);

  // Fetch tasks
  useEffect(() => {
    if (userId) {
      const fetchTasks = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/getScheduledTasks?deviceId=${userId}`);

          if (response.ok) {
            const data = await response.json();
            setUserTasks(data);
          } else {
            console.error('Failed to fetch tasks');
          }

          setLoading(false);
        } catch (error) {
          console.error('Failed to fetch tasks:', error);
          setLoading(false);
        }
      };

      fetchTasks();
    }
  }, [userId]);

  // Edit Task Handler
  const handleEditTask = (task) => {
    setEditTask(task);
    setEditOpen(true);
  };

  // Update Task
  const updateTask = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/getScheduledTasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedId: editTask.sched_id,
          date: editTask.date,
          time: editTask.time,
          location: editTask.location,
          taskName: editTask.task_name,
        }),
      });
  
      if (response.ok) {
        // Update the local state immediately
        const updatedTasks = userTasks.map(task => 
          task.sched_id === editTask.sched_id 
            ? { 
                ...task, 
                task_name: editTask.task_name,
                date: editTask.date,
                time: editTask.time,
                location: editTask.location 
              } 
            : task
        );
  
        setUserTasks(updatedTasks);
        setEditOpen(false);
      } else {
        console.error('Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Open Delete Confirmation
  const handleDeleteTask = (schedId) => {
    setDeleteTaskId(schedId);
    setDeleteOpen(true);
  };

  // Confirm Deletion
  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/getScheduledTasks?schedId=${deleteTaskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove task from local state
        setUserTasks(userTasks.filter((task) => task.sched_id !== deleteTaskId));
        setDeleteOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  if (loading) {
    return <Typography>Loading tasks...</Typography>;
  }

  // Modify the task card rendering to include feasibility status
  const renderTaskCard = (task) => {
    const feasibility = checkTaskFeasibility(task, weatherData, taskRequirements);
    
    return (
      <Grid item xs={12} sm={6} md={4} key={task.sched_id}>
        <Card sx={{
          border: feasibility.feasible ? '2px solid #4caf50' : '2px solid #f44336',
          position: 'relative'
        }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">{task.task_name}</Typography>
              <Box>
                <Tooltip title={feasibility.reason}>
                  {feasibility.feasible ? 
                    <CheckCircle sx={{ color: '#4caf50', mr: 1 }} /> :
                    <Cancel sx={{ color: '#f44336', mr: 1 }} />
                  }
                </Tooltip>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEditTask(task)}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteTask(task.sched_id)}
                >
                  <Delete />
                </IconButton>
              </Box>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {dayjs(task.date).format('MM/DD/YYYY')}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {task.time}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {task.location}
            </Typography>
            <Typography 
              variant="body2" 
              color={feasibility.feasible ? 'success.main' : 'error.main'}
              sx={{ mt: 1 }}
            >
              {feasibility.reason}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom align="left">
        <strong>Scheduled Tasks</strong>
      </Typography>
      <Grid container spacing={2} mt={2}>
      {userTasks.length > 0 ? (
          userTasks.map(renderTaskCard)
        ) : (
          <Typography>No scheduled tasks found for this device.</Typography>
        )}
      </Grid>

      {/* Edit Task Dialog */}
      <Dialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
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
            onClick={() => setEditOpen(false)} 
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
              {/* Task Name Dropdown */}
              <Grid item xs={12}>
          <FormControl fullWidth>
            <Autocomplete
              options={availableTasks.map((task) => task.task_name)}
              renderInput={(params) => 
                <TextField {...params} label="Select Task" size="medium" />
              }
              value={editTask?.task_name || ''}
              onChange={(_, newValue) => setEditTask({ ...editTask, task_name: newValue })}
            />
          </FormControl>
        </Grid>

        {/* Date */}
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Select Date</InputLabel>
            <Select
              value={editTask?.date || ''}
              label="Date"
              onChange={(e) => setEditTask({ ...editTask, date: e.target.value })}
              size="medium"
            >
              {Array.from({ length: 6 }, (_, index) => {
                const date = dayjs().add(index, 'day');
                return (
                  <MenuItem 
                    key={date.format('YYYY-MM-DD')} 
                    value={date.format('YYYY-MM-DD')}
                  >
                    {date.format('dddd, MMMM D, YYYY')}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Time */}
        <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Select Time</InputLabel>
          <Select
            value={editTask?.time || ''}
            label="Time"
            onChange={(e) => setEditTask({ ...editTask, time: e.target.value })}
            size="medium"
          >
            {getTimeOptions()}
          </Select>
        </FormControl>
      </Grid>
        {/* Location */}
        <Grid item xs={12}>
  <FormControl fullWidth>
    <Autocomplete
      options={Object.keys(locationCoordinates)}  // Use location names as options
      renderInput={(params) => 
        <TextField {...params} label="Select Location" size="medium" />
      }
      value={editTask?.location || ''}
      onChange={(_, newValue) => {
        if (newValue) {
          setEditTask({
            ...editTask,
            location: newValue,
            lat: locationCoordinates[newValue].lat,
            lon: locationCoordinates[newValue].lon
          });
        } else {
          setEditTask({ ...editTask, location: '', lat: null, lon: null });
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
              onClick={updateTask}
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
              onClick={() => setEditOpen(false)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this task?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllScheduled;