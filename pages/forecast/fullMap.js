import React from 'react';
import WeatherMap from "../components/WeatherMap";
import { Grid, IconButton } from '@mui/material';
import Navbar from "../components/navbar";
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Import the back icon
import { useRouter } from 'next/router'; // To handle navigation

const FullMap = () => {
  const router = useRouter();

  const handleBack = () => {
    router.push("/forecast"); // Go back to the previous page
  };

  return (
    <Grid
      container
      direction="column"
      sx={{
        height: '100vh', // Full viewport height
        width: '100%',   // Full width
        margin: 0,       // Remove any default margin
        padding: 0,      // Remove any default padding
        position: 'relative', // This will allow absolute positioning of the icon
      }}
    >
      {/* Back Icon in the top-left corner */}
      <Grid item sx={{
        position: 'absolute', // Position it absolutely in the top-left
        top: '20px', // Slightly below the top of the page
        left: '20px', // Slightly from the left
        zIndex: 10, // Ensure it stays on top of other elements
      }}>
        <IconButton onClick={handleBack} sx={{ backgroundColor: 'white', borderRadius: '50%' }}>
          <ArrowBackIcon sx={{ fontSize: 25, color: 'black' }} />
        </IconButton>
      </Grid>

      {/* Navbar */}
      <Navbar />

      {/* Weather Map Container */}
      <Grid item xs={12} sx={{ height: '100%' }}>
        <WeatherMap />
      </Grid>
    </Grid>
  );
};

export default FullMap;
