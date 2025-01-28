import mysql from 'mysql2/promise';

class WeatherData {
  constructor(dbConfig) {
    this.dbConfig = dbConfig;
  }

  async connect() {
    return await mysql.createConnection(this.dbConfig);
  }

  async clearAndInsertWeatherData(weatherData) {
    const connection = await this.connect();

    try {
      // First, delete existing weather data from the table
      const deleteQuery = 'DELETE FROM forecast_data';
      await connection.query(deleteQuery);
      console.log('Existing weather data cleared.');

      // Now insert the new weather data
      const insertQuery = `
        INSERT INTO forecast_data 
        (location, lat, lon, date, time, temperature, weather_id, pressure, humidity, clouds, wind_speed, wind_gust, pop, rain_3h)
        VALUES ?
      `;
      
      const values = weatherData.map(item => [
        item.location,
        item.lat,
        item.lon,
        item.date,
        item.time,
        item.temperature,
        item.weather_id,
        item.pressure,
        item.humidity,
        item.clouds,
        item.wind_speed,
        item.wind_gust || null,
        item.pop || null,
        item.rain_3h || null,
      ]);

      const [result] = await connection.query(insertQuery, [values]);
      console.log('Insert result:', result);  // Log the result of the insertion
    } catch (error) {
      console.error('Error handling weather data:', error);
    } finally {
      await connection.end();
    }
  }
}

export default WeatherData;
