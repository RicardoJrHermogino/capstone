import { useEffect, useState } from 'react';
import { SQLiteConnection, CapacitorSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const ForecastPage = () => {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForecastData = async () => {
      // Check if data has been downloaded
      const { value: isDataDownloaded } = await Preferences.get({ key: 'offlineDataDownloaded' });
      
      if (!isDataDownloaded) {
        setError('Please download offline data first');
        setLoading(false);
        return;
      }

      if (Capacitor.getPlatform() !== 'web') {
        const sqliteConnection = new SQLiteConnection(CapacitorSQLite);

        try {
          // Explicit connection closing and deletion
          try {
            await sqliteConnection.closeConnection('offline_db');
            console.log('Existing connection closed successfully');
          } catch (closeError) {
            console.warn('Error closing existing connection:', closeError);
          }

          try {
            await sqliteConnection.deleteConnection('offline_db');
            console.log('Existing connection deleted successfully');
          } catch (deleteError) {
            console.warn('Error deleting existing connection:', deleteError);
          }

          // Create new connection
          const db = await sqliteConnection.createConnection(
            'offline_db', 
            false, 
            'no-encryption', 
            1,
            false
          );

          await db.open();

          // Add a count check first
          const countResult = await db.query('SELECT COUNT(*) as count FROM forecast_data');
          const dataCount = countResult.values[0].count;

          if (dataCount === 0) {
            setError('No forecast data available. Please re-download.');
            await sqliteConnection.closeConnection('offline_db');
            setLoading(false);
            return;
          }

          // Fetch data from the forecast_data table
          const result = await db.query('SELECT * FROM forecast_data');

          if (result.values && result.values.length > 0) {
            setForecastData(result.values);
          } else {
            setError('No forecast data available');
          }

          await sqliteConnection.closeConnection('offline_db');
        } catch (error) {
          console.error('Detailed error fetching forecast data:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          setError(`Error fetching forecast data: ${error.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        setError('SQLite not supported on web platform');
        setLoading(false);
      }
    };

    fetchForecastData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Forecast Data</h1>
      <table>
        <thead>
          <tr>
            <th>Location</th>
            <th>Date</th>
            <th>Time</th>
            <th>Temperature</th>
            <th>Pressure</th>
            <th>Humidity</th>
            <th>Clouds</th>
            <th>Wind Speed</th>
            <th>Wind Gust</th>
          </tr>
        </thead>
        <tbody>
          {forecastData.map((data, index) => (
            <tr key={index}>
              <td>{data.location}</td>
              <td>{data.date}</td>
              <td>{data.time}</td>
              <td>{data.temperature}°C</td>
              <td>{data.pressure} hPa</td>
              <td>{data.humidity} %</td>
              <td>{data.clouds} %</td>
              <td>{data.wind_speed} m/s</td>
              <td>{data.wind_gust} m/s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ForecastPage;