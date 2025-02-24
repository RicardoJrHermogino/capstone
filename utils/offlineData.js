// import { Capacitor } from '@capacitor/core';
// import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
// import { Preferences } from '@capacitor/preferences';
// import API_BASE_URL from '@/config/apiConfig';
// import { getDatabaseConnection } from '@/utils/sqliteService';  // Import the getDatabaseConnection function



// export const initDatabase = async () => {
//   try {
//     // Check platform and provide appropriate handling
//     const platform = Capacitor.getPlatform();
//     console.log('Current platform:', platform);

//     // Specifically check for Android
//     if (platform === 'android') {
//       const db = await getDatabaseConnection();
      

//       // Then attempt to delete the existing connection
     
//      console.log('Database initialized successfully!');

//       // Create tables
//       await db.execute(
//         `CREATE TABLE IF NOT EXISTS coconut_tasks (
//           task_id INTEGER PRIMARY KEY AUTOINCREMENT,
//           task_name TEXT NOT NULL,
//           weatherRestrictions TEXT,
//           details TEXT,
//           requiredTemperature_min INTEGER,
//           requiredTemperature_max INTEGER,
//           idealHumidity_min INTEGER,
//           idealHumidity_max INTEGER,
//           requiredWindSpeed_max INTEGER,
//           requiredWindGust_max INTEGER,
//           requiredCloudCover_max INTEGER,
//           requiredPressure_min INTEGER,
//           requiredPressure_max INTEGER,
//           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         );`
//       );

//       await db.execute(
//         `CREATE TABLE IF NOT EXISTS forecast_data (
//           weather_data_id INTEGER PRIMARY KEY AUTOINCREMENT,
//           location TEXT,
//           lat REAL,
//           lon REAL,
//           date DATE,
//           time TIME,
//           temperature REAL,
//           weather_id INTEGER,
//           pressure INTEGER,
//           humidity INTEGER,
//           clouds INTEGER,
//           wind_speed REAL,
//           wind_gust REAL,
//           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//           pop DECIMAL(5,2),
//           rain_3h DECIMAL(6,2)
//         );`
//       );

//       await db.execute(
//         `CREATE TABLE IF NOT EXISTS scheduled_tasks (
//           sched_id INTEGER PRIMARY KEY AUTOINCREMENT,
//           task_id INTEGER NOT NULL,
//           device_id TEXT NOT NULL,
//           location TEXT NOT NULL,
//           lat DECIMAL(10,8) NOT NULL,
//           lon DECIMAL(11,8) NOT NULL,
//           date DATE NOT NULL,
//           time TIME NOT NULL,
//           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         );`
//       );

//       console.log('SQLite tables created successfully!');

//       // Fetch MySQL data and store it in SQLite
//       await fetchAndStoreData(db);

//       return db;
//     }
//     else {
//       console.error('Database initialization is only supported on Android');
//       return null;
//     }
//   } catch (error) {
//     console.error('Detailed error initializing database:', {
//       name: error.name,
//       message: error.message,
//       stack: error.stack
//     });
//     return null;
//   }
// };

// // Function to fetch MySQL data and insert into SQLite
// const fetchAndStoreData = async (db) => {
//   try {
//     console.log('Starting data fetch process');
//     const { value: userId } = await Preferences.get({ key: 'userId' });
    
//     if (!userId) {
//       console.error('No userId found in Preferences');
//       throw new Error('No user ID found');
//     }

//     console.log(`Fetching data for deviceId: ${userId}`);

//     // Fetch and validate coconut tasks
//     const coconutTasksResponse = await fetch(`${API_BASE_URL}/api/coconut_tasks`);
//     if (!coconutTasksResponse.ok) {
//       throw new Error(`HTTP error! status: ${coconutTasksResponse.status}`);
//     }
    
//     const coconutTasksData = await coconutTasksResponse.json();
//     const coconutTasks = Array.isArray(coconutTasksData.coconut_tasks) ? coconutTasksData.coconut_tasks : [];
    
//     if (coconutTasks.length === 0) {
//       console.warn('No coconut tasks data received');
//     }

//     // Clear existing data before inserting new data
//     await db.execute('DELETE FROM coconut_tasks');

//     for (const task of coconutTasks) {
//       try {
//         await db.run(
//           `INSERT INTO coconut_tasks (task_id, task_name, weatherRestrictions, details, 
//             requiredTemperature_min, requiredTemperature_max, idealHumidity_min, 
//             idealHumidity_max, requiredWindSpeed_max, requiredWindGust_max, 
//             requiredCloudCover_max, requiredPressure_min, requiredPressure_max, 
//             created_at, updated_at) 
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
//           [
//             task.task_id || null,
//             task.task_name || '',
//             task.weatherRestrictions || '',
//             task.details || '',
//             task.requiredTemperature_min || null,
//             task.requiredTemperature_max || null,
//             task.idealHumidity_min || null,
//             task.idealHumidity_max || null,
//             task.requiredWindSpeed_max || null,
//             task.requiredWindGust_max || null,
//             task.requiredCloudCover_max || null,
//             task.requiredPressure_min || null,
//             task.requiredPressure_max || null,
//             task.created_at || new Date().toISOString(),
//             task.updated_at || new Date().toISOString()
//           ]
//         );
//       } catch (insertError) {
//         console.error(`Error inserting coconut task:`, insertError);
//       }
//     }

//     console.log('Coconut Tasks Data Synced Successfully!');

//     // Fetch and validate forecast data
//     const forecastResponse = await fetch(`${API_BASE_URL}/api/getWeatherData`);
//     if (!forecastResponse.ok) {
//       throw new Error(`HTTP error! status: ${forecastResponse.status}`);
//     }

//     const forecastDataResponse = await forecastResponse.json();
//     const forecastData = Array.isArray(forecastDataResponse) ? forecastDataResponse : [];

//     if (forecastData.length === 0) {
//       console.warn('No forecast data received');
//     }

//     // Clear existing forecast data
//     await db.execute('DELETE FROM forecast_data');

//     for (const forecast of forecastData) {
//       try {
//         await db.run(
//           `INSERT INTO forecast_data (weather_data_id, location, lat, lon, date, 
//             time, temperature, weather_id, pressure, humidity, clouds, wind_speed, 
//             wind_gust, created_at, pop, rain_3h) 
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
//           [
//             forecast.weather_data_id || null,
//             forecast.location || '',
//             forecast.lat || null,
//             forecast.lon || null,
//             forecast.date || null,
//             forecast.time || null,
//             forecast.temperature || null,
//             forecast.weather_id || null,
//             forecast.pressure || null,
//             forecast.humidity || null,
//             forecast.clouds || null,
//             forecast.wind_speed || null,
//             forecast.wind_gust || null,
//             forecast.created_at || new Date().toISOString(),
//             forecast.pop || null,
//             forecast.rain_3h || null
//           ]
//         );
//       } catch (insertError) {
//         console.error(`Error inserting forecast record:`, insertError);
//       }
//     }

//     console.log('Forecast Data Synced Successfully!');

//     // Fetch and validate scheduled tasks
//     const scheduledTasksResponse = await fetch(`${API_BASE_URL}/api/getScheduledTasks?deviceId=${userId}`);
//     if (!scheduledTasksResponse.ok) {
//       throw new Error(`HTTP error! status: ${scheduledTasksResponse.status}`);
//     }

//     const scheduledTasksData = await scheduledTasksResponse.json();
//     const scheduledTasks = Array.isArray(scheduledTasksData) ? scheduledTasksData : [];

//     if (scheduledTasks.length === 0) {
//       console.warn('No scheduled tasks data received');
//     }

//     // Clear existing scheduled tasks
//     await db.execute('DELETE FROM scheduled_tasks');

//     for (const task of scheduledTasks) {
//       try {
//         await db.run(
//           `INSERT INTO scheduled_tasks (sched_id, task_id, device_id, location, 
//             lat, lon, date, time, created_at) 
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
//           [
//             task.sched_id || null,
//             task.task_id || null,
//             task.device_id || '',
//             task.location || '',
//             task.lat || null,
//             task.lon || null,
//             task.date || null,
//             task.time || null,
//             task.created_at || new Date().toISOString()
//           ]
//         );
//       } catch (insertError) {
//         console.error(`Error inserting scheduled task:`, insertError);
//       }
//     }

//     console.log('Scheduled Tasks Data Synced Successfully!');
//   } catch (error) {
//     console.error('Error in fetchAndStoreData:', error);
//     throw error; // Re-throw the error to be handled by the calling function
//   }
// };




import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import API_BASE_URL from '@/config/apiConfig';

// Storage keys
const STORAGE_KEYS = {
  COCONUT_TASKS: 'coconut_tasks',
  FORECAST_DATA: 'forecast_data',
  SCHEDULED_TASKS: 'scheduled_tasks',
  USER_ID: 'userId'
};

export const initStorage = async () => {
  try {
    const platform = Capacitor.getPlatform();
    console.log('Current platform:', platform);

    // Initialize by fetching and storing all data
    await fetchAndStoreData();
    console.log('Storage initialized successfully!');
    return true;
  } catch (error) {
    console.error('Error initializing storage:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};

// Function to fetch and store data using Preferences
const fetchAndStoreData = async () => {
  try {
    console.log('Starting data fetch process');
    const { value: userId } = await Preferences.get({ key: STORAGE_KEYS.USER_ID });
    
    if (!userId) {
      console.error('No userId found in Preferences');
      throw new Error('No user ID found');
    }

    console.log(`Fetching data for deviceId: ${userId}`);

    // Fetch and store coconut tasks
    const coconutTasksResponse = await fetch(`${API_BASE_URL}/api/coconut_tasks`);
    if (!coconutTasksResponse.ok) {
      throw new Error(`HTTP error! status: ${coconutTasksResponse.status}`);
    }
    
    const coconutTasksData = await coconutTasksResponse.json();
    const coconutTasks = Array.isArray(coconutTasksData.coconut_tasks) ? coconutTasksData.coconut_tasks : [];
    
    await Preferences.set({
      key: STORAGE_KEYS.COCONUT_TASKS,
      value: JSON.stringify(coconutTasks)
    });
    console.log('Coconut Tasks Data Synced Successfully!');

    // Fetch and store forecast data
    const forecastResponse = await fetch(`${API_BASE_URL}/api/getWeatherData`);
    if (!forecastResponse.ok) {
      throw new Error(`HTTP error! status: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();
    await Preferences.set({
      key: STORAGE_KEYS.FORECAST_DATA,
      value: JSON.stringify(forecastData)
    });
    console.log('Forecast Data Synced Successfully!');

    // Fetch and store scheduled tasks
    const scheduledTasksResponse = await fetch(`${API_BASE_URL}/api/getScheduledTasks?deviceId=${userId}`);
    if (!scheduledTasksResponse.ok) {
      throw new Error(`HTTP error! status: ${scheduledTasksResponse.status}`);
    }

    const scheduledTasks = await scheduledTasksResponse.json();
    await Preferences.set({
      key: STORAGE_KEYS.SCHEDULED_TASKS,
      value: JSON.stringify(scheduledTasks)
    });
    console.log('Scheduled Tasks Data Synced Successfully!');
  } catch (error) {
    console.error('Error in fetchAndStoreData:', error);
    throw error;
  }
};