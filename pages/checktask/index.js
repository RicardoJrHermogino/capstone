import React, { useState, useEffect, useCallback  } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import {
  Box,
  Typography,
  Button,
  FormControl,
  TextField,
  Grid,
  CircularProgress,
  Autocomplete,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { locationCoordinates } from '@/utils/locationCoordinates';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Preferences } from '@capacitor/preferences';
import TaskFeasibilityResultDialog from './TaskFeasibilityResultDialog'
import API_BASE_URL from '@/config/apiConfig';
import DateSelector from './DateSelector';
import TimeSelector from './TimeSelector';

// Custom Paper component for dropdown
const CustomPaper = (props) => (
  <Paper {...props} style={{ maxHeight: 260, overflowY: 'auto', borderRadius: '20px', backgroundColor: '#ecf0f1' }} />
);

const locations = Object.keys(locationCoordinates);
const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather?lat=12.9742&lon=124.0058&appid=588741f0d03717db251890c0ec9fd071&units=metric";


const CheckTaskFeasibilityPage = ({ open, handleClose }) => {
  const [tasks, setTasks] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [isFeasible, setIsFeasible] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastForecastDate, setLastForecastDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [lastForecastDateTime, setLastForecastDateTime] = useState(null);
  const [availableForecastTimes, setAvailableForecastTimes] = useState([]);
  const [hasInteractedWithTime, setHasInteractedWithTime] = useState(false);
  
  const [feasibilityResult, setFeasibilityResult] = useState({
    isFeasible: false,
    message: ''
  });

 // Check online status
 const checkOnlineStatus = useCallback(async () => {
  try {
    const coordinates = locationCoordinates[Object.keys(locationCoordinates)[0]];
    const url = `${OPENWEATHER_URL}?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${apiKey}&units=metric`;
    await axios.get(url);
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

   // Fetch tasks for the form
   useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const isOnline = await checkOnlineStatus();
        setIsOffline(!isOnline);

        let fetchedTasks;
        if (isOnline) {
          console.log('📡 Device is online - fetching tasks from API...');
          const response = await axios.get(`${API_BASE_URL}/api/coconut_tasks`);
          fetchedTasks = response.data.coconut_tasks;
        } else {
          console.log('📱 Device is offline - retrieving tasks from storage...');
          fetchedTasks = await getOfflineTasks();
        }

        if (!Array.isArray(fetchedTasks)) {
          throw new Error('Invalid tasks data format');
        }
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        const cachedTasks = await getOfflineTasks();
        if (Array.isArray(cachedTasks) && cachedTasks.length > 0) {
          setTasks(cachedTasks);
        } else {
          setError('Unable to load tasks. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [checkOnlineStatus, getOfflineTasks]);

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

 // Add this useEffect to reset time when date changes
 useEffect(() => {
  setSelectedTime(''); // Reset time whenever date changes
}, [selectedDate]);

// Update the getTimeOptions function to handle disabled states
const getTimeOptions = () => {
  const standardTimes = ['Now', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00'];
  const isToday = selectedDate === dayjs().format('YYYY-MM-DD');
  
  return standardTimes.map((time) => {
    const isLastForecastDate = selectedDate === lastForecastDate;
    
    // Check if the time is unavailable for the last forecast date
    const isUnavailableOnLastDate = isLastForecastDate && 
      time !== 'Now' && 
      !availableTimes.includes(time);

    // Check if it's a past time on today's date
    const isPastTime = isToday && 
      time !== 'Now' && 
      dayjs(`${selectedDate} ${time}`).isBefore(dayjs());

    // Disable "Now" if not today
    const isNowDisabled = time === 'Now' && !isToday;

    const isDisabled = isPastTime || isUnavailableOnLastDate || isNowDisabled;
    
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


const fetchWeatherData = async (selectedTime, selectedDate, selectedLocation) => {
  try {
    const isToday = selectedDate === dayjs().format('YYYY-MM-DD');
    const isCurrentTime = selectedTime === 'Now';
    const isOnline = await checkOnlineStatus();

    if (isToday && isCurrentTime && isOnline) {
      const coordinates = locationCoordinates[selectedLocation];
      const response = await axios.get(`${OPENWEATHER_URL}?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${apiKey}&units=metric`);
      return response.data;
    }

    let weatherData;
    if (isOnline) {
      console.log('📡 Device is online - fetching weather from API...');
      const response = await axios.get(
        `${API_BASE_URL}/api/getWeatherData?date=${selectedDate}&time=${selectedTime}&location=${selectedLocation}`
      );
      weatherData = response.data;
    } else {
      console.log('📱 Device is offline - retrieving weather from storage...');
      weatherData = await getOfflineWeather();
    }

    if (Array.isArray(weatherData)) {
      const formattedTime = selectedTime === 'Now' 
        ? dayjs().format('HH:00:00')
        : dayjs(selectedTime, 'HH:mm').format('HH:00:00');

      const weatherRecord = weatherData.find(record => {
        const recordDate = dayjs(record.date).format('YYYY-MM-DD');
        const recordTime = dayjs(record.time, 'HH:mm:ss').format('HH:00:00');
        return recordDate === selectedDate && recordTime === formattedTime && record.location === selectedLocation;
      });

      return weatherRecord;
    }

    return weatherData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
};


  // Normalize the weather data
  const normalizeWeatherData = (data, isApiData) => {
    if (!data) return null;
  
    try {
      let normalizedData;
      if (isApiData) {
        normalizedData = {
          temp: data.main.temp,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          windGust: data.wind.gust || 0,
          clouds: data.clouds.all,
          weatherId: data.weather[0]?.id
        };
      } else {
        normalizedData = {
          temp: parseFloat(data.temperature),
          humidity: parseFloat(data.humidity),
          pressure: parseFloat(data.pressure),
          windSpeed: parseFloat(data.wind_speed),
          windGust: parseFloat(data.wind_gust || 0),
          clouds: parseFloat(data.clouds),
          weatherId: parseInt(data.weather_id)
        };
      }

      return normalizedData;
    } catch (error) {
      console.error("Error normalizing weather data:", error);
      return null;
    }
  };

  // Evaluate feasibility based on weather data and task requirements
  const evaluateFeasibility = (forecast, task) => {
    if (!forecast || !task) return false;
  
    console.group('Task Requirements');
    console.log('Task Name:', task.task);
    console.log('Required Temperature Range:', task.requiredTemperature_min, '°C to', task.requiredTemperature_max, '°C');
    console.log('Required Humidity Range:', task.idealHumidity_min, '% to', task.idealHumidity_max, '%');
    console.log('Maximum Wind Speed:', task.requiredWindSpeed_max, 'm/s');
    console.log('Maximum Wind Gust:', task.requiredWindGust_max, 'm/s');
    console.log('Maximum Cloud Cover:', task.requiredCloudCover_max, '%');
    console.log('Required Pressure Range:', task.requiredPressure_min, 'hPa to', task.requiredPressure_max, 'hPa');
    console.log('Restricted Weather IDs:', JSON.parse(task.weatherRestrictions || "[]"));
  
    const { temp, humidity, pressure, windSpeed, windGust, clouds, weatherId } = forecast;
    const weatherRestrictions = JSON.parse(task.weatherRestrictions || "[]");
  
    const conditions = {
      tempConditionMatches:
        temp !== null && temp >= task.requiredTemperature_min && temp <= task.requiredTemperature_max,
      humidityConditionMatches:
        humidity !== null && humidity >= task.idealHumidity_min && humidity <= task.idealHumidity_max,
      weatherConditionMatches:
        weatherRestrictions.length === 0 || (weatherId !== null && weatherRestrictions.includes(weatherId)),
      windSpeedMatches: windSpeed !== null && windSpeed <= task.requiredWindSpeed_max,
      windGustMatches: windGust <= task.requiredWindGust_max,
      cloudCoverMatches: clouds !== null && clouds <= task.requiredCloudCover_max,
      pressureMatches:
        pressure !== null && pressure >= task.requiredPressure_min && pressure <= task.requiredPressure_max,
    };
  
    return Object.values(conditions).every(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
  
    if (dayjs(selectedDate).isAfter(dayjs(), 'day') && selectedTime === 'Now') {
      toast.error("You cannot select 'Now' for a future date. Please choose a specific time.");
      return;
    }
  
    if (!selectedTask || !selectedLocation || !selectedTime) {
      toast.error("Please fill all fields before submitting.");
      return;
    }
  
    const isApiData = selectedDate === dayjs().format('YYYY-MM-DD') && selectedTime === 'Now';
  
    try {
      const forecast = await fetchWeatherData(selectedTime, selectedDate, selectedLocation);
      if (!forecast) {
        toast.error("No weather data available for the exact selected date and time.");
        setResultMessage("Weather data is not available for the selected date and time. Please choose a different date or time.");
        setIsFeasible(false);
        setResultOpen(true);
        return;
      }
  
      const normalizedForecast = normalizeWeatherData(forecast, isApiData);
      if (!normalizedForecast) {
        toast.error("Unable to process weather data for the selected date and time.");
        setResultMessage("Unable to process weather data. Please try again.");
        setIsFeasible(false);
        setResultOpen(true);
        return;
      }
  
      const task = tasks.find((t) => t.task_name === selectedTask);
      if (!task) {
        toast.error("Selected task does not have valid weather requirements.");
        setResultMessage("Selected task does not have valid weather requirements.");
        setIsFeasible(false);
        setResultOpen(true);
        return;
      }

      console.log("Selected Task Data:", task);  // Log the selected task data

      const isFeasible = evaluateFeasibility(normalizedForecast, task);
      setIsFeasible(isFeasible);
      setResultMessage(
        isFeasible
          ? "The selected task is recommended based on the forecasted weather conditions!"
          : "The selected task is not recommended based on the forecasted weather conditions."
      );
      setResultOpen(true);
  
    } catch (error) {
      console.error("Error:", error);
      toast.error("Could not fetch weather data for the selected date and time.");
      setResultMessage("Weather data is not available for the selected date and time. Please choose a different date or time.");
      setIsFeasible(false);
      setResultOpen(true);
    }
};
  
 
  

    return (
      <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={handleClose} 
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
      fontSize: '24px', // Increase font size for the title
      fontWeight: 'bold', // Make it bold for more prominence
      borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
      color: '#333', // Darker text color for better contrast
      mb:'20px'
    }}>
      Check Task Suitability for Weather
        <CloseIcon 
          onClick={handleClose} 
          sx={{
            position: 'absolute', // Position absolute to top-right
            top: '20px',
            right: '20px',
            cursor: 'pointer',
          }} 
        />
    </DialogTitle>

    <DialogContent sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      p: 3,
      flex: 1,
      overflow: 'auto',
    }}>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error.message}</Typography>
      ) : (
        <Box 
          component="form" 
          sx={{ 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            mt:'5px'  
          }}
        >
        <Grid container spacing={4} sx={{ mb: 'auto' }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <Autocomplete
                options={tasks.map((task) => task.task_name)}
                renderInput={(params) => 
                  <TextField {...params} label="Select Task" size="medium" />
                }
                value={selectedTask}
                onChange={(_, newValue) => setSelectedTask(newValue)}
              />
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <Autocomplete
                options={Object.keys(locationCoordinates)}
                renderInput={(params) => 
                  <TextField {...params} label="Select Location" size="medium" />
                }
                value={selectedLocation}
                onChange={(_, newValue) => setSelectedLocation(newValue)}
              />
            </FormControl>
          </Grid>

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


          <Box sx={{ mt: 'auto', pt: 3, }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              sx={{
                backgroundColor: '#48ccb4',  
                color: 'white',
                borderRadius: '9999px',
                py: 1.9, // Increased padding for a fatter button
                mb: 1,
                textTransform: 'none',
                fontSize: '15px', // Optional: increase font size for a bolder look

              }}
            >
              Check
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleClose}
              sx={{
                bgcolor: 'rgb(243, 244, 246)',
                color: 'black',
                borderRadius: '9999px',
                py: 1.9, // Increased padding for a fatter button
                textTransform: 'none',
                fontSize: '15px', // Optional: increase font size for a bolder look
                '&:hover': {
                  bgcolor: 'rgb(229, 231, 235)',
                },
                boxShadow: 'none',
              }}
            >
              Cancel
            </Button>
          </Box>

        </Box>
      )}

  {/* Result Dialog */}
  <TaskFeasibilityResultDialog
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        isFeasible={isFeasible}
        selectedTask={selectedTask}
        selectedLocation={selectedLocation}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        resultMessage={resultMessage}
      />
    </DialogContent>
  </Dialog>
  </LocalizationProvider>
  </>
  

    );
  };

  export default CheckTaskFeasibilityPage;