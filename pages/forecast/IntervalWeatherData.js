import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Typography, 
  Paper, 
  Container, 
  IconButton 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Image from 'next/image';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { getWeatherIcon } from '../dashboard/dashboardcomp/WeatherDisplay/WeatherIcon';
import { mapWeatherCondition } from '../dashboard/dashboardcomp/WeatherDisplay/WeatherCondition';
import API_BASE_URL from '@/config/apiConfig';

export default function HourlyForecastDetails() {
  const router = useRouter();
  const { location, date } = router.query;
  const [hourlyData, setHourlyData] = useState([]);

  useEffect(() => {
    if (location && date) {
      // Fetch hourly forecast data for specific date and location
      const fetchHourlyData = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/getHourlyWeatherData?location=${location}&date=${date}`);
          const data = await response.json();
          setHourlyData(data);
        } catch (error) {
          console.error('Error fetching hourly forecast:', error);
        }
      };

      fetchHourlyData();
    }
  }, [location, date]);

  const handleGoBack = () => {
    router.push('/forecast');
  };

  return (
    <Container maxWidth="sm">
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {/* Back Button */}
        <Grid item xs={12}>
          <IconButton onClick={handleGoBack}>
            <ArrowBackIcon />
          </IconButton>
        </Grid>

        {/* Location and Date Header */}
        <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h5">
            <strong>{location}</strong>
          </Typography>
          <Typography variant="subtitle1">
            {dayjs(date).format('dddd, MMMM DD, YYYY')}
          </Typography>
        </Grid>

        {/* Hourly Forecast List */}
        {hourlyData.map((hourlyForecast, index) => {
          const weatherCondition = mapWeatherCondition(hourlyForecast.weather_id, date, false);
          
          // Modify time parsing to handle potential formats
          const formattedTime = hourlyForecast.time 
            ? dayjs(
                `${date} ${hourlyForecast.time}`, 
                'YYYY-MM-DD HH:mm:ss'
              ).format('h:mm A')
            : 'N/A';
          
          // Log the hourly forecast data for debugging
          console.log(`Hourly Forecast for ${formattedTime}:`, hourlyForecast);

          return (
            <Grid item xs={6} key={index}>
              <Paper 
                sx={{
                    padding: '20px',
                    textAlign: 'center',
                    borderRadius: '20px',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                  }}
              >
                <Grid container spacing={1} alignItems="center">
                  {/* Weather Icon */}
                  <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Image
                      src={getWeatherIcon(
                        hourlyForecast.weather_id, 
                        dayjs(date).format('MMMM DD, YYYY'), 
                        hourlyForecast.time, 
                        false
                      )}
                      alt="Weather Icon"
                      width={50}
                      height={50}
                    />
                  </Grid>

                  {/* Temperature */}
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="h6">
                      {hourlyForecast.temperature.toFixed(0)}&deg;C
                    </Typography>
                  </Grid>
                </Grid>

                {/* Weather Condition */}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {weatherCondition}
                </Typography>

                {/* Time (Below Icon & Temperature) */}
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {formattedTime}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
