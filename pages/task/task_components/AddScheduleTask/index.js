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

const OPENWEATHER_URL = "https://httpbin.org/get";
const STORAGE_KEYS = {
  SCHEDULED_TASKS: 'scheduled_tasks',
  PENDING_TASKS: 'pending_tasks',
};

const AddScheduledTask = () => {
  const [userId, setUserId] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [location, setLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [hasInteractedWithTime, setHasInteractedWithTime] = useState(false);
  const [availableForecastTimes, setAvailableForecastTimes] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const router = useRouter();


// Check online status
const checkOnlineStatus = async () => {
  try {
    await axios.get(OPENWEATHER_URL);
    setIsOffline(false);
    return true;
  } catch (error) {
    setIsOffline(true);
    return false;
  }
};

// Get tasks from Preferences
const getOfflineTasks = async () => {
  try {
    const { value } = await Preferences.get({ key: 'coconut_tasks' });
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error reading offline tasks:', error);
    return [];
  }
};

  // Get weather data from Preferences
  const getOfflineWeather = async () => {
    try {
      const { value } = await Preferences.get({ key: 'forecast_data' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error reading offline weather:', error);
      return [];
    }
  };



  // Check for duplicate tasks
  const checkDuplicateTask = async (taskId, date, time, location) => {
    try {
      // Check scheduled tasks
      const { value: scheduledValue } = await Preferences.get({ 
        key: STORAGE_KEYS.SCHEDULED_TASKS 
      });
      const scheduledTasks = JSON.parse(scheduledValue || '[]');
      
      // Check pending tasks
      const { value: pendingValue } = await Preferences.get({ 
        key: STORAGE_KEYS.PENDING_TASKS 
      });
      const pendingTasks = JSON.parse(pendingValue || '[]');
      
      // Check in both scheduled and pending tasks
      return [...scheduledTasks, ...pendingTasks].some(task => 
        task.task_id === taskId &&
        task.date === date &&
        task.time === time &&
        task.location === location
      );
    } catch (error) {
      console.error('Error checking for duplicate task:', error);
      return false;
    }
  };

   // Store task offline
  const storeOfflineTask = async (task) => {
  try {
    // Only store in pending tasks when offline
    const { value: pendingValue } = await Preferences.get({ 
      key: STORAGE_KEYS.PENDING_TASKS 
    });
    const pendingTasks = JSON.parse(pendingValue || '[]');
    pendingTasks.push(task);
    await Preferences.set({
      key: STORAGE_KEYS.PENDING_TASKS,
      value: JSON.stringify(pendingTasks)
    });
  } catch (error) {
    console.error('Error storing offline task:', error);
    throw error;
  }
};


 // Handle device registration and activity update
 const handleDeviceRegistration = async (deviceId) => {
  try {
    const isOnline = await checkOnlineStatus();
    if (!isOnline) {
      console.log('Device is offline, skipping registration');
      return;
    }

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
// Initialize user
useEffect(() => {
  const initializeUser = async () => {
    try {
      const { value: id } = await Preferences.get({ key: 'userId' });
      
      if (id) {
        setUserId(id);
        await handleDeviceRegistration(id);
      } else {
        const newId = crypto.randomUUID();
        await Preferences.set({
          key: 'userId',
          value: newId,
        });
        setUserId(newId);
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

  // Fetch available tasks with offline support
  useEffect(() => {
    const fetchAvailableTasks = async () => {
      try {
        const isOnline = await checkOnlineStatus();
        setIsOffline(!isOnline);

        let tasks;
        if (isOnline) {
          console.log('📡 Device is online - fetching tasks from API...');
          const response = await fetch(`${API_BASE_URL}/api/coconut_tasks`);
          if (!response.ok) {
            throw new Error(`Failed to fetch tasks: ${response.status}`);
          }
          const data = await response.json();
          tasks = data.coconut_tasks;
          
          // Cache the fresh data
          await Preferences.set({
            key: 'coconut_tasks',
            value: JSON.stringify(tasks)
          });
          
          console.log(`✅ Successfully fetched ${tasks.length} tasks from API`);
        } else {
          console.log('📱 Device is offline - retrieving tasks from storage...');
          tasks = await getOfflineTasks();
        }

        if (!Array.isArray(tasks)) {
          throw new Error('Invalid tasks data format');
        }
        setAvailableTasks(tasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        
        // Try to get cached tasks as fallback
        const cachedTasks = await getOfflineTasks();
        if (Array.isArray(cachedTasks) && cachedTasks.length > 0) {
          setAvailableTasks(cachedTasks);
        } else {
          toast.error('Unable to load tasks. Please check your connection.');
        }
      }
    };

    fetchAvailableTasks();
  }, []);

  // Fetch forecast times with offline support
  useEffect(() => {
    const fetchForecastTimes = async () => {
      try {
        const isOnline = await checkOnlineStatus();
        
        let forecastData;
        if (isOnline) {
          const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
          forecastData = response.data;
          
          // Cache the fresh data
          await Preferences.set({
            key: 'forecast_data',
            value: JSON.stringify(forecastData)
          });
        } else {
          forecastData = await getOfflineWeather();
        }

        const lastDate = forecastData[forecastData.length - 1]?.date;
        const timesForLastDate = forecastData
          .filter((item) => item.date === lastDate)
          .map((item) => dayjs(item.time, 'HH:mm:ss').format('HH:00'));

        setAvailableForecastTimes(timesForLastDate);
      } catch (error) {
        console.error("Error fetching forecast times:", error);
        // Try to get cached forecast data as fallback
        const cachedForecast = await getOfflineWeather();
        if (Array.isArray(cachedForecast) && cachedForecast.length > 0) {
          const lastDate = cachedForecast[cachedForecast.length - 1]?.date;
          const timesForLastDate = cachedForecast
            .filter((item) => item.date === lastDate)
            .map((item) => dayjs(item.time, 'HH:mm:ss').format('HH:00'));
          setAvailableForecastTimes(timesForLastDate);
        } else {
          toast.error("Failed to fetch forecast data");
        }
      }
    };

    fetchForecastTimes();
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

 // Modified handleCreateTask
  const handleCreateTask = async () => {
    if (!location || !selectedDate || !selectedTime || !hasInteractedWithTime || !selectedTask) {
      toast.error("Please complete all inputs");
      return;
    }

    try {
      const isOnline = await checkOnlineStatus();
      const coords = locationCoordinates[location];
      
      if (!coords) {
        toast.error("Invalid location");
        return;
      }

      const isDuplicate = await checkDuplicateTask(
        selectedTask.task_id,
        selectedDate,
        selectedTime,
        location
      );

      if (isDuplicate) {
        toast.error('This task already exists for the selected date, time, and location');
        return;
      }

      const newTask = {
        task_id: selectedTask.task_id,
        device_id: userId,
        location,
        lat: coords.lat,
        lon: coords.lon,
        date: selectedDate,
        time: selectedTime,
        task_name: selectedTask.task_name,
        created_at: new Date().toISOString(),
        synced: false
      };

      if (isOnline) {
        // Try online first
        const response = await fetch(`${API_BASE_URL}/api/createScheduleTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            task_name: selectedTask.task_name,
            date: selectedDate,
            time: selectedTime,
            location,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success('Task scheduled successfully!');
          resetForm();
          router.push('/task');
        } else {
          const data = await response.json();
          throw new Error(data.message || 'Failed to schedule task');
        }
      } else {
        // Store offline
        await storeOfflineTask(newTask);
        toast.success('Task stored offline and will sync when online');
        resetForm();
        router.push('/task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error(error.message || 'Error scheduling task');
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

  // useEffect(() => {
  //   // Fetch forecast data and extract available times for the last date
  //   const fetchInitialForecastData = async () => {
  //     try {
  //       const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
  //       const forecastData = response.data;

  //       const lastDate = forecastData[forecastData.length - 1]?.date;
  //       const timesForLastDate = forecastData
  //         .filter((item) => item.date === lastDate)
  //         .map((item) => dayjs(item.time, 'HH:mm:ss').format('HH:00'));

  //       setAvailableForecastTimes(timesForLastDate);
  //     } catch (error) {
  //       console.error("Error fetching initial forecast data:", error);
  //       showErrorToast("Failed to fetch initial forecast data.");
  //     }
  //   };

  //   fetchInitialForecastData();
  // }, []); 

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
