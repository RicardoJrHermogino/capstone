import React from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton, 
  Tooltip, 
  Chip,
  createTheme,
  ThemeProvider
} from '@mui/material';
import { Edit, Delete, CheckCircle, Cancel, LocationOn, AccessTime } from '@mui/icons-material';
import dayjs from 'dayjs';

// Modern minimalist theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
      light: '#e3f2fd'
    },
    success: {
      main: '#4caf50',
      light: '#e8f5e9'
    },
    error: {
      main: '#ef5350',
      light: '#ffebee'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff'
        }
      }
    }
  }
});


// Function to check task feasibility based on weather data and requirements
const checkTaskFeasibility = (task, weatherData, taskRequirements) => {
  const taskDateFormatted = dayjs(task.date).format('YYYY-MM-DD');

  // Find matching weather data
  const weatherInfo = weatherData.find(w => 
    w.date === taskDateFormatted &&  
    w.time === task.time && 
    w.location === task.location
  );

  if (!weatherInfo) {
    return { feasible: false, reason: 'No weather data available' };
  }

  // Find task requirements
  const requirements = taskRequirements.find(r => r.task_name === task.task_name);
  if (!requirements) {
    return { feasible: false, reason: 'Task requirements not found' };
  }

  // Parse weather restrictions
  const weatherRestrictions = JSON.parse(requirements.weatherRestrictions);

  // Feasibility checks
  const checks = {
    temperature: weatherInfo.temperature >= requirements.requiredTemperature_min && 
                 weatherInfo.temperature <= requirements.requiredTemperature_max,
    humidity: weatherInfo.humidity >= requirements.idealHumidity_min && 
              weatherInfo.humidity <= requirements.idealHumidity_max,
    windSpeed: weatherInfo.wind_speed <= requirements.requiredWindSpeed_max,
    windGust: weatherInfo.wind_gust <= requirements.requiredWindGust_max,
    pressure: weatherInfo.pressure >= requirements.requiredPressure_min && 
              weatherInfo.pressure <= requirements.requiredPressure_max,
    weather: weatherRestrictions.includes(weatherInfo.weather_id)
  };

  let feasible = true;
  let reason = 'All conditions suitable';

  if (!checks.temperature) {
    feasible = false;
    reason = 'Temperature outside acceptable range';
  }
  if (!checks.humidity) {
    feasible = false;
    reason = 'Humidity outside acceptable range';
  }
  if (!checks.windSpeed) {
    feasible = false;
    reason = 'Wind speed too high';
  }
  if (!checks.windGust) {
    feasible = false;
    reason = 'Wind gusts too strong';
  }
  if (!checks.pressure) {
    feasible = false;
    reason = 'Atmospheric pressure outside acceptable range';
  }
  if (!checks.weather) {
    feasible = false;
    reason = 'Weather conditions unsuitable';
  }

  return { feasible, reason };
};

const TaskCard = ({ task, weatherData, taskRequirements, onEdit, onDelete }) => {
  const feasibility = checkTaskFeasibility(task, weatherData, taskRequirements);

  return (
    <ThemeProvider theme={theme}>
      <Grid item xs={12} sm={6} md={4}>
        <Card 
          sx={{
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
            },
            border: 'none',
            backgroundColor: feasibility.feasible 
              ? theme.palette.success.light
              : theme.palette.error.light,
            position: 'relative',
            overflow: 'visible'
          }}
          elevation={0}
        >
          <CardContent sx={{ p: 2.5 }}>
            {/* Status Indicator */}
            <Box 
              sx={{ 
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                gap: 1
              }}
            >
              <IconButton
                size="small"
                onClick={() => onEdit(task)}
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'background.paper' }
                }}
              >
                <Edit fontSize="small" color="action" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDelete(task.sched_id)}
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'background.paper' }
                }}
              >
                <Delete fontSize="small" color="error" />
              </IconButton>
            </Box>

            {/* Task Name */}
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1.1rem',
                fontWeight: 600,
                mb: 2.5,
                color: 'text.primary',
                pr: 8 // Make room for status indicator
              }}
            >
              {task.task_name}
            </Typography>

            {/* Task Details */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn 
                  sx={{ 
                    fontSize: '1.2rem',
                    color: 'text.secondary',
                    opacity: 0.8
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontWeight: 500
                  }}
                >
                  {task.location}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime 
                  sx={{ 
                    fontSize: '1.2rem',
                    color: 'text.secondary',
                    opacity: 0.8
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontWeight: 500
                  }}
                >
                  {dayjs(task.date).format('MMM DD, YYYY')} • {dayjs(`2024-01-01T${task.time}`).format('hh:mm A')}
                </Typography>
              </Box>
            </Box>

            {/* Status Chip */}
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                p: 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              {feasibility.feasible ? 
                <CheckCircle sx={{ color: theme.palette.success.main, fontSize: 20 }} /> :
                <Cancel sx={{ color: theme.palette.error.main, fontSize: 20 }} />
              }
              <Typography 
                variant="body2" 
                sx={{ 
                  color: feasibility.feasible ? 'success.main' : 'error.main',
                  fontWeight: 600
                }}
              >
                {feasibility.reason}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </ThemeProvider>
  );
};

export default TaskCard;
