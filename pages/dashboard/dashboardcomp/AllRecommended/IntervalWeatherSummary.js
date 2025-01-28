import React from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  Alert,
  Paper,
  Chip
} from '@mui/material';
import { 
  WbSunny as SunIcon
} from '@mui/icons-material';
import { WeatherIcon } from './WeatherIcon';

export const IntervalWeatherSummary = ({ interval, onTaskClick }) => {
  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          pb: 1,
          borderBottom: '1px solid rgba(0,0,0,0.1)' 
        }}
      >
        <Typography 
          variant="h5" 
          color="primary" 
          sx={{ fontWeight: 600 }}
        >
          {interval.time}
        </Typography>
        <WeatherIcon weatherId={interval.weather.weather[0].id} />
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              backgroundColor: '#F2F2F7',
              borderRadius: 2,
              p: 1
            }}
          >
            <SunIcon color="warning" />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mt: 0.5, fontWeight: 500 }}
            >
              {`${interval.weather.main.temp}°C`}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.disabled"
            >
              Temperature
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {interval.tasks.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 2,
            backgroundColor: '#E5E5EA',
            color: '#8E8E93'
          }}
        >
          No tasks recommended for this time interval.
        </Alert>
      ) : (
        interval.tasks.map((task, taskIndex) => (
          <Paper 
            key={taskIndex} 
            elevation={0} 
            onClick={() => onTaskClick(task)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onTaskClick(task);
              }
            }}
            sx={{ 
              p: 2, 
              mb: 2, 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#F5F5F5',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              },
              '&:focus': {
                outline: 'none',
                boxShadow: '0 0 0 2px #007AFF',
              }
            }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              {task.task_name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {task.description}
            </Typography>
          </Paper>
        ))
      )}
    </>
  );
};

export default IntervalWeatherSummary;