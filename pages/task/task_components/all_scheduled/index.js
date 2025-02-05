import React, { useState, useEffect } from 'react';
import { 
  Typography, Grid, Box, 
  ToggleButtonGroup, 
  ToggleButton
} from '@mui/material';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import dayjs from 'dayjs';

import API_BASE_URL from '@/config/apiConfig';
import TaskCard from './TaskCard';
import EditTaskDialog from './editDialog';
import DeleteConfirmationDialog from './confDelete';

const AllScheduled = () => {
  const [userTasks, setUserTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [taskRequirements, setTaskRequirements] = useState([]);
  
  

  // Filter state
  const [filterType, setFilterType] = useState('all');

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

       // Filter Tasks
       const filterTasks = () => {
        if (!userTasks.length) return [];
    
        switch (filterType) {
          case 'feasible':
            return userTasks.filter(task => {
              const feasibility = checkTaskFeasibility(task, weatherData, taskRequirements);
              return feasibility.feasible;
            });
          case 'not-feasible':
            return userTasks.filter(task => {
              const feasibility = checkTaskFeasibility(task, weatherData, taskRequirements);
              return !feasibility.feasible;
            });
          default:
            return userTasks;
        }
      };
    
      // Handle Filter Change
      const handleFilterChange = (event, newFilterType) => {
        if (newFilterType !== null) {
          setFilterType(newFilterType);
        }
      };
  
    // Fetch data useEffects
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

    // Apply filter whenever tasks or filter type changes
  useEffect(() => {
    const filtered = filterTasks();
    setFilteredTasks(filtered);
  }, [userTasks, filterType, weatherData, taskRequirements]);


 
  
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
            <ToggleButton value="all">
              All 
            </ToggleButton>
            <ToggleButton value="feasible">
              Feasible
            </ToggleButton>
            <ToggleButton value="not-feasible">
              Not Feasible
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
  
        <Grid container spacing={2} mt={2}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard 
                key={task.sched_id} 
                task={task} 
                weatherData={weatherData}
                taskRequirements={taskRequirements}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))
          ) : (
            <Typography>No tasks found for the selected filter.</Typography>
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
      </Box>
    );
  };
  
  export default AllScheduled;