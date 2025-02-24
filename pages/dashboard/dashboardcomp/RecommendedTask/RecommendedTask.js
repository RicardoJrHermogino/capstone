import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Grid, Typography, Paper, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { Preferences } from '@capacitor/preferences';
import TaskDetailsDialog from './TaskDetailsDialog'; // Using the separate dialog component
import dayjs from 'dayjs';
import API_BASE_URL from '@/config/apiConfig';
import axios from 'axios';



// New function to rank tasks similar to AllRecommendedTasksPage
// Replace the existing getRecommendedTasks function with this updated version
const getRecommendedTasks = (weatherData, tasks) => {
  try {
    const { main, wind, clouds, weather } = weatherData;
    const weatherConditionCode = weather[0]?.id;

    // Function to calculate score for a single weather parameter
    const calculateParameterScore = (actual, min, max, paramName, weight = 1) => {
      if (actual < min || actual > max) {
        console.log(`❌ ${paramName}: Out of range (${actual} not between ${min} and ${max})`);
        return { score: 0, explanation: `${paramName} is outside acceptable range` };
      }
      
      // Calculate score based on how close the actual value is to the ideal range
      const range = max - min;
      const idealCenter = (min + max) / 2;
      const distanceFromCenter = Math.abs(actual - idealCenter);
      const normalizedScore = 1 - (distanceFromCenter / (range / 2));
      const score = Math.max(0, Math.min(1, normalizedScore)) * weight;
      
      console.log(`✅ ${paramName}: 
        Actual: ${actual}, 
        Range: ${min}-${max}, 
        Score: ${(score * 100).toFixed(2)}%`);
      
      return { 
        score, 
        explanation: `${paramName} is close to ideal range (${(score * 100).toFixed(2)}% match)` 
      };
    };

    // Rank and score tasks
    const rankedTasks = tasks
      .map(task => {
        try {
          const weatherRestrictions = JSON.parse(task.weatherRestrictions || '[]');

          console.log(`\n🔍 Analyzing Task: ${task.task_name}`);

          // Initial check for hard requirements
          const passesBasicRequirements = 
            main.temp >= task.requiredTemperature_min &&
            main.temp <= task.requiredTemperature_max &&
            main.humidity >= task.idealHumidity_min &&
            main.humidity <= task.idealHumidity_max &&
            main.pressure >= task.requiredPressure_min &&
            main.pressure <= task.requiredPressure_max &&
            wind.speed <= task.requiredWindSpeed_max &&
            (wind.gust || 0) <= task.requiredWindGust_max &&
            clouds.all <= task.requiredCloudCover_max &&
            (weatherRestrictions.length === 0 ||
              weatherRestrictions.includes(weatherConditionCode));

          if (!passesBasicRequirements) {
            console.log('❌ Task does not meet basic weather requirements');
            return null;
          }

          // Calculate detailed weather match score
          const scores = {
            temperature: calculateParameterScore(
              main.temp, 
              task.requiredTemperature_min, 
              task.requiredTemperature_max, 
              'Temperature', 
              2  // Higher weight for temperature
            ),
            humidity: calculateParameterScore(
              main.humidity, 
              task.idealHumidity_min, 
              task.idealHumidity_max, 
              'Humidity'
            ),
            pressure: calculateParameterScore(
              main.pressure, 
              task.requiredPressure_min, 
              task.requiredPressure_max, 
              'Pressure'
            ),
            windSpeed: calculateParameterScore(
              wind.speed, 
              0, 
              task.requiredWindSpeed_max, 
              'Wind Speed'
            ),
            windGust: calculateParameterScore(
              wind.gust || 0, 
              0, 
              task.requiredWindGust_max, 
              'Wind Gust'
            ),
            cloudCover: calculateParameterScore(
              clouds.all, 
              0, 
              task.requiredCloudCover_max, 
              'Cloud Cover'
            ),
            weatherCondition: (() => {
              if (weatherRestrictions.length === 0) {
                console.log('✅ No specific weather condition restrictions');
                return { score: 1, explanation: 'No weather condition restrictions' };
              }
              
              const isMatchingCondition = weatherRestrictions.includes(weatherConditionCode);
              console.log(`${isMatchingCondition ? '✅' : '❌'} Weather Condition: 
                Current: ${weatherConditionCode}, 
                Allowed: ${weatherRestrictions.join(', ')}`);
              
              return {
                score: isMatchingCondition ? 1 : 0,
                explanation: isMatchingCondition 
                  ? 'Matches required weather condition' 
                  : 'Does not match required weather condition'
              };
            })()
          };

          // Calculate overall weather match score
          const scoreValues = Object.values(scores).map(s => s.score);
          const overallScore = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

          console.log(`\n📊 Overall Weather Match Score for ${task.task_name}: 
            ${(overallScore * 100).toFixed(2)}%`);
          
          console.log('Detailed Score Breakdown:');
          Object.entries(scores).forEach(([key, value]) => {
            console.log(`- ${key}: ${(value.score * 100).toFixed(2)}% (${value.explanation})`);
          });

          return {
            ...task,
            weatherMatchScore: overallScore,
            scoreDetails: scores
          };
        } catch (error) {
          console.error(`Error processing task ${task.task_name}:`, error);
          return null;
        }
      })
      .filter(Boolean)  // Remove null entries
      .sort((a, b) => b.weatherMatchScore - a.weatherMatchScore)  // Sort by descending score
      .map((task, index) => ({
        ...task,
        rank: index + 1  // Add ranking
      }));

    console.log('\n🏆 Final Task Ranking:');
    rankedTasks.forEach(task => {
      console.log(`${task.rank}. ${task.task_name} - ${(task.weatherMatchScore * 100).toFixed(2)}% match`);
    });

    return rankedTasks;
  } catch (error) {
    console.error('Error in getRecommendedTasks:', error);
    return [];
  }
};

// Function to extract weather data
const extractWeatherData = (data) => {
  if (!data) return null;

  if (data.weather) {
    return {
      temp: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windGust: data.wind.gust,
      clouds: data.clouds.all,
      weatherId: data.weather[0]?.id,
    };
  } else if (data.temperature !== undefined) {
    return {
      location: data.location,
      date: data.date,
      time: data.time,
      temp: data.temperature,
      humidity: data.humidity,
      pressure: data.pressure,
      windSpeed: data.wind_speed,
      windGust: data.wind_gust,
      clouds: data.clouds,
      weatherId: data.weather_id,
    };
  }
  return null;
};

// Function to evaluate if a task is suitable based on the weather
const evaluateTask = (task, weather) => {
  if (!weather) return false;

  try {
    const weatherRestrictions = task.weatherRestrictions ? JSON.parse(task.weatherRestrictions) : [];
    
    return (
      weather.temp >= task.requiredTemperature_min &&
      weather.temp <= task.requiredTemperature_max &&
      weather.humidity >= task.idealHumidity_min &&
      weather.humidity <= task.idealHumidity_max &&
      weather.pressure >= task.requiredPressure_min &&
      weather.pressure <= task.requiredPressure_max &&
      weather.windSpeed <= task.requiredWindSpeed_max &&
      (weather.windGust || 0) <= task.requiredWindGust_max &&
      weather.clouds <= task.requiredCloudCover_max &&
      (weatherRestrictions.length === 0 || weatherRestrictions.includes(weather.weatherId))
    );
  } catch (error) {
    console.error('Error evaluating task:', error);
    return false;
  }
};

const OPENWEATHER_URL = "https://httpbin.org/get";


// Main RecommendedTask component
const RecommendedTask = ({ weatherData, currentWeatherData, useCurrentWeather, location, selectedDate, selectedTime }) => {
  const [tasksData, setTasksData] = useState([]);
  const [recommendedTasks, setRecommendedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const router = useRouter();

  const checkOnlineStatus = useCallback(async () => {
    try {
      await axios.get(OPENWEATHER_URL);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // Get tasks from Capacitor Preferences
  const getOfflineTasks = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: 'coconut_tasks' });
      if (value) {
        return JSON.parse(value);
      }
      return [];
    } catch (error) {
      console.error('Error reading offline tasks:', error);
      return [];
    }
  }, []);
  
  // Check if the selected time is 12 AM (00:00) or 9 PM (21:00)
  const isTimeRestricted = (selectedTime) => {
    const time = dayjs(selectedTime, 'HH:mm').hour();
    return time === 0 || time === 21; // 12 AM (00:00) or 9 PM (21:00)
  };

  // Load saved tasks on initial render
  useEffect(() => {
    const loadSavedTasks = async () => {
      try {
        const savedTasksString = localStorage.getItem('recommendedTasks');
        if (savedTasksString) {
          const savedTasks = JSON.parse(savedTasksString);
          setRecommendedTasks(savedTasks);
        }
      } catch (error) {
        console.error('Error loading saved tasks:', error);
      }
    };
    loadSavedTasks();
  }, []);

  // Save recommendation context to local storage or preferences
  const saveRecommendationContext = useCallback(async (context) => {
    try {
      const contextString = JSON.stringify(context);
      if (typeof window !== "undefined") {
        localStorage.setItem('recommendationContext', contextString);
      } else {
        await Preferences.set({
          key: 'recommendationContext',
          value: contextString
        });
      }
    } catch (error) {
      console.error('Error saving recommendation context:', error);
    }
  }, []);

  // Save recommended tasks to local storage or preferences
  const memoizedSaveRecommendedTasks = useCallback(async (tasks) => {
    const tasksToStore = tasks.map(task => ({
      ...task,
      storedLocation: location,
      storedDate: selectedDate,
      storedTime: selectedTime,
      storedUseCurrentWeather: useCurrentWeather
    }));

    try {
      const tasksString = JSON.stringify(tasksToStore);
      if (typeof window !== "undefined") {
        localStorage.setItem('recommendedTasks', tasksString);
      } else {
        await Preferences.set({
          key: 'recommendedTasks',
          value: tasksString
        });
      }
    } catch (error) {
      console.error('Error saving recommended tasks:', error);
    }
  }, [location, selectedDate, selectedTime, useCurrentWeather]);

  // Fetch tasks data
   // Fetch tasks with offline support
   useEffect(() => {
    if (isTimeRestricted(selectedTime)) {
      setIsLoading(false);
      setRecommendedTasks([]);
      return;
    }

    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const isOnline = await checkOnlineStatus();
        setIsOffline(!isOnline);

        let tasks;
        if (isOnline) {
          console.log('📡 Device is online - fetching from API...');
          // Online: fetch from API and cache
          const response = await fetch(`${API_BASE_URL}/api/coconut_tasks`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          tasks = data.coconut_tasks;
          console.log(`✅ Successfully fetched ${tasks.length} tasks from API`);

          
          // Cache the fresh data
        } else {
          // Offline: get from preferences
          console.log('📱 Device is offline - retrieving from local storage...');

          tasks = await getOfflineTasks();
        }

        if (!Array.isArray(tasks)) {
          throw new Error('Invalid tasks data format');
        }

        setTasksData(tasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        
        // Final fallback: try to get cached data even if online fetch failed
        try {
          const cachedTasks = await getOfflineTasks();
          if (Array.isArray(cachedTasks) && cachedTasks.length > 0) {
            setTasksData(cachedTasks);
          }
        } catch (fallbackError) {
          console.error('Error fetching cached tasks:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [selectedTime, checkOnlineStatus, getOfflineTasks]);

  // Process weather data and update recommendations
  const processedWeather = useMemo(() => {
    const effectiveWeatherData = useCurrentWeather ? currentWeatherData : weatherData;
    return extractWeatherData(effectiveWeatherData);
  }, [useCurrentWeather, currentWeatherData, weatherData]);

  // Update the existing useEffect for processing weather data
  useEffect(() => {
    if (isTimeRestricted(selectedTime) || !processedWeather || !tasksData.length) return;

    const matchingTasks = getRecommendedTasks(
      {
        main: { 
          temp: processedWeather.temp, 
          humidity: processedWeather.humidity, 
          pressure: processedWeather.pressure 
        },
        wind: { 
          speed: processedWeather.windSpeed, 
          gust: processedWeather.windGust 
        },
        clouds: { all: processedWeather.clouds },
        weather: [{ id: processedWeather.weatherId }]
      }, 
      tasksData
    );
    
    setRecommendedTasks(matchingTasks);
    memoizedSaveRecommendedTasks(matchingTasks);
    
    const context = {
      location,
      selectedDate,
      selectedTime,
      useCurrentWeather,
      weatherData: useCurrentWeather ? currentWeatherData : weatherData,
      tasks: matchingTasks
    };
    
    saveRecommendationContext(context);
  }, [
    processedWeather,
    tasksData,
    memoizedSaveRecommendedTasks,
    saveRecommendationContext,
    location,
    selectedDate,
    selectedTime,
    useCurrentWeather,
    currentWeatherData,
    weatherData
  ]);

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const handleSeeMore = useCallback(async () => {
    try {
      // Get stored context
      let storedContext;
      if (typeof window !== "undefined") {
        const contextString = localStorage.getItem('recommendationContext');
        storedContext = contextString ? JSON.parse(contextString) : null;
      } else {
        const { value } = await Preferences.get({ key: 'recommendationContext' });
        storedContext = value ? JSON.parse(value) : null;
      }

      // Use stored context or current props
      const navigationData = storedContext || {
        location,
        selectedDate,
        selectedTime,
        useCurrentWeather,
        weatherData: useCurrentWeather ? currentWeatherData : weatherData
      };

      // Ensure we have the required data
      if (!navigationData.location) {
        throw new Error('Location data is missing');
      }

      // Store recommended tasks
      localStorage.setItem('currentRecommendationData', JSON.stringify({
        ...navigationData,
        recommendedTasks
      }));

      // Navigate with query parameters
      router.push({
        pathname: '/dashboard/dashboardcomp/AllRecommended/AllRecommendedTasksPage',
        query: {
          location: navigationData.location,
          selectedDate: navigationData.selectedDate,
          selectedTime: navigationData.selectedTime,
          useCurrentWeather: navigationData.useCurrentWeather,
          weatherData: JSON.stringify(navigationData.weatherData)
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      // You might want to show an error message to the user here
    }
  }, [router, location, selectedDate, selectedTime, useCurrentWeather, currentWeatherData, weatherData, recommendedTasks]);

  const colors = ['#f5f5f5', '#e0f7fa', '#fff9c4', '#ffe0b2', '#f1f8e9'];

  if (isLoading && recommendedTasks.length === 0) {
    return (
      <Grid item xs={12} textAlign="center">
        <CircularProgress sx={{ color: '#48ccb4' }} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading recommendations...
        </Typography>
      </Grid>
    );
  }

  return (
    <Grid item xs={12}>
      <Grid container justifyContent="space-between" alignItems="center" padding={1}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Recommended Tasks
        </Typography>
        {recommendedTasks.length > 0 && (
          <Typography
            variant="body1"
            onClick={handleSeeMore}
            sx={{
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            See all
          </Typography>
        )}
      </Grid>

      <Grid container spacing={1}>
        {recommendedTasks.length > 0 ? (
          recommendedTasks.slice(0, 3).map((task, index) => (
            <Grid item xs={12} sm={6} md={4} key={task.task_id}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 7,
                  height: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors[index % colors.length],
                  marginBottom: '4px',
                  cursor: 'pointer',
                }}
                onClick={() => handleTaskClick(task)}
              >
                <Typography variant="body1" sx={{ textAlign: 'center' }}>
                  {task.task_name || task.task}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    top: 8, 
                    right: 8, 
                    color: task.rank === 1 ? 'gold' : 
                           task.rank === 2 ? 'silver' : 
                           task.rank === 3 ? '#CD7F32' : 'text.secondary',
                    fontWeight: 'bold'
                  }}
                >
                  #{task.rank}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    bottom: 8, 
                    right: 8, 
                    color: 'rgba(0,0,0,0.6)' 
                  }}
                >
                  {Math.round(task.weatherMatchScore * 100)}% Match
                </Typography>
              </Paper>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper 
              elevation={3}
              sx={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.08)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 6px 8px rgba(0,0,0,0.15)'
                }
              }}
            >
              <Typography 
                variant="body1" 
                sx={{
                  fontStyle: 'italic',
                  fontWeight: 500,
                  color: '#666',
                  textAlign: 'center'
                }}
              >
                No recommended tasks for this location or time.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <TaskDetailsDialog
        open={!!selectedTask}
        task={selectedTask}
        location={location}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onClose={handleCloseModal}
      />
    </Grid>
  );
};

export default RecommendedTask;