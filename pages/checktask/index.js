import React, { useState, useEffect } from 'react';
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
  Stack
} from '@mui/material';
import dayjs from 'dayjs';
import { locationCoordinates } from '@/utils/locationCoordinates';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Preferences } from '@capacitor/preferences';
import TaskFeasibilityResultDialog from './TaskFeasibilityResultDialog'
import API_BASE_URL from '@/config/apiConfig';

// Custom Paper component for dropdown
const CustomPaper = (props) => (
  <Paper {...props} style={{ maxHeight: 260, overflowY: 'auto', borderRadius: '20px', backgroundColor: '#ecf0f1' }} />
);

const locations = Object.keys(locationCoordinates);
const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

const CheckTaskFeasibilityPage = ({ open, handleClose }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [isFeasible, setIsFeasible] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [lastForecastDate, setLastForecastDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [lastForecastDateTime, setLastForecastDateTime] = useState(null);
  const [feasibilityResult, setFeasibilityResult] = useState({
    isFeasible: false,
    message: ''
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineDialogOpen, setOfflineDialogOpen] = useState(!navigator.onLine);

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

  useEffect(() => {
    fetchAvailableTimes();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineDialogOpen(false);
      // Attempt to reload tasks when back online
      fetchTasks();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineDialogOpen(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);



   // Fetch tasks for the form
   const fetchTasks = async () => {
    if (!navigator.onLine) {
      setLoading(false);
      setOfflineDialogOpen(true);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/coconut_tasks`);
      setTasks(response.data.coconut_tasks || []);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load tasks");
      setLoading(false);
      setError(error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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
    if (isOnline) {
      fetchAvailableTimes();
    }
  }, [isOnline]);

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
      
      // Get coordinates for selected location
      const coordinates = locationCoordinates[selectedLocation];
      if (!coordinates) {
        console.error("Invalid location selected:", selectedLocation);
        throw new Error("Invalid location selected");
      }
  
      const url = !isToday || !isCurrentTime
        ? `${API_BASE_URL}/api/getWeatherData?date=${selectedDate}&time=${selectedTime}&location=${selectedLocation}`
        : `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${apiKey}&units=metric`;
    
      const response = await axios.get(url);
    
      console.log("Weather Data Response:", response.data);  // Log the entire weather data response
    
      if (!Array.isArray(response.data)) {
        return response.data;
      }
    
      const formattedTime = selectedTime === 'Now' 
        ? dayjs().format('HH:00:00')
        : dayjs(selectedTime, 'HH:mm').format('HH:00:00');
    
      const weatherRecord = response.data.find(record => {
        const recordDate = dayjs(record.date).format('YYYY-MM-DD');
        const recordTime = dayjs(record.time, 'HH:mm:ss').format('HH:00:00');
        
        return recordDate === selectedDate && recordTime === formattedTime && record.location === selectedLocation;
      });
    
      if (!weatherRecord) {
        toast.error("No weather data available for the exact selected date and time.");
        setResultMessage("Weather data is not available for the selected date and time. Please choose a different date or time.");
        setIsFeasible(false);
        setResultOpen(true);
        return;
      }

      console.log("Selected Weather Record:", weatherRecord);  // Log the selected weather record

      return weatherRecord;
    } catch (error) {
      console.error("Error fetching weather data:", error);
      toast.error("Failed to fetch weather data. Please try again later.");
      setResultMessage("Failed to fetch weather data. Please try again later.");
      setIsFeasible(false);
      setResultOpen(true);
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
  
  const renderOfflineDialog = () => (
    <Dialog 
      open={offlineDialogOpen} 
      onClose={() => setOfflineDialogOpen(false)} 
      fullWidth 
      maxWidth="sm"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
          <SignalWifiOffIcon sx={{ fontSize: 100, color: '#e0e0e0', mb: 2 }} />
          <Typography variant="h5" align="center">No Internet Connection</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" align="center" color="textSecondary">
          Please check your network connection and try again. 
          Some features may be limited without an internet connection.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          fullWidth 
          variant="contained" 
          onClick={() => {
            if (navigator.onLine) {
              setOfflineDialogOpen(false);
              fetchTasks();
            } else {
              toast.error("Still offline. Please check your connection.");
            }
          }}
          sx={{
            borderRadius: '9999px',
            m: 2,
            py: 1.5,
          }}
        >
          Retry Connection
        </Button>
      </DialogActions>
    </Dialog>
  );
  

    return (
      <>
      <Dialog 
        open={open && isOnline} 
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

            {/* Separate Date and Time into their own rows */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Date</InputLabel>
                <Select
                  value={selectedDate}
                  label="Date"
                  onChange={(e) => setSelectedDate(e.target.value)}
                  size="medium"
                >
                  {Array.from({ length: 6 }, (_, index) => {
                    const date = dayjs().add(index, 'day');
                    const isAfterLastForecast = date.isAfter(dayjs(lastForecastDateTime));
                    if (isAfterLastForecast) return null;
                    
                    return (
                      <MenuItem 
                        key={date.format('YYYY-MM-DD')} 
                        value={date.format('YYYY-MM-DD')}
                      >
                        {date.format('dddd, MMMM D, YYYY')}
                      </MenuItem>
                    );
                  }).filter(Boolean)}
                </Select>
              </FormControl>
          </Grid>

            {/* Update the time options generation */}
            <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Time</InputLabel>
              <Select
                value={selectedTime}
                label="Time"
                onChange={(e) => setSelectedTime(e.target.value)}
                size="medium"
              >
                {getTimeOptions()}
              </Select>
            </FormControl>
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
  {renderOfflineDialog()}
  </>
  

    );
  };

  export default CheckTaskFeasibilityPage;