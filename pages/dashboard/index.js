import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Grid, Button, CircularProgress, Typography, CssBaseline, IconButton, Badge, Drawer, Divider } from "@mui/material";
import Image from 'next/image';
// import NotificationsIcon from '@mui/icons-material/Notifications';
import dayjs from "dayjs";
import Navbar from "../components/navbar";
import axios from 'axios';
import WeatherDisplay from './dashboardcomp/WeatherDisplay/weatherdisplay';
import LocationSelect from './dashboardcomp/InputFields/LocationSelect';
import DatePicker from './dashboardcomp/InputFields/DatePicker';
import CustomTimePicker from './dashboardcomp/InputFields/TimePicker';
import RecommendedTask from './dashboardcomp/RecommendedTask/RecommendedTask';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { locationCoordinates } from "../../utils/locationCoordinates";
import toast, { Toaster } from 'react-hot-toast';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close'; 
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

import { useLocation } from '@/utils/LocationContext'; // Import the custom hook
import SkeletonLoader from './dashboardcomp/SkeletonLoader';
import API_BASE_URL from '@/config/apiConfig';

import { initStorage } from '@/utils/offlineData';
import { Preferences } from '@capacitor/preferences'; // Add this import
// import { getDatabaseConnection } from '@/utils/sqliteService';  // Import the getDatabaseConnection function
import { Capacitor } from '@capacitor/core';





const Dashboard = () => {
  const [greetingMessage, setGreetingMessage] = useState("");
  const [temperature, setTemperature] = useState(null);
  const [location, setLocation] = useState(""); 
  const { setLocation: setGlobalLocation } = useLocation(); // Access the global setLocation function
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  const [submittedLocation, setSubmittedLocation] = useState("");
  const [submittedDate, setSubmittedDate] = useState("");
  const [submittedTime, setSubmittedTime] = useState("");

  const [currentWeatherData, setCurrentWeatherData] = useState(null);
  const [isCurrentWeather, setIsCurrentWeather] = useState(true); 
  const [drawerOpen, setDrawerOpen] = useState(false); 
  const [notifications, setNotifications] = useState([]); 
  const [weatherId, setWeatherId] = useState(null);
  const [availableForecastTimes, setAvailableForecastTimes] = useState([]);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [hasInteractedWithTime, setHasInteractedWithTime] = useState(false);
  const [lastToastTime, setLastToastTime] = useState(0);
  const TOAST_COOLDOWN = 5000; // 2 seconds cooldown between toasts
  const router = useRouter();

  const [isOnline, setIsOnline] = useState(true);


  // Add initial network check
  useEffect(() => {
    const checkConnection = async () => {
      console.log('Checking connection...');
      try {
        const response = await axios.get('https://httpbin.org/get');
        console.log('Response received:', response.status);
        setIsOnline(true);
      } catch (error) {
        console.log('Network error, device is offline');
        setIsOnline(false);
      }
    };
  
    const intervalId = setInterval(checkConnection, 1000);
  
    return () => clearInterval(intervalId);
  }, []);
   // Empty dependency array ensures this effect runs only once at component mount

 

  const handleDownloadData = async () => {
    try {
      // Add a new state for download loading
      setLoading(true);
      console.log('Starting download process');
      const db = await initStorage();
      
      if (db) {
        console.log('Database initialized successfully');
        await Preferences.set({
          key: 'offlineDataDownloaded',
          value: 'true'
        });
        
        toast.success('Data downloaded for offline use!', {
          duration: 4000,
          style: {
            borderRadius: "30px",
            fontSize: "16px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          },
        });
      } else {
        console.error('Database initialization returned null');
        toast.error('Failed to initialize database', {
          duration: 4000,
          style: {
            borderRadius: "30px",
            fontSize: "16px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          },
        });
      }
    } catch (error) {
      console.error('Full download error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      toast.error(`Error downloading data: ${error.message}`, {
        duration: 4000,
        style: {
          borderRadius: "30px",
          fontSize: "16px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
      });
    } finally {
      // Ensure loading is set to false regardless of success or failure
      setLoading(false);
    }
  };


  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY; 

  const showSuccessToast = (message) => {
    const currentTime = Date.now();
    if (currentTime - lastToastTime > TOAST_COOLDOWN) {
    toast.success(message, {
      duration: 4000,
      style: {
        borderRadius: "30px",
        fontSize: "16px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      },
    });
    
    // Update the last toast time
    setLastToastTime(currentTime);
  }
};

   const showErrorToast = useCallback((message) => {
    const currentTime = Date.now();
    if (currentTime - lastToastTime > TOAST_COOLDOWN) {
      toast.error(message, {
        duration: 4000,
        style: {
          borderRadius: "30px",
          fontSize: "16px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        },
      });
      setLastToastTime(currentTime);
    }
  }, [lastToastTime]); // Add lastToastTime as dependency





  // Fetch current weather data based on the user's location
  const fetchCurrentWeatherData = async (lat, lon) => {

    setLoading(true);
    setIsCurrentWeather(true); // Set to current weather
    setSelectedTime(dayjs().format('HH:mm')); // Add current time when fetching current weather
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const currentWeatherResponse = await axios.get(apiUrl);
      const currentWeather = currentWeatherResponse.data;
      
      setWeatherId(currentWeather.weather[0].id); 
      setCurrentWeatherData(currentWeather);
      setTemperature(Math.round(currentWeather.main.temp));
      showSuccessToast("Current Weather Displayed.");
    } catch (error) {
        showErrorToast("Failed to fetch current weather data. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };



// Fetch weather data for the selected date, time, and location
const fetchWeatherData = async (lat, lon) => {
  setLoading(true);
  setIsCurrentWeather(false);

  try {
    // First try to fetch online data
    const response = await axios.get(
      'https://httpbin.org/get'
    );

    // If online, proceed with normal API fetch
    const apiResponse = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
    const forecastData = apiResponse.data;

    const lastDate = forecastData[forecastData.length - 1].date;
    const timesForLastDate = forecastData
      .filter(item => item.date === lastDate)
      .map(item => item.time);

    setAvailableForecastTimes(timesForLastDate);
    processWeatherData(forecastData);

  } catch (error) {
    console.log('Network error, falling back to offline data');
    try {
      // Get offline data from Preferences
      const { value } = await Preferences.get({ key: 'forecast_data' });
      if (value) {
        const offlineForecastData = JSON.parse(value);
        
        const lastOfflineDate = offlineForecastData[offlineForecastData.length - 1].date;
        const offlineTimesForLastDate = offlineForecastData
          .filter(item => item.date === lastOfflineDate)
          .map(item => item.time);

        setAvailableForecastTimes(offlineTimesForLastDate);
        processWeatherData(offlineForecastData);
        
        // Show offline mode toast
        showSuccessToast("Using offline weather data");
      } else {
        showErrorToast("No offline data available. Please download data when online.");
      }
    } catch (offlineError) {
      console.error('Error accessing offline data:', offlineError);
      showErrorToast("Failed to access offline weather data");
    }
  } finally {
    setLoading(false);
  }
};


// Helper function to process weather data (shared between online and offline modes)
const processWeatherData = (forecastData) => {
  console.log('Processing Forecast Data:', forecastData);
  console.log('Selected Location:', location);
  console.log('Selected Date:', selectedDate);
  console.log('Selected Time:', selectedTime);

  const selectedDateTime = dayjs(`${selectedDate} ${selectedTime}`);
  console.log('Selected DateTime:', selectedDateTime.format());

  const matchedForecast = forecastData.find(item => {
    const itemDateTime = dayjs(`${item.date} ${item.time}`);
    return itemDateTime.isSame(selectedDateTime, 'hour') && item.location === location;
  });

  console.log('Matched Forecast:', matchedForecast);

  if (matchedForecast) {
    // Process pop and rain_3h
    const pop = matchedForecast.pop !== undefined
      ? parseFloat(matchedForecast.pop)
      : null;
    const rain3h = matchedForecast.rain_3h !== undefined
      ? parseFloat(matchedForecast.rain_3h)
      : 0;

    setWeatherId(matchedForecast.weather_id);
    setWeatherData({
      ...matchedForecast,
      pop,
      rain3h,
      temperature: matchedForecast.temperature,
      weather_id: matchedForecast.weather_id
    });
    setTemperature(Math.round(matchedForecast.temperature));
    showSuccessToast("Weather forecast displayed");
  } else {
    showErrorToast("No weather data available for the selected time and location");
  }
};


  useEffect(() => {
    const currentGreeting = greeting(new Date());
    setGreetingMessage(currentGreeting);
  }, []); 

  // Greeting function based on the time of day
  const greeting = (date) => {
    const hour = date.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Handle the submit action for weather data (date, time, location)
  const handleSubmit = () => {
    // Ensure all required fields are filled and the user has interacted with the time picker
    if (!location || !selectedDate || !selectedTime || !hasInteractedWithTime) {
      showErrorToast("Please complete all inputs.");
      return;
    }
  
    setGlobalLocation(location);
    setSubmittedLocation(location);
    setSubmittedDate(selectedDate);
    setSubmittedTime(selectedTime);
  
    // Get coordinates for the selected location
    const { lat, lon } = locationCoordinates[location];
  
    // Fetch the forecast weather data based on the selected location, date, and time
    fetchWeatherData(lat, lon);
    setDrawerOpen(false); // Close the drawer after submission
  };
  


  const handleFetchCurrentWeather = () => {
    if (!location) {
      showErrorToast("Please select a location.");
      return;
    }
  
    // Reset date and time fields
    setSelectedDate(null);
    setSelectedTime(null);
    setHasInteractedWithTime(false);
  
    setGlobalLocation(location);
    setSubmittedLocation(location);
    setSubmittedDate(dayjs().format('YYYY-MM-DD'));
  
    // Automatically set the time to the current hour (e.g., 10:00, not 10:20)
    setSubmittedTime(dayjs().startOf('hour').format('HH:mm'));
  
    const { lat, lon } = locationCoordinates[location];
    fetchCurrentWeatherData(lat, lon);
  
    setDrawerOpen(false);
  };
  
  

  // Notifications for demonstration
  useEffect(() => {
    const exampleNotifications = [
      "Weather data updated!",
      "New tasks recommended based on current weather.",
      "Don't forget to check the forecast for tomorrow!"
    ];
    setNotifications(exampleNotifications);
  }, []);


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
  // }, [showErrorToast]); // Add showErrorToast as dependency
  
  
  const handleTestOfflineClick = () => {
    router.push('dashboard/dashboardcomp/testofflinedata');
  };
  

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <CssBaseline />
      <Navbar />
      <Grid container mb={15} spacing={3} style={{ padding: "20px" }}>
        {/* Header with Logo */}
        <Grid item xs={8} sm={6}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Image 
              src="/image/twslogo.png" 
              alt="TaskWeatherSync Logo" 
              style={{ marginRight: '10px' }} 
              width={55} height={55}
            />
            <Typography variant="body1"><strong>TaskWeatherSync</strong></Typography>
           
          </div>
        </Grid>
         <Grid item xs={4} sm={6} sx={{ textAlign: 'right' }}>
          <IconButton 
            sx={{ border: '1px solid lightgray', borderRadius: '20px', width: '56px', height: '56px', backgroundColor: 'white' }}
            onClick={ handleDownloadData}
          >
            <Badge badgeContent={0} color="error">
              <CloudDownloadIcon sx={{ fontSize: '25px', color: '#48ccb4' }} />
            </Badge>
          </IconButton>
        </Grid>

          <button onClick={handleTestOfflineClick}>
        Go to Test Offline Data
      </button> 


        {/* Button to Open Drawer */}
        <Grid item xs={12}>
          <Button 
            variant="outlined" 
            onClick={() => setDrawerOpen(true)} 
            sx={{
              color: 'black',
              backgroundColor: '#ecf0f1',
              borderRadius: '24px',
              width: '100%',
              height: '55px',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              padding: '0 16px',
              border: 'none',
            }}
          >
            <LocationOnIcon sx={{ marginRight: 2, marginLeft: 1 }} />
            <Typography variant="body1" sx={{ textTransform: 'none' }}>
              {submittedLocation || location || "Select Location, Date, Time"}
            </Typography>
          </Button>
        </Grid>
  

        {/* Greeting Message */}
        <Grid item xs={12}>
        <Typography variant="body2" color="#757575">
          {greetingMessage}, <strong>Coconut Farmer&apos;s! sanaol</strong>
        </Typography>

          <Typography letterSpacing={4}></Typography>
        </Grid>

        
        {/* Weather Display and Recommended Task Components */}
          {loading ? (
            <Grid item xs={12}>
              <SkeletonLoader />
            </Grid>
          ) : (
            <>
              <Grid item xs={12}>
                <WeatherDisplay 
                  temperature={temperature} 
                  weatherCondition={weatherId} 
                  location={submittedLocation}
                  selectedLocation={submittedLocation}
                  selectedDate={submittedDate}
                  selectedTime={submittedTime}
                  weatherData={weatherData}
                />
              </Grid>
              <Grid item xs={12}>
                <RecommendedTask 
                  weatherData={weatherData} 
                  currentWeatherData={currentWeatherData} 
                  useCurrentWeather={isCurrentWeather}
                  location={submittedLocation}
                  selectedDate={submittedDate}
                  selectedTime={submittedTime}
                />
              </Grid>
            </>
          )}
      </Grid>

      {/* Drawer Component for Location, Date, Time */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            padding: '24px',
            width: '100%',
            backgroundColor: '#f9f9f9',
            maxHeight: '80vh',
            height: '80vh',
            overflowY: 'auto',
            boxShadow: '0 -1px 10px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Set Your Location
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </div>

        {/* Instruction Text */}
        <Typography variant="body2" sx={{ marginBottom: '20px', color: '#666' }}>
          Please choose your location to get the current weather. For a detailed forecast, select a future date and time after picking your location.
        </Typography>

        {/* Location Section */}
        <Divider sx={{ marginBottom: '16px' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', marginBottom: '8px' }}>
          Location
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <LocationSelect 
              locationCoordinates={locationCoordinates} 
              setLocation={setLocation}
              initialLocation={location} 
            />
          </Grid>
          <Grid item xs={12}>
          <Button 
              variant="contained" 
              onClick={handleFetchCurrentWeather}
              disabled={!isOnline}
              sx={{ 
                backgroundColor: !isOnline ? '#cccccc' : '#48ccb4', 
                borderRadius: '24px',
                width: '100%', 
                height: '55px', 
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: '0px 3px 5px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  backgroundColor: !isOnline ? '#cccccc' : '#40b8a5',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#cccccc',
                  color: '#666666',
                }
              }}
            >
              {isOnline ? 'Check Current Weather' : 'Current Weather Unavailable Offline'}
            </Button>

          </Grid>
        </Grid>

        {/* Date and Time Section */}
        <Divider sx={{ marginY: '24px' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', marginBottom: '8px' }}>
          Date & Time for Forecast
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: '16px', color: '#666' }}>
          To plan your activities, select a future date and time for the weather forecast.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <DatePicker 
              selectedDate={selectedDate} 
              setSelectedDate={setSelectedDate} 
            />
          </Grid>
          <Grid item xs={12} sm={6}>
          <CustomTimePicker
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            selectedDate={selectedDate}
            availableTimes={availableForecastTimes}
            setHasInteractedWithTime={setHasInteractedWithTime} // Pass the function here
          />
          </Grid>

        </Grid>

        {/* Submit Button */}
        <Button 
          variant="contained" 
          onClick={handleSubmit}  
          sx={{ 
            marginTop: '24px',
            backgroundColor: '#48ccb4',  
            borderRadius: '24px',
            width: '100%',
            height: '55px', 
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 'bold',
            boxShadow: '0px 3px 5px rgba(0, 0, 0, 0.2)',
          }}
        >
          Check Forecasted Weather
        </Button>

        {/* Loading Spinner */}
        {loading && <CircularProgress size={28} sx={{ display: 'block', margin: '20px auto' }} />}
      </Drawer>

      <Toaster />

    </LocalizationProvider>
  );
};

export default Dashboard;
