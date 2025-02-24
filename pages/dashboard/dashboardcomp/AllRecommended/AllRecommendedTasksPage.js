import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Alert,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
  useTheme,
  useMediaQuery,
  Grid,
  IconButton
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useRouter } from 'next/router';
import { Preferences } from '@capacitor/preferences';
import axios from 'axios';
import { locationCoordinates } from '@/utils/locationCoordinates';
import TaskModal from './TaskDialog';
import { TaskLoadingPlaceholder } from './TaskLoadingPlaceholder';
import { IntervalWeatherSummary } from './IntervalWeatherSummary';
import API_BASE_URL from '@/config/apiConfig';

const OPENWEATHER_URL = "https://httpbin.org/get";


// Create a basic theme instance with just the colors we need
const defaultTheme = createTheme({
  palette: {
    primary: {
      main: '#007AFF',
    }
  }
});

// Helper functions moved outside component
const transformDatabaseWeather = (dbWeather) => {
  return {
    weather: [
      {
        id: dbWeather.weather_id,
        main: "",
        description: "",
        icon: ""
      }
    ],
    main: {
      temp: dbWeather.temperature,
      pressure: dbWeather.pressure,
      humidity: dbWeather.humidity
    },
    wind: {
      speed: dbWeather.wind_speed,
      gust: dbWeather.wind_gust
    },
    clouds: {
      all: dbWeather.clouds
    },
    dt_txt: `${dbWeather.date} ${dbWeather.time}`
  };
};

const validateWeatherData = (data) => {
  if (!data) return null;

  if ('temperature' in data) {
    return transformDatabaseWeather(data);
  }

  const requiredProps = ['main', 'wind', 'clouds', 'weather'];
  if (!requiredProps.every(prop => data[prop])) {
    console.error('Missing required weather properties');
    return null;
  }

  if (!Array.isArray(data.weather) || data.weather.length === 0) {
    console.error('Invalid weather array');
    return null;
  }

  return data;
};

const validateLocation = (location) => {
  if (!location) {
    throw new Error('Location is required');
  }
  const parsedLocation = location.replace(/"/g, '').trim();
  const coordinates = locationCoordinates[parsedLocation];
  if (!coordinates) {
    throw new Error(`Invalid location: ${parsedLocation}`);
  }
  return { parsedLocation, coordinates };
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const isTimeInFuture = (dateTimeStr) => {
  const now = new Date();
  const dateTime = new Date(dateTimeStr);
  return dateTime > now;
};

const isSameDate = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};


const AllRecommendedTasksPage = () => {
  const router = useRouter();
  const { location, selectedDate, useCurrentWeather, weatherData, selectedTime } = router.query;
  const [fetchedTasks, setFetchedTasks] = useState([]);
  const [recommendedTasksByInterval, setRecommendedTasksByInterval] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


   // Check online status
   const checkOnlineStatus = useCallback(async () => {
    try {
      await axios.get(OPENWEATHER_URL);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

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

  const getRecommendedTasks = useCallback((weatherData, tasks) => {
    try {
      const validatedData = validateWeatherData(weatherData);
      if (!validatedData) return [];
  
      const { main, wind, clouds, weather } = validatedData;
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
  }, []);

  // Fetch tasks effect
  // Fetch tasks effect with offline support
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
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
          console.log(`✅ Successfully fetched ${tasks.length} tasks from API`);

          // Cache the fresh data
        } else {
          console.log('📱 Device is offline - retrieving tasks from storage...');
          tasks = await getOfflineTasks();
        }

        if (!Array.isArray(tasks)) {
          throw new Error('Invalid tasks data format');
        }
        setFetchedTasks(tasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        
        // Try to get cached tasks as fallback
        try {
          const cachedTasks = await getOfflineTasks();
          if (Array.isArray(cachedTasks) && cachedTasks.length > 0) {
            setFetchedTasks(cachedTasks);
          }
        } catch (fallbackError) {
          setError('Unable to load tasks. Please check your connection.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [checkOnlineStatus, getOfflineTasks]);

  // Weather and recommendations effect
  useEffect(() => {
    const fetchWeatherAndGenerateRecommendations = async () => {
      if (!fetchedTasks.length) return;

      setIsLoading(true);
      setError(null);

      try {
        const { parsedLocation } = validateLocation(location);
        const now = new Date();

        if (useCurrentWeather === 'true' && weatherData) {
          const parsedWeatherData = JSON.parse(weatherData);
          const validatedCurrentWeather = validateWeatherData(parsedWeatherData);

          if (validatedCurrentWeather) {
            const recommendedTasks = getRecommendedTasks(validatedCurrentWeather, fetchedTasks);
            const displayTime = selectedTime 
              ? formatTime(new Date(`2000-01-01T${selectedTime}`)) 
              : formatTime(now);

            const newInterval = [{
              time: displayTime,
              tasks: recommendedTasks,
              weather: validatedCurrentWeather
            }];

            setRecommendedTasksByInterval(newInterval);
            localStorage.setItem('lastRecommendedTasks', JSON.stringify(newInterval));
          }
        } else if (selectedDate) {
          let weatherData;
          const isOnline = await checkOnlineStatus();

          if (isOnline) {
            console.log('📡 Device is online - fetching weather from API...');
            const response = await fetch(
              `${API_BASE_URL}/api/getWeatherData?location=${encodeURIComponent(parsedLocation)}&date=${selectedDate}`
            );
            if (!response.ok) throw new Error(`Database fetch error: ${response.status}`);
            weatherData = await response.json();
            
          } else {
            console.log('📱 Device is offline - retrieving weather from storage...');
            weatherData = await getOfflineWeather();
          }

          const normalizedSelectedDate = new Date(selectedDate).toISOString().split('T')[0];
          const selectedDateObj = new Date(selectedDate);
          const targetHours = [3, 6, 9, 12, 15, 18];
          const hourlyForecasts = new Map();

          // Filter target hours based on current time if it's today
          const isToday = isSameDate(selectedDateObj, now);
          const filteredTargetHours = isToday 
            ? targetHours.filter(hour => {
                const forecastTime = new Date(selectedDateObj);
                forecastTime.setHours(hour, 0, 0, 0);
                return forecastTime > now;
              })
            : targetHours;

            weatherData.forEach(item => {
            const itemDate = new Date(item.date).toISOString().split('T')[0];
            if (itemDate === normalizedSelectedDate && 
                item.location.toLowerCase() === parsedLocation.toLowerCase()) {
              
              const forecastTime = new Date(`${item.date} ${item.time}`);
              
              // Skip if this forecast is in the past for today
              if (isToday && forecastTime <= now) {
                return;
              }

              const hour = forecastTime.getHours();
              const closestTargetHour = filteredTargetHours.reduce((closest, target) => {
                return Math.abs(hour - target) < Math.abs(hour - closest) ? target : closest;
              }, filteredTargetHours[0]);

              if (!closestTargetHour) return; // Skip if no valid target hour found

              const key = `${normalizedSelectedDate}-${closestTargetHour}`;
              const validatedData = validateWeatherData(item);
              
              if (validatedData && (!hourlyForecasts.has(key) || 
                  Math.abs(hour - closestTargetHour) < 
                  Math.abs(new Date(hourlyForecasts.get(key).dt_txt).getHours() - closestTargetHour))) {
                hourlyForecasts.set(key, validatedData);
              }
            }
          });

          const recommendations = Array.from(hourlyForecasts.values())
            .sort((a, b) => new Date(a.dt_txt) - new Date(b.dt_txt))
            .map(weatherData => ({
              time: formatTime(new Date(weatherData.dt_txt)),
              tasks: getRecommendedTasks(weatherData, fetchedTasks),
              weather: weatherData
            }))
            .filter(interval => interval.tasks.length > 0);

          setRecommendedTasksByInterval(recommendations);
          localStorage.setItem('lastRecommendedTasks', JSON.stringify(recommendations));
        }
      } catch (error) {
        setError(error.message);
        console.error("Error in fetchWeatherAndGenerateRecommendations:", error);
        const cachedTasks = localStorage.getItem('lastRecommendedTasks');
        if (cachedTasks) {
          setRecommendedTasksByInterval(JSON.parse(cachedTasks));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherAndGenerateRecommendations();
  }, [fetchedTasks, location, selectedDate, useCurrentWeather, weatherData, getRecommendedTasks, selectedTime, checkOnlineStatus, getOfflineWeather]);

  const handleTabChange = (event, newValue) => {
    setSelectedTabIndex(newValue);
  };

  const handleGoBack = () => {
    router.back();
  };

   // Add these handlers before the return statement
   const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };


  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return <TaskLoadingPlaceholder />;
  }

  return (
    <ThemeProvider theme={defaultTheme}>
    <Container maxWidth="md" sx={{ mt: 4, minHeight: '100vh', pb: 4, position: 'relative' }}>
      <IconButton 
        onClick={handleGoBack}
        sx={{
          position: 'absolute',
          left: isSmallScreen ? -10 : 0,
          top: -40,
          color: '#007AFF'
        }}
      >
        <ArrowBackIosIcon />
      </IconButton>

      <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, textAlign: 'start', fontWeight: 'bold', pl: 4 }}>
        Recommended Tasks
      </Typography>
      
      <Typography>
        Recommended Tasks for {location?.replace(/"/g, '').trim() || 'Unknown Location'}
        {selectedDate && ` on ${selectedDate}`}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {recommendedTasksByInterval.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2, backgroundColor: '#E5E5EA', color: '#8E8E93' }}>
          No tasks recommended for the selected date and weather conditions.
        </Alert>
      ) : (
        <>
          <Grid container spacing={1} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Tabs
                value={selectedTabIndex}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'primary.main',
                    height: 3
                  },
                  '& .MuiTabs-flexContainer': {
                    justifyContent: 'center',
                    display: 'flex',
                    flexWrap: 'wrap'
                  },
                  '& .MuiTab-root': {
                    width: 'calc(100% / 3)',
                    maxWidth: 'none',
                    textTransform: 'none',
                    fontWeight: 500,
                    color: '#8E8E93',
                    '&.Mui-selected': { 
                      color: '#007AFF',
                      fontWeight: 600 
                    }
                  }
                }}
              >
                {recommendedTasksByInterval.map((interval, index) => (
                  <Tab key={index} label={interval.time} />
                ))}
              </Tabs>
            </Grid>
          </Grid>

          <Card sx={{ borderRadius: 3, boxShadow: '0 10px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <CardContent sx={{ p: isSmallScreen ? 2 : 3 }}>
              <IntervalWeatherSummary 
                interval={recommendedTasksByInterval[selectedTabIndex]} 
                onTaskClick={handleTaskClick}
              />
            </CardContent>
          </Card>
        </>
      )}

      <TaskModal 
        task={selectedTask}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </Container>
  </ThemeProvider>
  );
};

export default AllRecommendedTasksPage;

