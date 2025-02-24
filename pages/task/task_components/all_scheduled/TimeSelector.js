import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Select, MenuItem, Grid, InputLabel, FormControl, OutlinedInput, InputAdornment } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import API_BASE_URL from '@/config/apiConfig';

const OPENWEATHER_URL = "https://httpbin.org/get";

const TimeSelector = ({
  selectedTime,
  setSelectedTime,
  selectedDate,
  MenuProps,
  setHasInteractedWithTime,
}) => {
  const [availableTimes, setAvailableTimes] = useState([]);
  const [lastAvailableDate, setLastAvailableDate] = useState(null);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const timeIntervals = useMemo(() => [
   '03:00', '06:00', '09:00', 
    '12:00', '15:00', '18:00', 
  ], []);

  const currentDateTime = dayjs();
  const currentDate = currentDateTime.format('YYYY-MM-DD');

  // Function to check connection using OpenWeatherMap API
  const checkConnection = async () => {
    try {
      await axios.get(OPENWEATHER_URL);
      return true;
    } catch (error) {
      return false;
    }
  };

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

  // Fetch weather data and determine available times
  const fetchAvailableTimeIntervals = useCallback(async () => {
    try {
      const isOnline = await checkConnection();
      setIsOffline(!isOnline);

      if (!isOnline) {
        throw new Error('Offline mode');
      }

      const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
      const forecastData = response.data;

      const lastDate = forecastData[forecastData.length - 1]?.date;
      setLastAvailableDate(lastDate);

      const timesForSelectedDate = forecastData
        .filter((item) => item.date === selectedDate)
        .map((item) => dayjs(item.time, 'HH:mm:ss').format('HH:00'));

      console.log("Available times (API):", timesForSelectedDate);
      setAvailableTimes(timesForSelectedDate);
      setError(null);

    } catch (error) {
      console.log("Network error, falling back to offline time data");
      
      const offlineTimes = await getOfflineData();
      setAvailableTimes(offlineTimes);

      if (offlineTimes.length === 0) {
        setError("No time data available - please check your connection");
      } else {
        setError("Operating in offline mode");
      }
    }
  }, [selectedDate]);

  // Memoize available time intervals
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

  // Reset the selected time if it becomes invalid
  useEffect(() => {
    const selectedTimeData = availableTimeIntervals.find((item) => item.time === selectedTime);
    if (selectedTimeData && selectedTimeData.isDisabled) {
      setSelectedTime('');
      setHasInteractedWithTime(false);
    }
  }, [selectedDate, availableTimeIntervals, selectedTime, setSelectedTime, setHasInteractedWithTime]);

  // Handle change of selected time
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

  // Initial fetch and periodic connection checks
  useEffect(() => {
    fetchAvailableTimeIntervals();

    // Set up periodic connection checks (every 30 seconds)
    const intervalId = setInterval(async () => {
      const isOnline = await checkConnection();
      if (isOnline !== !isOffline) { // Connection status changed
        fetchAvailableTimeIntervals();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchAvailableTimeIntervals, isOffline]);

  return (
    <Grid item xs={12} sm={12} align="center">
      <FormControl fullWidth variant="outlined">
        <InputLabel id="time-select-label">Time</InputLabel>
        <Select
          labelId="time-select-label"
          value={selectedTime || ""}
          onChange={handleTimeChange}
          label="Time"
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
      {error && <div style={{ color: "orange", marginTop: "8px" }}>{error}</div>}
    </Grid>
  );
};

export default TimeSelector;