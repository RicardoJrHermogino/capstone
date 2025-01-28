// File: components/TaskLoadingPlaceholder.tsx
import React from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Skeleton 
} from '@mui/material';

export const TaskLoadingPlaceholder = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Grid container spacing={2}>
        {[1, 2, 3].map((_, index) => (
          <Grid item xs={12} key={index}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={40} />
                <Skeleton variant="text" width="40%" />
                {[1, 2].map((_, taskIndex) => (
                  <Skeleton 
                    key={taskIndex}
                    variant="rectangular" 
                    height={60} 
                    sx={{ mt: 2, borderRadius: 2 }} 
                  />
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};


export default TaskLoadingPlaceholder;