import React from 'react';
import { Grid, FormControl, Autocomplete, TextField, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { locationCoordinates } from '@/utils/locationCoordinates';
import dayjs from 'dayjs';

const WeatherSelect = ({ tasks, selectedTask, selectedLocation, selectedDate, selectedTime, setSelectedTask, setSelectedLocation, setSelectedDate, setSelectedTime, loading, error }) => {
  const dateOptions = Array.from({ length: 6 }, (_, index) => ({
    label: dayjs().add(index, 'day').format('dddd, MM/DD/YYYY'),
    value: dayjs().add(index, 'day')
  }));

  const timeOptions = ['Now', '06:00', '09:00', '12:00', '15:00', '18:00'];

  return (
    <Grid container spacing={4} sx={{ mb: 'auto' }}>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <Autocomplete
            options={tasks.map((task) => task.task_name)}
            renderInput={(params) => <TextField {...params} label="Select Task" size="medium" />}
            value={selectedTask}
            onChange={(_, newValue) => setSelectedTask(newValue)}
          />
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <Autocomplete
            options={Object.keys(locationCoordinates)}
            renderInput={(params) => <TextField {...params} label="Select Location" size="medium" />}
            value={selectedLocation}
            onChange={(_, newValue) => setSelectedLocation(newValue)}
          />
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Date</InputLabel>
          <Select
            value={selectedDate}
            label="Date"
            onChange={(e) => setSelectedDate(e.target.value)}
            size="medium"
          >
            {dateOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Time</InputLabel>
          <Select
            value={selectedTime}
            label="Time"
            onChange={(e) => setSelectedTime(e.target.value)}
            size="medium"
          >
            {timeOptions.map((time) => (
              <MenuItem key={time} value={time}>
                {time === 'Now' ? 'Now' : dayjs(`2024-01-01 ${time}`).format('hh:mm A')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default WeatherSelect;
