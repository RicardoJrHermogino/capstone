import React from 'react';
import { Container, Typography, Paper, Grid, Box, IconButton, CssBaseline } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/router'; 

const RestrictedTasksPage = () => {
  const restrictedTasks = Array.from({ length: 16 }, (_, index) => ({
    id: index + 1,
    name: `Restricted Task ${index + 1}`,
  }));

  const gradientStyle = {
    padding: "20px",
    borderRadius: "5px"
  };
  
  const router = useRouter();
  
  const handleGoBack = () => {
    router.back();
  };


  return (
    <>
      <CssBaseline />
      <Container maxWidth="sm">
        <Grid container spacing={5} style={gradientStyle} justifyContent="center" mb={10}>
          <IconButton onClick={handleGoBack} sx={{ position: 'absolute', top: 15, left: 20 }}>
            <ArrowBack />
          </IconButton>
          <Grid item xs={12} mt={8}>
            <Typography variant="h4" align="left"><strong> Task</strong></Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom align="left"><strong> Restricted Task Today</strong></Typography>

            <Grid container mt={2} spacing={3}>
          {restrictedTasks.map(task => (
            <Grid item xs={12} md={6} lg={4} key={task.id}>
              <Paper style={{ padding: '10px', borderRadius: '5px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <Typography>{task.name}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
          </Grid>
        </Grid>
      </Container>

      
    </>
  );
};

export default RestrictedTasksPage;
