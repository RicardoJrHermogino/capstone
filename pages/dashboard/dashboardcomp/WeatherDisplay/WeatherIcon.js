// src/utils/weatherIcon.js
import dayjs from 'dayjs';

// Function to determine if it's night time based on weather ID and time
export const isNightTime = (date, time, isCurrentWeather, weatherId) => {
  if (weatherId === null || weatherId === undefined) {
    return false;
  }

  if (isCurrentWeather) {
    const currentHour = dayjs().hour();
    return currentHour < 6 || currentHour >= 18;
  }

  if (!date || !time) return false;
  const dateTime = dayjs(`${date} ${time}`);
  if (!dateTime.isValid()) return false;
  const hour = dateTime.hour();
  return hour < 6 || hour >= 18;
};

// Function to get the weather icon based on conditions and whether it's day or night
export const getWeatherIcon = (weatherId, selectedDate, selectedTime, isCurrentWeather) => {
    if (weatherId === null || weatherId === undefined) {
      return "/3d-weather-icons/default/01.png"; // Default icon
    }
  
    const nightTime = isNightTime(selectedDate, selectedTime, isCurrentWeather, weatherId);
  
    switch (weatherId) {
      // Clear Sky
      case 800:
        return nightTime ? "/3d-weather-icons/moon/10.png" : "/3d-weather-icons/sun/26.png";
      
      // Clouds
      case 801:  // Few clouds
      case 802:  // Scattered clouds
      case 803:  // Broken clouds
        return nightTime ? "/3d-weather-icons/moon/23.png" : "/3d-weather-icons/sun/23.png";
      case 804:  // Overcast clouds
        return "/3d-weather-icons/cloud/35.png";
      
      // Rain
      case 500:  // Light rain
        return nightTime ? "/3d-weather-icons/moon/1.png" : "/3d-weather-icons/sun/8.png";
      case 501:  // Moderate rain
        return nightTime ? "/3d-weather-icons/moon/1.png" : "/3d-weather-icons/sun/sunmodrain.png";
      case 502:  // Heavy rain
      case 503:  // Very heavy rain
      case 504:  // Extreme rain
      case 511:  // Freezing rain
      case 520:  // Light intensity shower rain
      case 521:  // Shower rain
      case 522:  // Heavy intensity shower rain
      case 531:  // Ragged shower rain
        return "/3d-weather-icons/rain/39.png";
      
      // Thunderstorm
      case 200:  // Thunderstorm with light rain
      case 201:  // Thunderstorm with rain
      case 202:  // Thunderstorm with heavy rain
      case 210:  // Light thunderstorm
      case 211:  // Thunderstorm
      case 212:  // Heavy thunderstorm
      case 221:  // Ragged thunderstorm
      case 230:  // Thunderstorm with hail
      case 231:  // Thunderstorm with hail (light)
      case 232:  // Thunderstorm with hail (heavy)
        return nightTime ? "/3d-weather-icons/moon/20.png" : "/3d-weather-icons/cloud/17.png";
      
      // Snow
      case 600:  // Light snow
      case 601:  // Snow
      case 602:  // Heavy snow
      case 611:  // Sleet
      case 612:  // Light sleet
      case 613:  // Heavy sleet
        return "/3d-weather-icons/snow/20.png";
      
      // Mist, smoke, haze, dust, fog
      case 701:  // Mist
      case 711:  // Smoke
      case 721:  // Haze
      case 731:  // Dust
      case 741:  // Fog
      case 751:  // Sand
      case 761:  // Dust
      case 762:  // Ash
        return nightTime ? "/3d-weather-icons/moon/2.2.png" : "/3d-weather-icons/cloud/1.png";
      
      // Drizzle
      case 300:  // Light drizzle
      case 301:  // Drizzle
      case 302:  // Heavy drizzle
      case 310:  // Light intensity drizzle rain
      case 311:  // Drizzle rain
      case 312:  // Heavy intensity drizzle rain
      case 313:  // Showers of drizzle
      case 314:  // Heavy showers of drizzle
      case 321:  // Showers of rain
        return nightTime ? "/3d-weather-icons/moon/09.png" : "/3d-weather-icons/rain/09.png";
  
      default:
        return "/3d-weather-icons/default/01.png"; // Default icon
    }
  };

  export default getWeatherIcon;