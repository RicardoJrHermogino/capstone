import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Card, CardContent, AppBar, Toolbar, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { getDatabaseConnection, closeDatabaseConnection } from '@/utils/sqliteService';

const ForecastPage = () => {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForecastData = async () => {
      const { value: isDataDownloaded } = await Preferences.get({ key: 'offlineDataDownloaded' });
  
      if (!isDataDownloaded) {
        setError('Please download offline data first');
        setLoading(false);
        return;
      }
  
      if (Capacitor.getPlatform() !== 'web') {
        try {
          // Get database connection using the service
          const db = await getDatabaseConnection();
  
          // Query only the forecast data
          const forecastResult = await db.query('SELECT * FROM forecast_data');
  
          if (forecastResult.values?.length > 0) {
            setForecastData(forecastResult.values);
            console.log('Forecast Data:', forecastResult.values);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setError(`Error fetching data: ${error.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        setError('SQLite not supported on web platform');
        setLoading(false);
      }
    };
  
    fetchForecastData();

    // Cleanup function to close the database connection when component unmounts
    return () => {
      closeDatabaseConnection();
    };
  }, []);

  if (loading) {
    return <Box p={4}>Loading...</Box>;
  }

  if (error) {
    return <Box p={4} sx={{ color: 'error.main' }}>Error: {error}</Box>;
  }

  return (
    <Box p={4}>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Weather Forecast
          </Typography>
        </Toolbar>
      </AppBar>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Weather Forecast Data</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Weather Data ID</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Latitude</TableCell>
                  <TableCell>Longitude</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Temperature</TableCell>
                  <TableCell>Weather ID</TableCell>
                  <TableCell>Pressure</TableCell>
                  <TableCell>Humidity</TableCell>
                  <TableCell>Clouds</TableCell>
                  <TableCell>Wind Speed</TableCell>
                  <TableCell>Wind Gust</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Probability of Precipitation (POP)</TableCell>
                  <TableCell>Rain in Last 3 Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {forecastData.map((data, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{data.weather_data_id}</TableCell>
                    <TableCell>{data.location}</TableCell>
                    <TableCell>{data.lat}</TableCell>
                    <TableCell>{data.lon}</TableCell>
                    <TableCell>{data.date}</TableCell>
                    <TableCell>{data.time}</TableCell>
                    <TableCell>{data.temperature}°C</TableCell>
                    <TableCell>{data.weather_id}</TableCell>
                    <TableCell>{data.pressure} hPa</TableCell>
                    <TableCell>{data.humidity}%</TableCell>
                    <TableCell>{data.clouds}%</TableCell>
                    <TableCell>{data.wind_speed} m/s</TableCell>
                    <TableCell>{data.wind_gust} m/s</TableCell>
                    <TableCell>{data.created_at}</TableCell>
                    <TableCell>{data.pop}%</TableCell>
                    <TableCell>{data.rain_3h} mm</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>

        {forecastData.length > 0 && (
          <Box p={4}>
            <Typography variant="h6">Preview of Forecast Data Structure</Typography>
            <pre>{JSON.stringify(forecastData[0], null, 2)}</pre>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default ForecastPage;