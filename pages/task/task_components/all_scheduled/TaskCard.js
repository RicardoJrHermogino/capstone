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
    },
    past: {
      main: '#9e9e9e',
      light: '#f5f5f5'
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

const TaskCard = ({task, onEdit, onDelete, feasibility}) => {
  const now = dayjs();
  const taskDateTime = dayjs(`${task.date}T${task.time}`);
  const isPast = taskDateTime.isBefore(now);

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
            backgroundColor: isPast 
              ? 'past.light'
              : feasibility.feasible 
                ? 'success.light'
                : 'error.light',
            position: 'relative',
            overflow: 'visible'
          }}
          elevation={0}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box 
              sx={{ 
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                gap: 1
              }}
            >
              {!isPast && (
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
              )}
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

            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '1.1rem', 
                fontWeight: 600, 
                mb: 2.5, 
                color: isPast ? 'past.main' : 'text.primary', 
                pr: 8 
              }}
            >
              {task.task_name}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ 
                  fontSize: '1.2rem', 
                  color: isPast ? 'past.main' : 'text.secondary', 
                  opacity: 0.8 
                }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isPast ? 'past.main' : 'text.secondary', 
                    fontWeight: 500 
                  }}
                >
                  {task.location}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ 
                  fontSize: '1.2rem', 
                  color: isPast ? 'past.main' : 'text.secondary', 
                  opacity: 0.8 
                }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isPast ? 'past.main' : 'text.secondary', 
                    fontWeight: 500 
                  }}
                >
                  {dayjs(task.date).format('MMM DD, YYYY')} • {dayjs(`2024-01-01T${task.time}`).format('hh:mm A')}
                </Typography>
              </Box>
            </Box>

            {!isPast && (
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
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} /> :
                  <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
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
            )}
            {isPast && (
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
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'past.main',
                    fontWeight: 600
                  }}
                >
                  Past task
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </ThemeProvider>
  );
};

export default TaskCard;