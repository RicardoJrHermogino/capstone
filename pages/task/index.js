import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, CssBaseline, Button, FormHelperText, Paper, IconButton, Badge } from '@mui/material';
import Navbar from "../components/navbar";
import { useRouter } from 'next/router';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings'; 
import NotificationsIcon from '@mui/icons-material/Notifications'; 
import AllScheduled from './task_components/all_scheduled'; // Adjust the path as needed
import AffectedTask from './task_components/affected_task';
import FavorableTask from './task_components/favorable_task';
// import axios from 'axios'; // Commented out as we won't be using axios for now

const gradientStyle = {
  padding: "20px",
  borderRadius: "5px"
};

const bottomLineStyle = {
  borderBottom: "0.5px solid gray",
  padding: "10px 15px",
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
};

const Tasks = () => {
  const router = useRouter();
  const { tab } = router.query;
  const [activeTab, setActiveTab] = useState(tab || 'all');
  const [tasks, setTasks] = useState([]); // State to store tasks

  useEffect(() => {
    // Temporarily use mock data instead of fetching from backend
    setTasks(mockTasks()); // Replace with mock data
  }, []);

  // Temporarily using mock task data
  const mockTasks = () => [
    { id: 1, name: 'Task 1', status: 'Scheduled' },
    { id: 2, name: 'Task 2', status: 'Favorable' },
    { id: 3, name: 'Task 3', status: 'Affected' },
    // Add more mock tasks as needed
  ];

  // Temporarily comment out the axios request
  // const fetchTasks = async () => {
  //   try {
  //     const response = await axios.get('/api/scheduled');
  //     setTasks(response.data);  // Set the tasks in the state (response.data is where axios stores the data)
  //   } catch (error) {
  //     console.error('Error fetching tasks:', error);
  //   }
  // };

  const handleAddNewTask = () => {
    router.push('/task/task_components/AddScheduleTask');
  };

  const handleSeeMore = () => {
    router.push('/task/task_components/restricted_task');
  };

  const handleTabClick = (newTab) => {
    setActiveTab(newTab);
    router.push(`?tab=${newTab}`);
  };

  return (
    <>
      <Navbar />
      <CssBaseline />
      <Grid container spacing={5} style={gradientStyle} mb={15} justifyContent={'center'}>
        <Grid item xs={6}>
          <Typography variant="h4"><strong>Task</strong></Typography>
        </Grid>
        <Grid item xs={6} sx={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <IconButton onClick={() => router.push('/dashboard/notifications')}>
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={() => router.push('/dashboard/profile')}>
              <SettingsIcon />
            </IconButton>
          </div>
        </Grid>

        <Grid item xs={12} md={12} align="center">
          <Button onClick={handleAddNewTask} variant="contained" sx={{ borderRadius: '20px', bgcolor: 'black', minWidth: '100%', minHeight: '100%' }}>
            Schedule New Task
          </Button>
          <FormHelperText sx={{ textAlign: 'center' }}>Schedule your planned task here.</FormHelperText>
        </Grid>

        {/* Task Buttons */}
        <Grid item xs={4} mt={2} textAlign={'center'}>
          <Paper
            elevation={3}
            sx={{
              p: 1,
              borderRadius: '10px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              bgcolor: activeTab === 'all' ? 'black' : 'transparent',
              color: activeTab === 'all' ? 'white' : 'black',
              width: '80%',
              margin: '0 auto',
            }}
            onClick={() => handleTabClick('all')}
          >
            <AssignmentIcon sx={{ fontSize: '1.5rem' }} />
          </Paper>
          <Typography variant="subtitle1" sx={{ fontSize: '0.8rem', mt: 0.7 }}>
            All
          </Typography>
        </Grid>

        <Grid item xs={4} mt={2} textAlign={'center'}>
          <Paper
            elevation={3}
            sx={{
              p: 1,
              borderRadius: '10px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              bgcolor: activeTab === 'favorable' ? 'black' : 'transparent',
              color: activeTab === 'favorable' ? 'white' : 'black',
              width: '80%',
              margin: '0 auto',
            }}
            onClick={() => handleTabClick('favorable')}
          >
            <AssignmentTurnedInIcon sx={{ fontSize: '1.5rem' }} />
          </Paper>
          <Typography variant="subtitle1" sx={{ fontSize: '0.8rem', mt: 0.7 }}>
            Favorable
          </Typography>
        </Grid>

        <Grid item xs={4} mt={2} textAlign={'center'}>
          <Paper
            elevation={3}
            sx={{
              p: 1,
              borderRadius: '10px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              bgcolor: activeTab === 'affected' ? 'black' : 'transparent',
              color: activeTab === 'affected' ? 'white' : 'black',
              width: '80%',
              margin: '0 auto',
            }}
            onClick={() => handleTabClick('affected')}
          >
            <AssignmentLateIcon sx={{ fontSize: '1.5rem' }} />
          </Paper>
          <Typography variant="subtitle1" sx={{ fontSize: '0.8rem', mt: 0.7 }}>
            Affected
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Grid container>
            <Grid item xs={12} sx={{ ...bottomLineStyle }}>
              <AssignmentTurnedInIcon sx={{ marginRight: '29px', fontSize: '23px' }} />
              <Typography variant="subtitle1" sx={{ fontSize: '0.9rem' }}>Scheduled Task</Typography>
              <ArrowForwardIosIcon sx={{ fontSize: '0.875rem', marginLeft: '150px' }} />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          {activeTab === 'all' && <AllScheduled tasks={tasks} />}
          {activeTab === 'favorable' && <FavorableTask tasks={tasks} />}
          {activeTab === 'affected' && <AffectedTask tasks={tasks} />}
        </Grid>
      </Grid>
    </>
  );
};

export default Tasks;
