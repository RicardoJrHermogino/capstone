// components/WeatherInfo.js
import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { WbSunny as SunIcon } from '@mui/icons-material';

const WeatherInfo = ({ weather }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={6}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 2, p: 1 }}>
          <SunIcon color="warning" />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            {weather.main.temp}°C
          </Typography>
          <Typography variant="caption" color="text.disabled">Temperature</Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default WeatherInfo;
