import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from "next/image";
import { Container, Typography, Button, CssBaseline, Box, Stack } from '@mui/material';
import { motion } from 'framer-motion';



const WelcomeDashboard = () => {
  const [isExiting, setIsExiting] = useState(false);

  const router = useRouter();


  const handleGetStartedClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.push('/welcome/greetings');
    }, 250);
  };

  return (
    <>
      <CssBaseline />
      <Container 
        maxWidth="sm" 
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 1, x: 0 }}
          animate={isExiting ? { x: -1000, opacity: 0 } : {}}
          transition={{ duration: 1 }}
          style={{ width: '100%' }}
        >
          <Stack
            spacing={4}
            sx={{
              minHeight: '100vh',
              py: 4,
              px: 2,
              justifyContent: 'space-between'
            }}
          >
            {/* Header Section */}
            <Box>
              <Typography 
                variant="h5" 
                align="center"
                sx={{
                  fontSize: {
                    xs: '1.5rem',
                    sm: '2rem',
                    md: '2.25rem'
                  },
                  fontWeight: 'bold'
                }}
              >
                Discover TaskWeatherSync Smart Scheduler
              </Typography>
            </Box>

            {/* Main Content Section */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: 260,
                  height: 260,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* Gradient shadow background */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(255,215,0,0.3), rgba(255,215,0,0) 100%)',
                    borderRadius: '50%',
                    filter: 'blur(30px)',
                    zIndex: -1,
                  }}
                />
                <Image 
                  src="/image/16.png" 
                  alt="sample" 
                  width={260} 
                  height={260}
                  style={{
                    objectFit: 'contain',
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
              </Box>
            </Box>

            {/* Footer Section */}
            <Stack spacing={3}>
              <Typography 
                variant="body2" 
                align="center"
                sx={{ color: 'text.secondary' }}
              >
                TaskWeatherSync: Start Your Weather-Informed Task Management Journey Now
              </Typography>
              
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleGetStartedClick}
                sx={{
                  borderRadius: '40px',
                  fontWeight: 'bold',
                  height: '70px',
                  backgroundColor: "black",
                  '&:hover': {
                    backgroundColor: '#333'
                  }
                }}
              >
                Continue
              </Button>
            </Stack>
          </Stack>
        </motion.div>
      </Container>
    </>
  );
};

export default WelcomeDashboard;


// import { useRouter } from 'next/router';

// const HomePage = () => {
//   const router = useRouter();

//   const navigateToPage = () => {
//     router.push('/finalwelcome'); // Navigates to the "next-page"
//   };

//   return (
//     <div>
//       <h1>Home Page</h1>
//       <button onClick={navigateToPage}>Go to Next Page</button>
//     </div>
//   );
// };

// export default HomePage;
