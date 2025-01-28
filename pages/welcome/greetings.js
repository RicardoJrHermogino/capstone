import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, CssBaseline, Box, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Image from "next/image";
import { useRouter } from 'next/router';

const WelcomeGreetings = () => {
  const [isClient, setIsClient] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsClient(true); // Set isClient to true once the component mounts
  }, []);

  const handleGetStartedClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.push('/welcome/finalwelcome');
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
        {isClient && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isExiting ? { x: -1000, opacity: 0 } : { opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
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
                    Efficiently Plan Your Coconut Farm Tasks
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
                      width: {
                        xs: 280,
                        sm: 340,
                        md: 400
                      },
                      height: {
                        xs: 280,
                        sm: 340,
                        md: 400
                      },
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
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
                      src="/image/coconutgraphic.svg" 
                      alt="sample" 
                      width={400}
                      height={400}
                      style={{
                        objectFit: 'contain',
                        width: '100%',
                        height: '100%'
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
                    Next
                  </Button>
                </Stack>
              </Stack>
            </motion.div>
          </AnimatePresence>
        )}
      </Container>
    </>
  );
};

export default WelcomeGreetings;