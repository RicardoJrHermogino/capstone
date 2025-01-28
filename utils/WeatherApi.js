class WeatherAPI {
    constructor(apiKey) {
      this.apiKey = apiKey;
    }
  
    async fetchWeatherData(lat, lon, location) {
      console.log(`Fetching 5-day forecast for ${location} at lat: ${lat}, lon: ${lon}`);
      
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );
  
      if (!forecastResponse.ok) {
        throw new Error(`Failed to fetch forecast data for ${location}`);
      }
  
      const data = await forecastResponse.json();
  
      // Process and structure the forecast data
      return data.list.map(item => {
        const date = new Date(item.dt * 1000);
        return {
          location,
          lat,
          lon,
          date: date.toISOString().split('T')[0],  // ISO date in YYYY-MM-DD format
          time: date.toISOString().split('T')[1].slice(0, 5),  // ISO time in HH:MM format (UTC)
          temperature: item.main.temp,
          weather_id: item.weather[0].id,
          pressure: item.main.pressure,
          humidity: item.main.humidity,
          clouds: item.clouds.all,
          wind_speed: item.wind.speed,
          wind_gust: item.wind.gust || null,
          pop: item.pop || null,  
          rain_3h: item.rain ? item.rain['3h'] || null : null, 
        };
      });
    }
  }
  
  export default WeatherAPI;
  