import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Preferences } from '@capacitor/preferences';
import API_BASE_URL from '@/config/apiConfig';

const sqliteConnection = new SQLiteConnection(CapacitorSQLite);

export const initDatabase = async () => {
  try {
    // Check platform and provide appropriate handling
    const platform = Capacitor.getPlatform();
    console.log('Current platform:', platform);

    // Specifically check for Android
    if (platform === 'android') {
      // First, try to close any existing connection
      try {
        await sqliteConnection.closeConnection('offline_db');
        console.log('Existing connection closed successfully');
      } catch (closeError) {
        console.warn('Error closing existing connection:', closeError);
      }

      // Then attempt to delete the existing connection
      try {
        await sqliteConnection.deleteConnection('offline_db');
        console.log('Existing connection deleted successfully');
      } catch (deleteError) {
        console.warn('Error deleting existing connection:', deleteError);
      }


     // Now create a new connection
     const db = await sqliteConnection.createConnection('offline_db', false, 'no-encryption', 1);
     await db.open();

     console.log('Database initialized successfully!');

      // // Create tables
      // await db.execute(
      //   `CREATE TABLE IF NOT EXISTS coconut_tasks (
      //     task_id INTEGER PRIMARY KEY AUTOINCREMENT,
      //     task_name TEXT NOT NULL,
      //     weatherRestrictions TEXT,
      //     details TEXT,
      //     requiredTemperature_min INTEGER,
      //     requiredTemperature_max INTEGER,
      //     idealHumidity_min INTEGER,
      //     idealHumidity_max INTEGER,
      //     requiredWindSpeed_max INTEGER,
      //     requiredWindGust_max INTEGER,
      //     requiredCloudCover_max INTEGER,
      //     requiredPressure_min INTEGER,
      //     requiredPressure_max INTEGER,
      //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      //     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      //   );`
      // );

      await db.execute(
        `CREATE TABLE IF NOT EXISTS forecast_data (
          weather_data_id INTEGER PRIMARY KEY AUTOINCREMENT,
          location TEXT,
          lat REAL,
          lon REAL,
          date DATE,
          time TIME,
          temperature REAL,
          weather_id INTEGER,
          pressure INTEGER,
          humidity INTEGER,
          clouds INTEGER,
          wind_speed REAL,
          wind_gust REAL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          pop DECIMAL(5,2),
          rain_3h DECIMAL(6,2)
        );`
      );

      // await db.execute(
      //   `CREATE TABLE IF NOT EXISTS scheduled_tasks (
      //     sched_id INTEGER PRIMARY KEY AUTOINCREMENT,
      //     task_id INTEGER NOT NULL,
      //     device_id TEXT NOT NULL,
      //     location TEXT NOT NULL,
      //     lat DECIMAL(10,8) NOT NULL,
      //     lon DECIMAL(11,8) NOT NULL,
      //     date DATE NOT NULL,
      //     time TIME NOT NULL,
      //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      //   );`
      // );

      console.log('SQLite tables created successfully!');

      // Fetch MySQL data and store it in SQLite
      await fetchAndStoreData(db);

      return db;
    }
    else {
      console.error('Database initialization is only supported on Android');
      return null;
    }
  } catch (error) {
    console.error('Detailed error initializing database:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return null;
  }
};

// Function to fetch MySQL data and insert into SQLite
const fetchAndStoreData = async (db) => {
  try {
    console.log('Starting data fetch process');
    const { value: userId } = await Preferences.get({ key: 'userId' });
    
    if (!userId) {
      console.error('No userId found in Preferences');
      throw new Error('No user ID found');
    }

    console.log(`Fetching data for deviceId: ${userId}`);

    // const coconutTasksResponse = await fetch(`${API_BASE_URL}/api/coconut_tasks`);
    // const coconutTasks = await coconutTasksResponse.json();

    // for (const task of coconutTasks) {
    //   await db.run(
    //     `INSERT INTO coconut_tasks (task_id, task_name, weatherRestrictions, details, requiredTemperature_min, requiredTemperature_max, idealHumidity_min, idealHumidity_max, requiredWindSpeed_max, requiredWindGust_max, requiredCloudCover_max, requiredPressure_min, requiredPressure_max, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    //     [
    //       task.task_id, task.task_name, task.weatherRestrictions, task.details,
    //       task.requiredTemperature_min, task.requiredTemperature_max,
    //       task.idealHumidity_min, task.idealHumidity_max,
    //       task.requiredWindSpeed_max, task.requiredWindGust_max,
    //       task.requiredCloudCover_max, task.requiredPressure_min,
    //       task.requiredPressure_max, task.created_at, task.updated_at
    //     ]
    //   );
    // }

    // console.log('Coconut Tasks Data Synced Successfully!');

    const forecastResponse = await fetch(`${API_BASE_URL}/api/getWeatherData`);
    
    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      console.error('Error response text:', errorText);
      throw new Error(`HTTP error! status: ${forecastResponse.status}, message: ${errorText}`);
    }

    const forecastData = await forecastResponse.json();
    console.log(`Fetched ${forecastData.length} forecast records`);

    // Clear existing data before inserting new data
    await db.execute('DELETE FROM forecast_data');

    for (const forecast of forecastData) {
      try {
        await db.run(
          `INSERT INTO forecast_data (weather_data_id, location, lat, lon, date, time, temperature, weather_id, pressure, humidity, clouds, wind_speed, wind_gust, created_at, pop, rain_3h) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            forecast.weather_data_id, forecast.location, forecast.lat, forecast.lon, forecast.date, forecast.time,
            forecast.temperature, forecast.weather_id, forecast.pressure, forecast.humidity,
            forecast.clouds, forecast.wind_speed, forecast.wind_gust, forecast.created_at, forecast.pop, forecast.rain_3h
          ]
        );
      } catch (insertError) {
        console.error(`Error inserting forecast record:`, insertError);
      }
    }

    console.log('Forecast Data Synced Successfully!');

    // const scheduledTasksResponse = await fetch(`${API_BASE_URL}/api/getScheduledTasks?deviceId=${userId}`);
    // const scheduledTasks = await scheduledTasksResponse.json();

    // for (const task of scheduledTasks) {
    //   await db.run(
    //     `INSERT INTO scheduled_tasks (sched_id, task_id, device_id, location, lat, lon, date, time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    //     [
    //       task.sched_id, task.task_id, task.device_id, task.location,
    //       task.lat, task.lon, task.date, task.time, task.created_at
    //     ]
    //   );
    // }

    // console.log('Scheduled Tasks Data Synced Successfully!');
  } catch (error) {
    console.error('Error fetching and storing data:', error);
  }
};
