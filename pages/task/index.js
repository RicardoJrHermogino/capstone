import React from 'react';
import { useState } from 'react';
import { Grid, Typography, CssBaseline, Button, FormHelperText } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Navbar from "../components/navbar";
import { useRouter } from 'next/router';
import AllScheduled from './task_components/all_scheduled';

const gradientStyle = {
  padding: "20px",
  borderRadius: "5px"
};

const Tasks = () => {
  const router = useRouter();

  const handleAddNewTask = () => {
    router.push('/task/task_components/AddScheduleTask');
  };

  return (
    <>
      <Navbar />
      <CssBaseline />
      <Grid container spacing={5} style={gradientStyle} mb={15} justifyContent={'center'}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ textAlign: 'left' }}><strong>Schedule</strong></Typography>
        </Grid>

        <Grid item xs={12} md={12} align="center">
          <Button 
            onClick={handleAddNewTask} 
            variant="contained" 
            sx={{ 
              borderRadius: '20px', 
              bgcolor: '#48ccb4', 
              minWidth: '100%', 
              minHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarMonthIcon sx={{ fontSize: '2rem' }}  />
          </Button>
          <FormHelperText sx={{ textAlign: 'center' }}>
            Schedule your planned task here.
          </FormHelperText>
        </Grid>


        <Grid item xs={12}>
          <AllScheduled  />
        </Grid>
      </Grid>
    </>
  );
};

export default Tasks;