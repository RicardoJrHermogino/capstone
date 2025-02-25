import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Select, MenuItem, Grid, InputLabel, FormControl, OutlinedInput, InputAdornment } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import API_BASE_URL from '@/config/apiConfig';

const OPENWEATHER_URL = "https://httpbin.org/get";

const CustomTimePicker = ({
  selectedTime,
  setSelectedTime,
  selectedDate,
  MenuProps,
  setHasInteractedWithTime,
}) => {
  const [availableTimes, setAvailableTimes] = useState([]);
  const [lastAvailableDate, setLastAvailableDate] = useState(null);
  const [error, setError] = useState(null);

  const timeIntervals = useMemo(() => [
    '00:00', '03:00', '06:00', '09:00',
    '12:00', '15:00', '18:00', '21:00'
  ], []);

  const currentDateTime = dayjs();
  const currentDate = currentDateTime.format('YYYY-MM-DD');

  // Function to get offline data from Capacitor Preferences
  const getOfflineData = async () => {
    try {
      const { value } = await Preferences.get({ key: 'forecast_data' });
      if (value) {
        const forecastData = JSON.parse(value);
        const timesForDate = forecastData
          .filter((item) => item.date === selectedDate)
          .map((item) => dayjs(item.time, 'HH:mm:ss').format('HH:00'));

        console.log("Using offline time data:", timesForDate);
        return timesForDate;
      }
    } catch (error) {
      console.error("Error reading offline time data:", error);
    }
    return [];
  };

  // Function to fetch available time intervals
  const fetchAvailableTimeIntervals = useCallback(async () => {
    try {
      // Check if online by fetching from OpenWeather API
      await axios.get(OPENWEATHER_URL);

      // If success, fetch actual weather data
      const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
      const forecastData = response.data;

      const lastDate = forecastData[forecastData.length - 1]?.date;
      setLastAvailableDate(lastDate);

      const timesForLastDate = forecastData
        .filter((item) => item.date === selectedDate)
        .map((item) => dayjs(item.time, 'HH:mm:ss').format('HH:00'));

      console.log("Available times (API):", timesForLastDate);
      setAvailableTimes(timesForLastDate);
      setError(null);
    } catch (error) {
      console.log("Network error, falling back to offline time data");

      // Use offline data immediately if offline
      const offlineTimes = await getOfflineData();
      setAvailableTimes(offlineTimes);

      if (offlineTimes.length === 0) {
        setError("No time data available - please check your connection");
      } else {
        setError("Operating in offline mode");
      }
    }
  }, [selectedDate]);

  // Memoize available time intervals and disable past or unavailable times
  const availableTimeIntervals = useMemo(() => {
    return timeIntervals.map((time) => {
      const fullTime = dayjs(`${selectedDate} ${time}`, 'YYYY-MM-DD HH:mm');
      const isPastTime = selectedDate === currentDate && fullTime.isBefore(currentDateTime);
      const isUnavailable = !availableTimes.includes(time);

      return {
        time,
        isDisabled: isPastTime || isUnavailable,
      };
    });
  }, [timeIntervals, selectedDate, currentDate, currentDateTime, availableTimes]);

  // Reset selected time if it becomes invalid
  useEffect(() => {
    const selectedTimeData = availableTimeIntervals.find((item) => item.time === selectedTime);
    if (selectedTimeData && selectedTimeData.isDisabled) {
      setSelectedTime('');
      setHasInteractedWithTime(false);
    }
  }, [selectedDate, availableTimeIntervals, selectedTime, setSelectedTime, setHasInteractedWithTime]);

  // Handle time change
  const handleTimeChange = useCallback(
    (e) => {
      const newTime = e.target.value;
      const selectedTimeData = availableTimeIntervals.find((item) => item.time === newTime);

      if (selectedTimeData && !selectedTimeData.isDisabled) {
        setSelectedTime(newTime);
        setHasInteractedWithTime(true);
      }
    },
    [availableTimeIntervals, setSelectedTime, setHasInteractedWithTime],
  );

  const convertToAMPM = (time) => dayjs(time, 'HH:mm').format('hh:mm A');

  // Load available times when selectedDate changes
  useEffect(() => {
    fetchAvailableTimeIntervals();
  }, [fetchAvailableTimeIntervals, selectedDate]);

  return (
    <Grid item xs={12} sm={12} align="center">
      <FormControl fullWidth variant="outlined">
        <InputLabel id="time-select-label">Time</InputLabel>
        <Select
          labelId="time-select-label"
          value={selectedTime}
          onChange={handleTimeChange}
          label="Time"
          input={(
            <OutlinedInput
              label="Time"
              startAdornment={
                <InputAdornment position="start">
                  <AccessTimeIcon />
                </InputAdornment>
              }
            />
          )}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: '390px',
                overflowY: 'auto',
                marginTop: '0',
              },
            },
            anchorOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            ...MenuProps,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
            },
            '& fieldset': {
              borderRadius: '10px',
            },
            backgroundColor: '#f5f7fa',
          }}
        >
          {availableTimeIntervals.map(({ time, isDisabled }) => (
            <MenuItem key={time} value={time} disabled={isDisabled}>
              {convertToAMPM(time)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {/* {error && <div style={{ color: "orange", marginTop: "8px" }}>{error}</div>} */}
    </Grid>
  );
};

export default CustomTimePicker;



// import React, { useState, useEffect, useCallback } from "react";
// import { FormControl, InputLabel, Select, MenuItem, Grid, OutlinedInput, InputAdornment } from "@mui/material";
// import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
// import dayjs from "dayjs";
// import axios from "axios";
// import { Preferences } from '@capacitor/preferences';
// import API_BASE_URL from "@/config/apiConfig";

// const DatePicker = ({ selectedDate, setSelectedDate, MenuProps }) => {
//   const [availableDates, setAvailableDates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isOffline, setIsOffline] = useState(false);
//   const currentDate = dayjs().format("YYYY-MM-DD");

//   // Function to check connection using OpenWeatherMap API
//   const checkConnection = async () => {
//     try {
//       await axios.get(
//         'https://api.openweathermap.org/data/2.5/weather?lat=12.9742&lon=124.0058&appid=588741f0d03717db251890c0ec9fd071&units=metric'
//       );
//       return true; // Online
//     } catch (error) {
//       return false; // Offline
//     }
//   };

//   // Function to get offline data from Capacitor Preferences
//   const getOfflineData = async () => {
//     try {
//       const { value } = await Preferences.get({ key: 'forecast_data' });
//       if (value) {
//         const forecastData = JSON.parse(value);
//         const uniqueDates = [...new Set(forecastData.map((item) => dayjs(item.date).format("YYYY-MM-DD")))]
//           .filter((date) => !dayjs(date).isBefore(currentDate, "day"))
//           .sort();
//         return uniqueDates;
//       }
//       return [];
//     } catch (error) {
//       console.error("Error reading offline data:", error);
//       return [];
//     }
//   };

//   // Function to fetch available dates with connection check
//   const fetchAvailableDates = useCallback(async () => {
//     if (!loading) setLoading(true);
  
//     try {
//       const isOnline = await checkConnection();
//       setIsOffline(!isOnline);
  
//       if (!isOnline) {
//         console.log("Offline mode detected"); // Log for offline mode
//         throw new Error('Offline mode');
//       }
  
//       const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
//       const forecastData = response.data;
      
//       const uniqueDates = [...new Set(forecastData.map((item) => dayjs(item.date).format("YYYY-MM-DD")))]
//         .filter((date) => !dayjs(date).isBefore(currentDate, "day"))
//         .sort();
  
//       console.log("API data used:", uniqueDates); // Log for API data usage
  
//       setAvailableDates(uniqueDates);
//       if (!uniqueDates.includes(selectedDate)) {
//         setSelectedDate(uniqueDates[0] || "");
//       }
//       setError(null);
      
//     } catch (error) {
//       const offlineDates = await getOfflineData();
      
//       if (offlineDates.length > 0) {
//         console.log("Offline data used:", offlineDates); // Log for offline data usage
//         setAvailableDates(offlineDates);
//         if (!offlineDates.includes(selectedDate)) {
//           setSelectedDate(offlineDates[0] || "");
//         }
//         setError(isOffline ? "Operating in offline mode" : null);
//       } else {
//         setError("No data available - please check your connection");
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedDate, setSelectedDate, isOffline, currentDate]);
  

//   // Initial fetch on mount
//   useEffect(() => {
//     fetchAvailableDates();
    
//     // Set up periodic connection checks (every 30 seconds)
//     const intervalId = setInterval(async () => {
//       const isOnline = await checkConnection();
//       if (isOnline !== !isOffline) { // Connection status changed
//         fetchAvailableDates();
//       }
//     }, 30000);

//     return () => clearInterval(intervalId);
//   }, []);

//   if (loading) return <div>Loading dates...</div>;
//   if (error && !availableDates.length) return <div style={{ color: "red" }}>{error}</div>;

//   return (
//     <Grid item xs={12} sm={12} align="center">
//       <FormControl fullWidth variant="outlined">
//         <InputLabel id="date-select-label">Date</InputLabel>
//         <Select
//           labelId="date-select-label"
//           value={selectedDate}
//           onChange={(e) => setSelectedDate(e.target.value)}
//           label="Date"
//           input={
//             <OutlinedInput
//               label="Date"
//               startAdornment={
//                 <InputAdornment position="start">
//                   <CalendarTodayIcon />
//                 </InputAdornment>
//               }
//             />
//           }
//           MenuProps={MenuProps}
//         >
//           {availableDates.map((date) => (
//             <MenuItem key={date} value={date}>
//               {dayjs(date).format("MMMM D, YYYY")}
//             </MenuItem>
//           ))}
//         </Select>
//       </FormControl>
//       {error && <div style={{ color: "orange", marginTop: "8px" }}>{error}</div>}
//     </Grid>
//   );
// };

// export default DatePicker;