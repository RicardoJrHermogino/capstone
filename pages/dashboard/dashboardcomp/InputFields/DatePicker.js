import React, { useState, useEffect, useCallback } from "react";
import { FormControl, InputLabel, Select, MenuItem, Grid, OutlinedInput, InputAdornment } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import dayjs from "dayjs";
import axios from "axios";
import { getDatabaseConnection } from "@/utils/sqliteService";  // Import the getDatabaseConnection function
import API_BASE_URL from "@/config/apiConfig";

const FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const DatePicker = ({ selectedDate, setSelectedDate, MenuProps }) => {
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentDate = dayjs().format("YYYY-MM-DD");

  // Function to fetch available dates from API
  const fetchAvailableDatesApi = useCallback(async () => {
    setLoading(true);
    try {
      const lastFetchTime = localStorage.getItem("last_fetch_time");
      const now = Date.now();

      // Only fetch if more than 5 minutes have passed since last fetch
      if (lastFetchTime && now - parseInt(lastFetchTime) < FETCH_INTERVAL) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
      const forecastData = response.data;

      const uniqueDates = [...new Set(forecastData.map((item) => dayjs(item.date).format("YYYY-MM-DD")))]
        .filter((date) => !dayjs(date).isBefore(currentDate, "day"))
        .sort();

      console.log("Available dates (API):", uniqueDates);

      if (JSON.stringify(uniqueDates) !== JSON.stringify(availableDates)) {
        setAvailableDates(uniqueDates);
        localStorage.setItem("forecast_dates", JSON.stringify(uniqueDates));
        localStorage.setItem("last_fetch_time", now.toString()); // Update fetch timestamp

        if (!uniqueDates.includes(selectedDate)) {
          setSelectedDate(uniqueDates[0] || "");
        }
      }
    } catch (error) {
      console.error("API fetch failed, switching to offline mode:", error);
      fetchAvailableDatesOffline();
    } finally {
      setLoading(false);
    }
  }, [selectedDate, setSelectedDate, availableDates]);

  // Function to fetch available dates from SQLite
  const fetchAvailableDatesOffline = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabaseConnection();  // Use the shared database connection

      const result = await db.query("SELECT DISTINCT date FROM forecast_data WHERE date >= ?", [currentDate]);

      if (result.values?.length > 0) {
        const dates = result.values.map((row) => row.date);
        console.log("Available dates (Offline):", dates);
        setAvailableDates(dates);

        if (!selectedDate || !dates.includes(selectedDate)) {
          setSelectedDate(dates[0] || "");
        }
      } else {
        setError("No forecast data found in SQLite");
      }
    } catch (error) {
      console.error("Error fetching data from SQLite:", error);
      setError("Error fetching available dates");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, setSelectedDate]);

  // Load offline data first and then fetch API in background
  useEffect(() => {
    fetchAvailableDatesOffline();
    fetchAvailableDatesApi();

    // Poll API every 5 minutes to keep data fresh
    const interval = setInterval(() => {
      fetchAvailableDatesApi();
    }, FETCH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchAvailableDatesApi, fetchAvailableDatesOffline]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

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
