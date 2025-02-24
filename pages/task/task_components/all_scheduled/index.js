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

const OPENWEATHER_URL = "https://httpbin.org/get";
const STORAGE_KEYS = {
  SCHEDULED_TASKS: 'scheduled_tasks',
  PENDING_TASKS: 'pending_tasks',
  DELETED_TASKS: 'deleted_tasks', // New storage key for deleted tasks
};

const AllScheduled = () => {
  const [userTasks, setUserTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [userId, setUserId] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [weatherData, setWeatherData] = useState([]);
  const [taskRequirements, setTaskRequirements] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check online status
  const checkOnlineStatus = useCallback(async () => {
    try {
      await axios.get(OPENWEATHER_URL);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // Add new function to get offline tasks
  const getOfflineScheduledTasks = async () => {
    try {
      const { value: scheduledValue } = await Preferences.get({
        key: STORAGE_KEYS.SCHEDULED_TASKS
      });
      const { value: pendingValue } = await Preferences.get({
        key: STORAGE_KEYS.PENDING_TASKS
      });
      const { value: deletedValue } = await Preferences.get({
        key: STORAGE_KEYS.DELETED_TASKS
      });
     
      const scheduledTasks = JSON.parse(scheduledValue || '[]');
      const pendingTasks = JSON.parse(pendingValue || '[]');
      const deletedTaskIds = JSON.parse(deletedValue || '[]');
     
      // Remove any duplicate tasks and exclude deleted tasks
      const uniqueTasks = new Map();
     
      // Add scheduled tasks first
      scheduledTasks
        .filter(task => !deletedTaskIds.includes(task.sched_id))
        .forEach(task => {
          const key = `${task.task_id}-${task.date}-${task.time}-${task.location}`;
          uniqueTasks.set(key, task);
        });
     
      // Add pending tasks, potentially overwriting scheduled ones
      pendingTasks
        .filter(task => !deletedTaskIds.includes(task.sched_id))
        .forEach(task => {
          const key = `${task.task_id}-${task.date}-${task.time}-${task.location}`;
          uniqueTasks.set(key, task);
        });
     
      return Array.from(uniqueTasks.values());
    } catch (error) {
      console.error('Error reading offline tasks:', error);
      return [];
    }
  };

  // Add new function to handle deleted tasks storage
  const storeDeletedTask = async (taskId) => {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.DELETED_TASKS });
      const deletedTasks = JSON.parse(value || '[]');
     
      // Add the new taskId to deleted tasks if not already present
      if (!deletedTasks.includes(taskId)) {
        deletedTasks.push(taskId);
        await Preferences.set({
          key: STORAGE_KEYS.DELETED_TASKS,
          value: JSON.stringify(deletedTasks)
        });
      }
    } catch (error) {
      console.error('Error storing deleted task:', error);
    }
  };

  const syncDeletedTasks = async () => {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.DELETED_TASKS });
      const deletedTasks = JSON.parse(value || '[]');

      if (deletedTasks.length === 0) return;

      const deletePromises = deletedTasks.map(async (taskId) => {
        // Skip null or undefined taskIds
        if (!taskId) {
          console.warn("Skipping null or undefined taskId");
          return null;
        }
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/getScheduledTasks?schedId=${taskId}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error(`Failed to sync deleted task: ${taskId}`);
          }

          return taskId;
        } catch (error) {
          console.error(`Error syncing deleted task: ${taskId}`, error);
          return null;
        }
      });

      const syncedDeletes = await Promise.all(deletePromises);
      const successfulDeletes = syncedDeletes.filter(id => id !== null);

      if (successfulDeletes.length > 0) {
        // Remove successfully synced deletes from storage
        const remainingDeletes = deletedTasks.filter(
          id => !successfulDeletes.includes(id)
        );

        await Preferences.set({
          key: STORAGE_KEYS.DELETED_TASKS,
          value: JSON.stringify(remainingDeletes)
        });

        toast.success(`Successfully synced ${successfulDeletes.length} deleted tasks`);
      }
    } catch (error) {
      console.error('Error syncing deleted tasks:', error);
    }
  };

  // Add function to sync pending tasks
  const syncPendingTasks = async () => {
    try {
      setIsSyncing(true);
      const { value: pendingValue } = await Preferences.get({
        key: STORAGE_KEYS.PENDING_TASKS
      });
      const pendingTasks = JSON.parse(pendingValue || '[]');

      if (pendingTasks.length === 0) {
        return;
      }

      const syncResults = await Promise.all(pendingTasks.map(async (task) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/createScheduleTask`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: task.device_id,
              task_name: task.task_name,
              date: task.date,
              time: task.time,
              location: task.location,
            }),
          });

          // Consider both success (200) and conflict (409) as "successful syncs"
          // since a 409 means the task already exists on the server
          if (response.ok || response.status === 409) {
            return {
              task,
              status: response.status,
              success: true
            };
          }

          return {
            task,
            status: response.status,
            success: false,
            error: `Server returned ${response.status}`
          };
        } catch (error) {
          console.error(`Error syncing task: ${task.task_name}`, error);
          return {
            task,
            success: false,
            error: error.message
          };
        }
      }));

      const successfulSyncs = syncResults.filter(result => result.success);
      const failedSyncs = syncResults.filter(result => !result.success);
     
      // Log results for debugging
      console.log('Sync results:', {
        total: syncResults.length,
        successful: successfulSyncs.length,
        failed: failedSyncs.length,
        conflicts: syncResults.filter(r => r.status === 409).length
      });

      // If we have any successful syncs or 409 conflicts (which mean the task exists)
      if (successfulSyncs.length > 0) {
        if (failedSyncs.length === 0) {
          // All tasks were successfully synced or already existed on server
          // Clear the entire pending tasks storage
          await Preferences.set({
            key: STORAGE_KEYS.PENDING_TASKS,
            value: JSON.stringify([])
          });
          toast.success(`All ${successfulSyncs.length} tasks successfully synced`);
        } else {
          // Some tasks failed to sync, only remove the successful ones
          const remainingTasks = pendingTasks.filter(task =>
            failedSyncs.some(failedResult =>
              failedResult.task.task_id === task.task_id &&
              failedResult.task.date === task.date &&
              failedResult.task.time === task.time
            )
          );

          await Preferences.set({
            key: STORAGE_KEYS.PENDING_TASKS,
            value: JSON.stringify(remainingTasks)
          });

          toast.success(`Synced ${successfulSyncs.length} tasks, ${failedSyncs.length} failed`);
        }
      } else if (failedSyncs.length > 0) {
        toast.error(`Failed to sync ${failedSyncs.length} tasks`);
      }
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Error syncing tasks');
    } finally {
      setIsSyncing(false);
    }
  };

  // Get tasks from Preferences
  const getOfflineTasks = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: 'coconut_tasks' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error reading offline tasks:', error);
      return [];
    }
  }, []);

  // Get weather data from Preferences
  const getOfflineWeather = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: 'forecast_data' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error reading offline weather:', error);
      return [];
    }
  }, []);
 
  // Handle device registration and activity update
  const handleDeviceRegistration = async (deviceId) => {
    try {
      // Check if device is online before attempting to update activity
      const isOnline = await checkOnlineStatus();
      
      if (!isOnline) {
        console.log('Device is offline - skipping activity update');
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
        // If this is a new device, show a welcome message
        if (data.isNewDevice) {
          toast.success('Welcome to the application!');
        }
      } else {
        throw new Error(data.error || 'Failed to update device activity');
      }
    } catch (error) {
      console.error('Error handling device registration:', error);
      // Don't show error toast if offline - this is expected behavior
      if (await checkOnlineStatus()) {
        toast.error('Error connecting to the service');
      }
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
      return { feasible: true, reason: 'Past task' };
    }

    const taskDateFormatted = dayjs(task.date).format('YYYY-MM-DD');
   
    // Find weather info for the task
    const weatherInfo = weatherData.find(w => {
      // Convert time formats to match (ensuring they're both in HH:00 format)
      const taskTimeFormatted = dayjs(task.time, 'HH:mm').format('HH:00');
      const weatherTimeFormatted = dayjs(w.time, 'HH:mm:ss').format('HH:00');
     
      return w.date === taskDateFormatted &&
             weatherTimeFormatted === taskTimeFormatted &&
             w.location === task.location;
    });

    if (!weatherInfo) {
      console.log('Weather data not found for:', {
        date: taskDateFormatted,
        time: task.time,
        location: task.location,
        availableWeather: weatherData
      });
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
  // Fetch weather and tasks
  useEffect(() => {
    const fetchWeatherAndTasks = async () => {
      try {
        setLoadingWeather(true);
        const isOnline = await checkOnlineStatus();
        setIsOffline(!isOnline);

        let weatherResult, tasksResult;

        if (isOnline) {
          console.log('📡 Device is online - fetching data from API...');
          const [weatherResponse, tasksResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/getWeatherData`),
            axios.get(`${API_BASE_URL}/api/coconut_tasks`)
          ]);
         
          weatherResult = weatherResponse.data;
          tasksResult = tasksResponse.data.coconut_tasks;

        } else {
          console.log('📱 Device is offline - retrieving data from storage...');
          weatherResult = await getOfflineWeather();
          tasksResult = await getOfflineTasks();
        }

        setWeatherData(weatherResult);
        setTaskRequirements(tasksResult);
        setAvailableTasks(tasksResult);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch weather and task data');

        // Try to get cached data as fallback
        try {
          const cachedWeather = await getOfflineWeather();
          const cachedTasks = await getOfflineTasks();
         
          if (cachedWeather && cachedTasks) {
            setWeatherData(cachedWeather);
            setTaskRequirements(cachedTasks);
            setAvailableTasks(cachedTasks);
          }
        } catch (fallbackError) {
          console.error('Error getting cached data:', fallbackError);
        }
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeatherAndTasks();
  }, [checkOnlineStatus, getOfflineWeather, getOfflineTasks]);

  useEffect(() => {
    const fetchUserId = async () => {
      const { value: id } = await Preferences.get({ key: 'userId' });
      setUserId(id);
    };
 
    fetchUserId();
  }, []);

 
  // Modify the existing fetchTasks effect
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const isOnline = await checkOnlineStatus();
        setIsOffline(!isOnline);

        let tasks;
        if (isOnline) {
          // Sync deleted tasks first
          await syncDeletedTasks();
          // Then sync pending tasks
          await syncPendingTasks();
         
          // Finally fetch all tasks from the server
          const response = await fetch(`${API_BASE_URL}/api/getScheduledTasks?deviceId=${userId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch tasks from server');
          }
          tasks = await response.json();
         
          // Update offline storage with latest data
          await Preferences.set({
            key: STORAGE_KEYS.SCHEDULED_TASKS,
            value: JSON.stringify(tasks)
          });
        } else {
          // Get tasks from offline storage
          tasks = await getOfflineScheduledTasks();
        }

        setUserTasks(tasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Error loading tasks');
       
        // Fallback to offline data if fetch fails
        const offlineTasks = await getOfflineScheduledTasks();
        setUserTasks(offlineTasks);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [userId, checkOnlineStatus]);

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
          date: editTask.date,     // This will now have the updated date
          time: editTask.time,     // This will now have the updated time
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
 
  // Modified delete handler to update UI immediately
  const confirmDelete = async () => {
    try {
      const isOnline = await checkOnlineStatus();
      
      if (isOnline) {
        const response = await fetch(`${API_BASE_URL}/api/getScheduledTasks?schedId=${deleteTaskId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete task');
        }
      } else {
        // Store the deleted task ID for later sync
        await storeDeletedTask(deleteTaskId);
      }

      // Update local state immediately - remove the deleted task
      setUserTasks(prevTasks => prevTasks.filter(task => task.sched_id !== deleteTaskId));
      
      // Also update filtered tasks to maintain UI consistency
      setFilteredTasks(prevTasks => prevTasks.filter(task => task.sched_id !== deleteTaskId));
      
      // Update local storage
      const offlineTasks = await getOfflineScheduledTasks();
      
      // Close the dialog
      setDeleteOpen(false);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Error deleting task');
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