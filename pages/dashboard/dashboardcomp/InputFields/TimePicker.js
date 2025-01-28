// TimePicker.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Select, MenuItem, Grid, InputLabel, FormControl, OutlinedInput, InputAdornment } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';
import axios from 'axios';
import API_BASE_URL from '@/config/apiConfig';

const CustomTimePicker = ({
  selectedTime,
  setSelectedTime,
  selectedDate,
  MenuProps,
  setHasInteractedWithTime,
}) => {
  const [availableTimes, setAvailableTimes] = useState([]);
  const [lastAvailableDate, setLastAvailableDate] = useState(null);


  
  const timeIntervals = useMemo(() => [
    '00:00', '03:00', '06:00', '09:00', 
    '12:00', '15:00', '18:00', '21:00'
  ], []); // Move timeIntervals inside useMemo

  const currentDateTime = dayjs();
  const currentDate = currentDateTime.format('YYYY-MM-DD');

  // Fetch weather data and determine available times
  useEffect(() => {
    const fetchAvailableTimeIntervals = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/getWeatherData`);
        const forecastData = response.data;

        const lastDate = forecastData[forecastData.length - 1]?.date;
        setLastAvailableDate(lastDate);

        const timesForLastDate = forecastData
          .filter((item) => item.date === lastDate)
          .map((item) => dayjs(item.time, 'HH:mm:ss').format('HH:00'));

        setAvailableTimes(timesForLastDate);
      } catch (error) {
        console.error('Error fetching available time intervals:', error);
      }
    };

    fetchAvailableTimeIntervals();
  }, []);

// Memoize available time intervals
const availableTimeIntervals = useMemo(() => {
  return timeIntervals.map((time) => {
    const fullTime = dayjs(`${selectedDate} ${time}`, 'YYYY-MM-DD HH:mm');
    const isPastTime = selectedDate === currentDate && fullTime.isBefore(currentDateTime);
    const isUnavailableForLastDate =
      selectedDate === lastAvailableDate && !availableTimes.includes(time);

    return {
      time,
      isDisabled: isPastTime || isUnavailableForLastDate,
    };
  });
}, [timeIntervals, selectedDate, currentDate, currentDateTime, lastAvailableDate, availableTimes]);

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

  return (
    <Grid item xs={12} sm={12} align="center">
      <FormControl fullWidth variant="outlined">
        <InputLabel id="time-select-label">Time</InputLabel>
        <Select
          labelId="time-select-label"
          value={selectedTime}
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
    </Grid>
  );
};

export default CustomTimePicker;
