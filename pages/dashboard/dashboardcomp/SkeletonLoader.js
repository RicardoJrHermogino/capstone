// components/dashboardcomp/SkeletonLoader.js
import React from 'react';
import { Grid, Box, Skeleton } from '@mui/material';

const SkeletonLoader = () => {
  return (
    <Grid container spacing={3}>
      {/* Weather Display Skeleton */}
      <Grid item xs={12}>
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="text" width={150} height={30} />
            <Skeleton variant="circular" width={60} height={60} />
          </Box>
          <Skeleton variant="text" width="60%" height={40} />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Skeleton variant="text" width={100} height={24} />
            <Skeleton variant="text" width={100} height={24} />
          </Box>
        </Box>
      </Grid>

      {/* Recommended Task Skeleton */}
      <Grid item xs={12}>
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Skeleton variant="text" width="70%" height={32} sx={{ mb: 2 }} />
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width="100%" height={24} />
            <Skeleton variant="text" width="90%" height={24} />
            <Skeleton variant="text" width="80%" height={24} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: '12px' }} />
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: '12px' }} />
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default SkeletonLoader;