import { isNightTime } from './WeatherIcon';

// Function to map weather condition codes to readable strings
export const mapWeatherCondition = (weatherId, selectedDate, isCurrentWeather) => {
  if (weatherId === null || weatherId === undefined) {
    return 'No Weather Data';
  }

  const isNight = isNightTime(selectedDate, null, isCurrentWeather, weatherId);

  switch (weatherId) {
    case 800:
      return isNight ? "Clear Night" : "Sunny";
    
    case 801: 
    case 802: 
    case 803:
      return "Partly Cloudy";
    case 804:
      return "Cloudy";
    
    case 500: 
      return "Light Rain";
    case 501:
      return "Moderate Rain";
    case 502: 
    case 503:
      return "Heavy Rain";
    case 504:
      return "Extreme Rain";
    case 511:
      return "Freezing Rain";
    case 520:
    case 521:
    case 522:
      return "Rainy";
    
    case 200:
    case 201:
    case 202:
    case 210:
    case 211:
    case 212:
    case 221:
    case 230:
    case 231:
    case 232:
      return "Thunderstorm";
    
    case 600:
    case 601:
    case 602:
      return "Snowy";
    case 611:
    case 612:
    case 613:
      return "Sleet";
    
    case 701:
    case 711:
    case 721:
    case 731:
    case 741:
    case 751:
    case 761:
    case 762:
    case 771:
    case 781:
      return "Foggy";
    
    case 300:
    case 301:
    case 302:
    case 310:
    case 311:
    case 312:
    case 313:
    case 314:
    case 321:
      return "Drizzle";
    
    default:
      return "Unknown Weather";
  }
};


export default mapWeatherCondition;