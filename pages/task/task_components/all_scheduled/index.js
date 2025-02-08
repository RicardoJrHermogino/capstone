import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, 
  Grid, 
  Box, 
  ToggleButtonGroup, 
  ToggleButton,
  CircularProgress 
} from '@mui/material';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';

import API_BASE_URL from '@/config/apiConfig';
import TaskCard from './TaskCard';
import EditTaskDialog from './editDialog';
import DeleteConfirmationDialog from './confDelete';


const AllScheduled = () => {
  const [userTasks, setUserTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [userId, setUserId] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [taskRequirements, setTaskRequirements] = useState([]);
  
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

  // Filter state
  const [filterType, setFilterType] = useState('all');

  // Edit Task State
  const [editTask, setEditTask] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // Delete Task State
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

// Update the checkTaskFeasibility function in AllScheduled.js
const checkTaskFeasibility = useCallback((task, weatherData, taskRequirements) => {
  if (!task || !weatherData || !taskRequirements) {
    return { feasible: false, reason: 'Missing data for feasibility check' };
  }

  // Check if task is in the past
  const now = dayjs();
  const taskDateTime = dayjs(`${task.date}T${task.time}`);
  if (taskDateTime.isBefore(now)) {
    return { feasible: true, reason: 'Past task' }; // We mark it as feasible to avoid error styling
  }

  const taskDateFormatted = dayjs(task.date).format('YYYY-MM-DD');
  
  // Rest of the existing feasibility check logic...
  const weatherInfo = weatherData.find(w => 
    w.date === taskDateFormatted &&
    w.time.toString() === task.time.toString() && 
    w.location === task.location
  );

  if (!weatherInfo) {
    return { feasible: false, reason: 'No weather data available' };
  }

  const requirements = taskRequirements.find(r => r.task_name === task.task_name);
  if (!requirements) {
    return { feasible: false, reason: 'Task requirements not found' };
  }

  let weatherRestrictions;
  try {
    weatherRestrictions = JSON.parse(requirements.weatherRestrictions);
  } catch (error) {
    console.error('Error parsing weather restrictions:', error);
    return { feasible: false, reason: 'Invalid weather restrictions data' };
  }

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

  if (!checks.temperature) return { feasible: false, reason: 'Temperature outside acceptable range' };
  if (!checks.humidity) return { feasible: false, reason: 'Humidity outside acceptable range' };
  if (!checks.windSpeed) return { feasible: false, reason: 'Wind speed too high' };
  if (!checks.windGust) return { feasible: false, reason: 'Wind gusts too strong' };
  if (!checks.pressure) return { feasible: false, reason: 'Atmospheric pressure outside acceptable range' };
  if (!checks.weather) return { feasible: false, reason: 'Weather conditions unsuitable' };

  return { feasible: true, reason: 'All conditions suitable' };
}, []);


  // Add debug log in filterTasks
const filterTasks = useCallback(() => {
  console.log('Filtering tasks:', {
    userTasks,
    weatherData,
    taskRequirements,
    filterType
  }); // Debug log
  
  if (!userTasks.length) return [];

  const tasksWithFeasibility = userTasks.map(task => {
    const feasibility = checkTaskFeasibility(task, weatherData, taskRequirements);
    console.log('Task feasibility:', { task, feasibility }); // Debug log
    return {
      ...task,
      feasibility
    };
  });

  switch (filterType) {
    case 'feasible':
      return tasksWithFeasibility.filter(task => task.feasibility.feasible);
    case 'not-feasible':
      return tasksWithFeasibility.filter(task => !task.feasibility.feasible);
    default:
      return tasksWithFeasibility;
  }
}, [userTasks, weatherData, taskRequirements, filterType, checkTaskFeasibility]);


     // Update tasks effect
  useEffect(() => {
    const filtered = filterTasks();
    setFilteredTasks(filtered);
  }, [filterTasks, userTasks, weatherData, taskRequirements]);
        
      // Handle Filter Change
      const handleFilterChange = (event, newFilterType) => {
        if (newFilterType !== null) {
          setFilterType(newFilterType);
        }
      };
  
 // Add debug logs in your weather and tasks fetch
 useEffect(() => {
  const fetchWeatherAndTasks = async () => {
    try {
      setLoadingWeather(true);
      const [weatherResponse, tasksResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/getWeatherData`),
        axios.get(`${API_BASE_URL}/api/coconut_tasks`)
      ]);
      
      setWeatherData(weatherResponse.data);
      setTaskRequirements(tasksResponse.data.coconut_tasks);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch weather data');
    } finally {
      setLoadingWeather(false);
    }
  };

  fetchWeatherAndTasks();
}, []);

 
  
    useEffect(() => {
      const fetchUserId = async () => {
        const { value: id } = await Preferences.get({ key: 'userId' });
        setUserId(id);
      };
  
      fetchUserId();
    }, []);
  
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
  
    // Add these debug logs in your fetchTasks useEffect
useEffect(() => {
  if (userId) {
    const fetchTasks = async () => {
      try {
        console.log('Fetching tasks for userId:', userId); // Debug log
        const response = await fetch(`${API_BASE_URL}/api/getScheduledTasks?deviceId=${userId}`);

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched tasks:', data); // Debug log
          setUserTasks(data);
        } else {
          console.error('Failed to fetch tasks with status:', response.status);
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
  
    const [reloading, setReloading] = useState(false); // Add this state at the top with other states

    const updateTask = async () => {
      if (!editTask) return;
    
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
    
        const data = await response.json();
        
        if (response.ok) {
          setEditOpen(false);
          toast.success('Task updated successfully');
          setReloading(true); // Set loading state to true
          
          // Add a small delay to show the loading state
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else if (response.status === 409) {
          toast.error('A task with these details already exists');
        } else {
          toast.error(data.message || 'Failed to update task');
        }
      } catch (error) {
        console.error('Failed to update task:', error);
        toast.error('Error updating task');
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
          setUserTasks(userTasks.filter((task) => task.sched_id !== deleteTaskId));
          setDeleteOpen(false);
        }
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    };
  
    if (loading || loadingWeather) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
          }}
        >
          <CircularProgress />
        </Box>
      );
    }
  

    return (
      <Box sx={{ mt: 4 }}>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={2}
      >
        <Typography variant="h6" gutterBottom align="left">
          <strong>Scheduled Tasks</strong>
        </Typography>
          
        <ToggleButtonGroup
          value={filterType}
          exclusive
          onChange={handleFilterChange}
          aria-label="task filter"
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="feasible">Feasible</ToggleButton>
          <ToggleButton value="not-feasible">Not Feasible</ToggleButton>
        </ToggleButtonGroup>
      </Box>
  
      <Grid container spacing={2} mt={2}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard 
              key={task.sched_id} 
              task={task} 
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              feasibility={task.feasibility}
            />
          ))
        ) : (
          <Box 
            sx={{
              mt: 10,
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              width: '100%',
              height: '100%'
            }}
          >
            <Typography>
              No tasks found for the selected filter.
            </Typography>
          </Box>
        )}
      </Grid>

  
      <EditTaskDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        task={editTask}
        setTask={setEditTask}
        onUpdate={updateTask}
        availableTasks={availableTasks}
      />

      <DeleteConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
          {reloading && (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
        }}
      >
        <CircularProgress size={60} />
      </Box>
    )}

    </Box>
  );
};

  
  export default AllScheduled;