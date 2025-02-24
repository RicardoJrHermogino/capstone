import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  OutlinedInput,
  InputAdornment,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import dayjs from "dayjs";
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import API_BASE_URL from '@/config/apiConfig';

const OPENWEATHER_URL = "https://httpbin.org/get";

const DateSelector = ({ selectedDate, setSelectedDate, MenuProps }) => {
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentDate = dayjs().format('YYYY-MM-DD');

  // Function to get offline data from Capacitor Preferences
  const getOfflineData = async () => {
    try {
      const { value } = await Preferences.get({ key: 'forecast_data' });
      if (value) {
        const forecastData = JSON.parse(value);
        const uniqueDates = [...new Set(forecastData.map(item => 
          dayjs(item.date).format('YYYY-MM-DD')
        ))]
        .filter(date => !dayjs(date).isBefore(dayjs(), 'day'))
        .sort();

        console.log("Using offline date data:", uniqueDates);
        return uniqueDates;
      }
    } catch (error) {
      console.error("Error reading offline date data:", error);
    }
    return [];
  };

  useEffect(() => {
    const fetchAvailableDates = async () => {
      setLoading(true);
      
      try {
        // Check if online by fetching from OpenWeather API
        await axios.get(OPENWEATHER_URL);

        // If success, fetch actual weather data
        const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
        const forecastData = response.data;

        // Extract unique dates and filter out past dates
        const uniqueDates = [...new Set(forecastData.map(item => 
          dayjs(item.date).format('YYYY-MM-DD')
        ))]
        .filter(date => !dayjs(date).isBefore(dayjs(), 'day'))
        .sort();
        
        console.log('Available dates (API):', uniqueDates);
        setAvailableDates(uniqueDates);
        
        // If selected date is not in available dates, select the first available date
        if (!uniqueDates.includes(selectedDate)) {
          setSelectedDate(uniqueDates[0] || '');
        }
        setError(null);

      } catch (error) {
        console.log("Network error, falling back to offline data");

        // Use offline data immediately if offline
        const offlineDates = await getOfflineData();
        
        if (offlineDates.length > 0) {
          setAvailableDates(offlineDates);
          if (!offlineDates.includes(selectedDate)) {
            setSelectedDate(offlineDates[0] || '');
          }
          setError("Operating in offline mode");
        } else {
          // If no offline data available, use fallback dates
          const fallbackDates = Array.from({ length: 6 }, (_, i) =>
            dayjs().add(i, "day").format("YYYY-MM-DD")
          );
          setAvailableDates(fallbackDates);
          if (!selectedDate || !fallbackDates.includes(selectedDate)) {
            setSelectedDate(fallbackDates[0]);
          }
          setError("No data available - using fallback dates");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableDates();
  }, [selectedDate, setSelectedDate]);

  return (
    <Grid item xs={12} sm={12} align="center">
      <FormControl fullWidth variant="outlined">
        <InputLabel id="date-select-label">Date</InputLabel>
        <Select
          labelId="date-select-label"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          label="Date"
          input={
            <OutlinedInput
              label="Date"
              startAdornment={
                <InputAdornment position="start">
                  <CalendarTodayIcon />
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
          {availableDates.map((date) => (
            <MenuItem key={date} value={date}>
              {dayjs(date).format("MMMM D, YYYY")}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {/* {error && <div style={{ color: "orange", marginTop: "8px", fontSize: "0.875rem" }}>{error}</div>} */}
    </Grid>
  );
};

export default DateSelector;