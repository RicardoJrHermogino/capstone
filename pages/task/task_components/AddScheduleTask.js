import React, { useState, useEffect } from 'react';
import { 
  Typography, Box, Card, CardContent, 
  Button, DialogActions, Grid, FormControl,
  InputLabel, Select, MenuItem, TextField,
  Autocomplete, OutlinedInput, InputAdornment
} from '@mui/material';
import { Preferences } from '@capacitor/preferences';
import dayjs from 'dayjs';
import axios from 'axios';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { locationCoordinates } from '@/utils/locationCoordinates';
import API_BASE_URL from '@/config/apiConfig';

const AddScheduledTask = () => {
  const [userId, setUserId] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [location, setLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [hasInteractedWithTime, setHasInteractedWithTime] = useState(false);
  const [lastAvailableTimes, setLastAvailableTimes] = useState([]);

  // Time intervals for the time picker
  const timeIntervals = [
    '00:00', '03:00', '06:00', '09:00', 
    '12:00', '15:00', '18:00', '21:00'
  ];

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

  // Fetch available dates
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
        const forecastData = response.data;

        const uniqueDates = [...new Set(forecastData.map(item => 
          dayjs(item.date).format('YYYY-MM-DD')
        ))]
        .filter(date => !dayjs(date).isBefore(dayjs(), 'day'))
        .sort();

        setAvailableDates(uniqueDates);
      } catch (error) {
        console.error('Error fetching available dates:', error);
        // Fallback to next 6 days
        const fallbackDates = Array.from({ length: 6 }, (_, i) =>
          dayjs().add(i, "day").format("YYYY-MM-DD")
        );
        setAvailableDates(fallbackDates);
      }
    };

    fetchAvailableDates();
  }, []);

  // Fetch available times when date changes
  useEffect(() => {
    const fetchAvailableTimeIntervals = async () => {
      if (!selectedDate) return;
  
      try {
        const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
        const forecastData = response.data;
  
        // Filter forecast data for the selected date
        const timesForDate = forecastData
          .filter(item => item.date === selectedDate)
          .map(item => dayjs(item.time, 'HH:mm:ss').format('HH:mm'))
          .filter(time => {
            const fullTime = dayjs(`${selectedDate} ${time}`);
            return !fullTime.isBefore(dayjs()); // Only show future times
          });
  
        setAvailableTimes(timesForDate);
  
        // If selected date is the last available date, determine which times are reachable
        if (selectedDate === availableDates[availableDates.length - 1]) {
          const reachableTimesForLastDate = forecastData
            .filter(item => item.date === selectedDate && item.isReachable)  // Adjust based on your API structure
            .map(item => dayjs(item.time, 'HH:mm:ss').format('HH:mm'));
  
          setLastAvailableTimes(reachableTimesForLastDate);  // Store reachable times for the last date
        }
  
      } catch (error) {
        console.error('Error fetching time intervals:', error);
        setAvailableTimes(timeIntervals); // Fallback to all intervals
      }
    };
  
    fetchAvailableTimeIntervals();
  }, [selectedDate, availableDates]);  // Trigger effect when date or available dates change

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

      if (response.ok) {
        alert('Task scheduled successfully!');
        resetForm();
      } else {
        alert('Failed to schedule task');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Error scheduling task');
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

  return (
    <Box sx={{ mt: 4, px: 2 }}>
      <Typography variant="h6" gutterBottom align="left">
        <strong>Schedule a Task</strong>
      </Typography>
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" flexDirection="column" gap={3}>
            <Grid container spacing={2}>

              {/* Task Select */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Task</InputLabel>
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

              

              {/* Date Picker */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Date</InputLabel>
                  <Select
                    value={selectedDate}
                    onChange={handleDateChange}
                    input={
                      <OutlinedInput
                        label="Date"
                        startAdornment={
                          <InputAdornment position="start">
                            <CalendarTodayIcon />
                          </InputAdornment>
                        }
                      />
                    }
                    sx={{
                      backgroundColor: "#f5f7fa",
                      borderRadius: "10px"
                    }}
                  >
                    {availableDates.map((date) => (
                      <MenuItem key={date} value={date}>
                        {dayjs(date).format("MMMM D, YYYY")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Time Picker */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Time</InputLabel>
                  <Select
                    value={selectedTime}
                    onChange={handleTimeChange}
                    input={
                      <OutlinedInput
                        label="Time"
                        startAdornment={
                          <InputAdornment position="start">
                            <AccessTimeIcon />
                          </InputAdornment>
                        }
                      />
                    }
                    sx={{
                      backgroundColor: "#f5f7fa",
                      borderRadius: "10px",
                    }}
                  >
                    {timeIntervals.map((time) => {
                      const currentDate = dayjs();
                      const selectedDateTime = dayjs(`${selectedDate} ${time}`, "YYYY-MM-DD HH:mm");

                      const isPastTime = selectedDate === currentDate.format("YYYY-MM-DD") &&
                                          selectedDateTime.isBefore(currentDate);

                      // Check if it's the last available date
                      const isLastDate = selectedDate === availableDates[availableDates.length - 1];
                      const isUnavailableInLastDate = isLastDate && !lastAvailableTimes.includes(time); // Disable if time is not reachable for last date

                      return (
                        <MenuItem
                          key={time}
                          value={time}
                          disabled={isPastTime || isUnavailableInLastDate} // Disable past or unavailable times
                        >
                          {dayjs(`2000-01-01 ${time}`).format("hh:mm A")}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
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
  );
};

export default AddScheduledTask;
