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
import API_BASE_URL from '@/config/apiConfig';

const DateSelector = ({ selectedDate, setSelectedDate, MenuProps }) => {
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
        const forecastData = response.data;

        const uniqueDates = [...new Set(forecastData.map(item => 
          dayjs(item.date).format('YYYY-MM-DD')
        ))]
        .filter(date => !dayjs(date).isBefore(dayjs(), 'day'))
        .sort();
        
        setAvailableDates(uniqueDates);

        if (!uniqueDates.includes(selectedDate)) {
          setSelectedDate(uniqueDates[0] || '');
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
        const fallbackDates = Array.from({ length: 6 }, (_, i) =>
          dayjs().add(i, "day").format("YYYY-MM-DD")
        );
        setAvailableDates(fallbackDates);
        if (!selectedDate || !fallbackDates.includes(selectedDate)) {
          setSelectedDate(fallbackDates[0]);
        }
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
        value={selectedDate || ''}
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
    </Grid>
  );
};

export default DateSelector;