import React from 'react';
import { Box } from '@mui/material';
import { 
  WbSunny as SunIcon, 
  WaterDrop as HumidityIcon, 
  Air as WindIcon, 
  WbCloudy as CloudIcon,
  Thunderstorm as ThunderstormIcon,  // Updated to use Thunderstorm icon
  AcUnit as SnowIcon,
  CloudCircle as AtmosphereIcon
} from '@mui/icons-material';

export const WeatherIcon = ({ weatherId }) => {
  const getWeatherIcon = (id) => {
    if (id >= 200 && id < 300) return <ThunderstormIcon color="primary" />;
    if (id >= 300 && id < 400) return <CloudIcon color="info" />;
    if (id >= 500 && id < 600) return <CloudIcon color="info" />;
    if (id >= 600 && id < 700) return <SnowIcon color="info" />;
    if (id >= 700 && id < 800) return <AtmosphereIcon color="disabled" />;
    if (id === 800) return <SunIcon color="warning" />;
    if (id > 800 && id < 805) return <CloudIcon color="inherit" />;
    return <CloudIcon color="inherit" />;
  };

  return (
    <Box sx={{ fontSize: 40, display: 'flex', alignItems: 'center' }}>
      {getWeatherIcon(weatherId)}
    </Box>
  );
};


export default WeatherIcon;