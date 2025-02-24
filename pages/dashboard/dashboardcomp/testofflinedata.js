// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/router';
// import { Capacitor } from '@capacitor/core';
// import { Preferences } from '@capacitor/preferences';
// import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Card, CardContent, AppBar, Toolbar, IconButton, Button } from '@mui/material';
// import MenuIcon from '@mui/icons-material/Menu';
// import { getDatabaseConnection } from '@/utils/sqliteService';  // Import the getDatabaseConnection function
// import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';


// const ForecastPage = () => {
//   const [forecastData, setForecastData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//     const router = useRouter();
  

//   useEffect(() => {
//     const fetchForecastData = async () => {
//       const { value: isDataDownloaded } = await Preferences.get({ key: 'offlineDataDownloaded' });

//       if (!isDataDownloaded) {
//         setError('Please download offline data first');
//         setLoading(false);
//         return;
//       }

//       if (Capacitor.getPlatform() !== 'web') {
//         try {
//           // Get database connection using the service
//           const db = await getDatabaseConnection();

//           // Query only the forecast data
//           const forecastResult = await db.query('SELECT * FROM forecast_data');

//           if (forecastResult.values?.length > 0) {
//             setForecastData(forecastResult.values);
//             console.log('Forecast Data:', forecastResult.values);
//           }
//         } catch (error) {
//           console.error('Error fetching data:', error);
//           setError(`Error fetching data: ${error.message}`);
//         } finally {
//           setLoading(false);
//         }
//       } else {
//         setError('SQLite not supported on web platform');
//         setLoading(false);
//       }
//     };

//     fetchForecastData();

//   }, []);

//   if (loading) {
//     return <Box p={4}>Loading...</Box>;
//   }

//   if (error) {
//     return <Box p={4} sx={{ color: 'error.main' }}>Error: {error}</Box>;
//   }

//   const handleCoconutClick = () => {
//     router.push('/dashboard/dashboardcomp/coco_taksoffline');
//   };
  

//   return (
// <>
//     <IconButton 
//     onClick={() => router.back()}
//     sx={{
//       color: 'text.secondary',
//       bgcolor: 'rgba(0,0,0,0.05)',
//       mr: 2,
//       '&:hover': {
//         bgcolor: 'rgba(0,0,0,0.1)'
//       }
//     }}
//   >
//     <ArrowBackIosNewIcon />
//   </IconButton>

//   <Button onClick={handleCoconutClick}>Go to tasks</Button>
//     <Box p={4}>
//       <AppBar position="sticky">
//         <Toolbar>
//           <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
//             <MenuIcon />
//           </IconButton>
//           <Typography variant="h6" sx={{ flexGrow: 1 }}>
//             Weather Forecast
//           </Typography>
//         </Toolbar>
//       </AppBar>

      

//       <Card sx={{ mt: 2 }}>
//         <CardContent>
//           <Typography variant="h6" gutterBottom>Weather Forecast Data</Typography>
//           <TableContainer component={Paper}>
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell>Weather Data ID</TableCell>
//                   <TableCell>Location</TableCell>
//                   <TableCell>Latitude</TableCell>
//                   <TableCell>Longitude</TableCell>
//                   <TableCell>Date</TableCell>
//                   <TableCell>Time</TableCell>
//                   <TableCell>Temperature</TableCell>
//                   <TableCell>Weather ID</TableCell>
//                   <TableCell>Pressure</TableCell>
//                   <TableCell>Humidity</TableCell>
//                   <TableCell>Clouds</TableCell>
//                   <TableCell>Wind Speed</TableCell>
//                   <TableCell>Wind Gust</TableCell>
//                   <TableCell>Created At</TableCell>
//                   <TableCell>Probability of Precipitation (POP)</TableCell>
//                   <TableCell>Rain in Last 3 Hours</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {forecastData.map((data, index) => (
//                   <TableRow key={index} hover>
//                     <TableCell>{data.weather_data_id}</TableCell>
//                     <TableCell>{data.location}</TableCell>
//                     <TableCell>{data.lat}</TableCell>
//                     <TableCell>{data.lon}</TableCell>
//                     <TableCell>{data.date}</TableCell>
//                     <TableCell>{data.time}</TableCell>
//                     <TableCell>{data.temperature}°C</TableCell>
//                     <TableCell>{data.weather_id}</TableCell>
//                     <TableCell>{data.pressure} hPa</TableCell>
//                     <TableCell>{data.humidity}%</TableCell>
//                     <TableCell>{data.clouds}%</TableCell>
//                     <TableCell>{data.wind_speed} m/s</TableCell>
//                     <TableCell>{data.wind_gust} m/s</TableCell>
//                     <TableCell>{data.created_at}</TableCell>
//                     <TableCell>{data.pop}%</TableCell>
//                     <TableCell>{data.rain_3h} mm</TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         </CardContent>

//         {forecastData.length > 0 && (
//           <Box p={4}>
//             <Typography variant="h6">Preview of Forecast Data Structure</Typography>
//             <pre>{JSON.stringify(forecastData[0], null, 2)}</pre>
//           </Box>
//         )}
//       </Card>
//     </Box>
//     </>
//   );
// };

// export default ForecastPage;



import { useEffect, useState } from 'react';
import { Box, Button, Typography, Card, CardContent, CircularProgress, Divider, IconButton } from '@mui/material';
import { Preferences } from '@capacitor/preferences';
import { initStorage } from '@/utils/offlineData';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useRouter } from 'next/router';



// Storage keys
const STORAGE_KEYS = {
  COCONUT_TASKS: 'coconut_tasks',
  FORECAST_DATA: 'forecast_data',
  SCHEDULED_TASKS: 'scheduled_tasks'
};

const fetchDataFromPreferences = async (key) => {
  try {
    const result = await Preferences.get({ key });
    return result.value ? JSON.parse(result.value) : [];
  } catch (error) {
    console.error(`Error fetching ${key} from Preferences:`, error);
    return [];
  }
};

export default function DataDisplay() {
  const [coconutTasks, setCoconutTasks] = useState([]);
  const [forecastData, setForecastData] = useState({});
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
  

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from Preferences
      const coconutTasksData = await fetchDataFromPreferences(STORAGE_KEYS.COCONUT_TASKS);
      const forecastData = await fetchDataFromPreferences(STORAGE_KEYS.FORECAST_DATA);
      const scheduledTasksData = await fetchDataFromPreferences(STORAGE_KEYS.SCHEDULED_TASKS);
      
      setCoconutTasks(coconutTasksData);
      setForecastData(forecastData);
      setScheduledTasks(scheduledTasksData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error loading data from Preferences: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Initialize storage and fetch new data
      const success = await initStorage();
      if (!success) {
        throw new Error('Failed to initialize storage');
      }
      
      // Reload the data after refresh
      await loadData();
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error refreshing data: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>

<IconButton 
          onClick={() => router.back()}
          sx={{
            color: 'text.secondary',
            bgcolor: 'rgba(0,0,0,0.05)',
            mr: 2,
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.1)'
            }
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
      <Typography variant="h4" align="center" gutterBottom>
        Offline Data Display
      </Typography>

      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleRefreshData} 
        disabled={refreshing}
        sx={{ mb: 3, display: 'block', mx: 'auto' }}
      >
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </Button>

      {error && (
        <Typography color="error" variant="body1" align="center" sx={{ mb: 3, p: 2, bgcolor: '#ffebee' }}>
          {error}
        </Typography>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5">Coconut Tasks</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
            {coconutTasks.length === 0 ? (
              <Typography color="text.secondary">No Coconut Tasks available</Typography>
            ) : (
              coconutTasks.map((task, index) => (
                <Typography key={index} sx={{ py: 1 }}>{JSON.stringify(task, null, 2)}</Typography>
              ))
            )}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5">Forecast Data</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
            {Object.keys(forecastData).length === 0 ? (
              <Typography color="text.secondary">No forecast data available</Typography>
            ) : (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(forecastData, null, 2)}
              </pre>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5">Scheduled Tasks</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
            {scheduledTasks.length === 0 ? (
              <Typography color="text.secondary">No Scheduled Tasks available</Typography>
            ) : (
              scheduledTasks.map((task, index) => (
                <Typography key={index} sx={{ py: 1 }}>{JSON.stringify(task, null, 2)}</Typography>
              ))
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}