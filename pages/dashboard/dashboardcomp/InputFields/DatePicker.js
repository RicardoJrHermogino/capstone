import React, { useState, useEffect, useCallback } from "react";
import { FormControl, InputLabel, Select, MenuItem, Grid, OutlinedInput, InputAdornment, CircularProgress, Typography } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import dayjs from "dayjs";
import axios from "axios";
import { Preferences } from '@capacitor/preferences';
import API_BASE_URL from "@/config/apiConfig";

const OPENWEATHER_URL = "https://httpbin.org/get";

const DatePicker = ({ selectedDate, setSelectedDate, MenuProps }) => {
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentDate = dayjs().format("YYYY-MM-DD");

  // Function to get offline data from Capacitor Preferences
  const getOfflineData = async () => {
    try {
      const { value } = await Preferences.get({ key: "forecast_data" });
      if (value) {
        const forecastData = JSON.parse(value);
        const uniqueDates = [...new Set(forecastData.map((item) => dayjs(item.date).format("YYYY-MM-DD")))]
          .filter((date) => !dayjs(date).isBefore(currentDate, "day"))
          .sort();

        console.log("Using offline data:", uniqueDates);
        return uniqueDates;
      }
    } catch (error) {
      console.error("Error reading offline data:", error);
    }
    return [];
  };

  // Fetch Weather Data
  const fetchAvailableDates = useCallback(async () => {
    setLoading(true);

    try {
      // Check if online by fetching from OpenWeather API
      await axios.get(OPENWEATHER_URL);

      // If success, fetch actual weather data
      const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
      const forecastData = response.data;

      const uniqueDates = [...new Set(forecastData.map((item) => dayjs(item.date).format("YYYY-MM-DD")))]
        .filter((date) => !dayjs(date).isBefore(currentDate, "day"))
        .sort();

      console.log("Available dates (API):", uniqueDates);
      setAvailableDates(uniqueDates);
      if (!uniqueDates.includes(selectedDate)) {
        setSelectedDate(uniqueDates[0] || "");
      }
    } catch (error) {
      console.log("Network error, falling back to offline data");

      // Use offline data immediately if offline
      const offlineDates = await getOfflineData();
      setAvailableDates(offlineDates);
      if (!offlineDates.includes(selectedDate)) {
        setSelectedDate(offlineDates[0] || "");
      }

      if (offlineDates.length === 0) {
        setError("No data available - please check your connection");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, setSelectedDate]);

  useEffect(() => {
    fetchAvailableDates();
  }, [fetchAvailableDates]);

  if (loading) return <Grid item xs={12} sm={12} align="center">
    <CircularProgress size={24} />

    </Grid>
  ;

  if (error) return <div style={{ color: "red" }}>{error}</div>;

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
              style: { maxHeight: "390px", overflowY: "auto", marginTop: "0" },
            },
            anchorOrigin: { vertical: "top", horizontal: "left" },
            transformOrigin: { vertical: "bottom", horizontal: "left" },
            ...MenuProps,
          }}
        >
          {availableDates.map((date) => (
            <MenuItem key={date} value={date}>
              {dayjs(date).format("MMMM D, YYYY")}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  );
};

export default DatePicker;
