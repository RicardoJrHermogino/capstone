import { useEffect, useState } from 'react';
import { SQLiteConnection, CapacitorSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { 
  Card, 
  CardContent, 
  Tabs, 
  Tab, 
  Box, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

const ForecastPage = () => {
  const [forecastData, setForecastData] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [coconutTasks, setCoconutTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchAllData = async () => {
      const { value: isDataDownloaded } = await Preferences.get({ key: 'offlineDataDownloaded' });
      
      if (!isDataDownloaded) {
        setError('Please download offline data first');
        setLoading(false);
        return;
      }

      if (Capacitor.getPlatform() !== 'web') {
        const sqliteConnection = new SQLiteConnection(CapacitorSQLite);

        try {
          try {
            await sqliteConnection.closeConnection('offline_db');
          } catch (closeError) {
            console.warn('Error closing existing connection:', closeError);
          }

          try {
            await sqliteConnection.deleteConnection('offline_db');
          } catch (deleteError) {
            console.warn('Error deleting existing connection:', deleteError);
          }

          const db = await sqliteConnection.createConnection(
            'offline_db', 
            false, 
            'no-encryption', 
            1,
            false
          );

          await db.open();

          const forecastResult = await db.query('SELECT * FROM forecast_data');
          const scheduledResult = await db.query('SELECT * FROM scheduled_tasks');
          const coconutResult = await db.query('SELECT * FROM coconut_tasks');

          if (forecastResult.values?.length > 0) {
            setForecastData(forecastResult.values);
          }
          
          if (scheduledResult.values?.length > 0) {
            setScheduledTasks(scheduledResult.values);
          }
          
          if (coconutResult.values?.length > 0) {
            setCoconutTasks(coconutResult.values);
          }

          await sqliteConnection.closeConnection('offline_db');
        } catch (error) {
          console.error('Error fetching data:', error);
          setError(`Error fetching data: ${error.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        setError('SQLite not supported on web platform');
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return <Box p={4}>Loading...</Box>;
  }

  if (error) {
    return <Box p={4} sx={{ color: 'error.main' }}>Error: {error}</Box>;
  }

  return (
    <Box p={4}>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Weather Forecast" />
        <Tab label="Scheduled Tasks" />
        <Tab label="Coconut Tasks" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Weather Forecast Data</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Location</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Temperature</TableCell>
                    <TableCell>Pressure</TableCell>
                    <TableCell>Humidity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {forecastData.map((data, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{data.location}</TableCell>
                      <TableCell>{data.date}</TableCell>
                      <TableCell>{data.time}</TableCell>
                      <TableCell>{data.temperature}°C</TableCell>
                      <TableCell>{data.pressure} hPa</TableCell>
                      <TableCell>{data.humidity}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Scheduled Tasks</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task ID</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scheduledTasks.map((task, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{task.task_id}</TableCell>
                      <TableCell>{task.location}</TableCell>
                      <TableCell>{task.date}</TableCell>
                      <TableCell>{task.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Coconut Tasks</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task Name</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Temperature Range</TableCell>
                    <TableCell>Humidity Range</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coconutTasks.map((task, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{task.task_name}</TableCell>
                      <TableCell>{task.details}</TableCell>
                      <TableCell>{task.requiredTemperature_min}°C - {task.requiredTemperature_max}°C</TableCell>
                      <TableCell>{task.idealHumidity_min}% - {task.idealHumidity_max}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

// Helper component for tab panels
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
};

export default ForecastPage;