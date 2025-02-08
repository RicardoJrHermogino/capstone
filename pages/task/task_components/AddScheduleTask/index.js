import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Typography, Box, Card, CardContent, 
  Button, DialogActions, Grid, FormControl,
  InputLabel, Select, MenuItem, TextField,
  Autocomplete, OutlinedInput, InputAdornment, IconButton, 
} from '@mui/material';
import { Preferences } from '@capacitor/preferences';
import dayjs from 'dayjs';
import axios from 'axios';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { locationCoordinates } from '@/utils/locationCoordinates';
import API_BASE_URL from '@/config/apiConfig';
import DateSelector from './DateSelector';
import TimeSelector from './TimeSelector';
import { toast } from 'react-hot-toast';




const AddScheduledTask = () => {
  const [userId, setUserId] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [location, setLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [hasInteractedWithTime, setHasInteractedWithTime] = useState(false);
  const [lastAvailableTimes, setLastAvailableTimes] = useState([]);
  const [availableForecastTimes, setAvailableForecastTimes] = useState([]);
  const router = useRouter();


// Handle device registration and activity update
const handleDeviceRegistration = async (deviceId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/devices/update_activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Device activity updated:', data);
      // If this is a new device, show a welcome message
      if (data.isNewDevice) {
        toast.success('Welcome to the application!');
      }
    } else {
      throw new Error(data.error || 'Failed to update device activity');
    }
  } catch (error) {
    console.error('Error handling device registration:', error);
    toast.error('Error connecting to the service');
  }
};
// Fetch userId and handle device registration
useEffect(() => {
  const initializeUser = async () => {
    try {
      // Get existing userId
      const { value: id } = await Preferences.get({ key: 'userId' });
      
      if (id) {
        setUserId(id);
        // Handle device registration/activity update
        await handleDeviceRegistration(id);
      } else {
        // If no userId exists, create one
        const newId = crypto.randomUUID();
        await Preferences.set({
          key: 'userId',
          value: newId,
        });
        setUserId(newId);
        // Register the new device
        await handleDeviceRegistration(newId);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      toast.error('Error initializing application');
    }
  };

  initializeUser();
}, []);



  const commonInputStyles = {
    backgroundColor: "#f5f7fa",
    borderRadius: "10px",
    '& .MuiOutlinedInput-root': {
      borderRadius: "10px"
    }
  };

  const renderInputWithIcon = (icon, label) => ({
    startAdornment: (
      <InputAdornment position="start">
        {icon}
      </InputAdornment>
    ),
    label: label
  });


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
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchAvailableTasks();
  }, []);



  // Handle location change
  const handleLocationChange = (event, newValue) => {
    if (newValue) {
      setLocation(newValue);
    }
  };

  // Handle date change
  const handleDateChange = (event) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
    setSelectedTime(''); // Reset time when date changes
    setHasInteractedWithTime(false);
  };

  // Handle time change
  const handleTimeChange = (event) => {
    const newTime = event.target.value;
    setSelectedTime(newTime);
    setHasInteractedWithTime(true);
  };

  // Handle task change
  const handleTaskChange = (event) => {
    const newTaskName = event.target.value;
    const task = availableTasks.find(t => t.task_name === newTaskName);
    setSelectedTask(task);
  };

  // Create Task
  const handleCreateTask = async () => {
    if (!location || !selectedDate || !selectedTime || !hasInteractedWithTime || !selectedTask) {
      alert("Please complete all inputs");
      return;
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/api/createScheduleTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          task_name: selectedTask?.task_name,
          date: selectedDate,
          time: selectedTime,
          location,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        toast.success('Task scheduled successfully!');
        resetForm();
        router.push('/task');
      } else if (response.status === 409) {
        toast.error('This task already exists for the selected date, time, and location');
      } else {
        toast.error(data.message || 'Failed to schedule task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Error scheduling task');
    }
  };

  // Reset form
  const resetForm = () => {
    setLocation('');
    setLocationInput('');
    setSelectedDate('');
    setSelectedTime('');
    setSelectedTask(null);
    setHasInteractedWithTime(false);
  };

  useEffect(() => {
    // Fetch forecast data and extract available times for the last date
    const fetchInitialForecastData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
        const forecastData = response.data;

        const lastDate = forecastData[forecastData.length - 1]?.date;
        const timesForLastDate = forecastData
          .filter((item) => item.date === lastDate)
          .map((item) => dayjs(item.time, 'HH:mm:ss').format('HH:00'));

        setAvailableForecastTimes(timesForLastDate);
      } catch (error) {
        console.error("Error fetching initial forecast data:", error);
        showErrorToast("Failed to fetch initial forecast data.");
      }
    };

    fetchInitialForecastData();
  }, []); 

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Box sx={{ mt: 4, px: 2 }}>
    <IconButton 
          onClick={() => router.back()}
          sx={{
            color: 'text.secondary',
            bgcolor: 'rgba(0,0,0,0.05)',
            mr: 2,
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.1)'
            }
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
      <Typography variant="h6" gutterBottom align="left">
        <strong>Schedule a Task</strong>
      </Typography>
      <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "70vh", // Adjust this value as needed
      }}
    >
      <Card sx={{ borderRadius: 2, width: "100%", maxWidth: 500 }}>
        <CardContent>
          <Box display="flex" flexDirection="column" gap={3}>

              {/* Task Select */}
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Task
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedTask?.task_name || ''}
                  onChange={handleTaskChange}
                  input={
                    <OutlinedInput
                      label="Task"
                      startAdornment={
                        <InputAdornment position="start">
                          <LocationOnIcon />
                        </InputAdornment>
                      }
                    />
                  }
                  sx={{
                    backgroundColor: "#f5f7fa",
                    borderRadius: "10px"
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 560,
                      },
                    },
                  }}
                >
                  {availableTasks.map((task) => (
                    <MenuItem key={task.id} value={task.task_name}>
                      {task.task_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Location Select */}
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Location
              </Typography>
              <FormControl fullWidth>
                <Autocomplete
                  value={location}
                  onChange={handleLocationChange}
                  inputValue={locationInput}
                  onInputChange={(event, newInputValue) => {
                    if (!/\d/.test(newInputValue)) {
                      setLocationInput(newInputValue);
                    }
                  }}
                  options={Object.keys(locationCoordinates)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select Location"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <LocationOnIcon sx={{ mr: 1 }} />
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#f5f7fa",
                          borderRadius: "10px"
                        }
                      }}
                    />
                  )}
                />
              </FormControl>
            </Grid>

            <Grid container spacing={2}>
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
            setHasInteractedWithTime={setHasInteractedWithTime} // Pass the function here
          />
          </Grid>

            </Grid>
          </Box>
        </CardContent>

        <DialogActions>
          <Box sx={{ width: '100%', px: 3, pb: 3 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleCreateTask}
              sx={{
                backgroundColor: '#48ccb4',
                color: 'white',
                borderRadius: '9999px',
                py: 1.9,
                mb: 1,
                textTransform: 'none',
                fontSize: '15px',
                '&:hover': {
                  backgroundColor: '#40b8a5',
                }
              }}
            >
              Schedule Task
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={resetForm}
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
              Reset
            </Button>
          </Box>
        </DialogActions>
      </Card>
      </Box>
    </Box>
    </LocalizationProvider>
  );
};

export default AddScheduledTask;
