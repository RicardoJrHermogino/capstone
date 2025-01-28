// src/utils/farmingUtils.js
// Function to get farming-related messages based on the weather conditions
export const getFarmingMessage = (weatherId, temperature) => {
  if (weatherId === 502 || weatherId === 503 || weatherId === 504) {
    return "Heavy rain is coming. It's better to avoid working in the coconut fields.";
  } else if (weatherId === 500) {
    return "The system detected light raindrops, but you likely won’t feel it. You can still work in the coconut fields with no problem!";
  } else if (weatherId === 501) {
    return "Moderate rain is expected. Be careful in the coconut fields and avoid using heavy machines or doing big tasks like harvesting.";
  } else if (weatherId === 800 && temperature > 30) {
    return "Hot and sunny weather today. Enjoy working in coconut fields, but make sure to water your plants regularly!";
  } else if (weatherId === 804) {
    return "Cloudy weather today. It's still a good day for farm work, so you can do tasks like fertilizing or checking irrigation.";
  } else if (weatherId === 741) {
    return "Foggy weather is expected. It might be hard to see clearly, so avoid working near machines or in open areas for safety.";
  } else if (weatherId === 200 || weatherId === 201 || weatherId === 202 || weatherId === 210 || weatherId === 211 || weatherId === 212 || weatherId === 221 || weatherId === 230 || weatherId === 231 || weatherId === 232) {
    return "Thunderstorms are coming. It's not safe to work near coconut trees because of the risk of lightning. Stay indoors if possible.";
  } else if (weatherId === 600 || weatherId === 601 || weatherId === 602) {
    return "Snow or sleet is coming. It's best not to go outside. You can use this time for indoor tasks or to restock supplies.";
  } else if (weatherId === 801 || weatherId === 802 || weatherId === 803) {
    return "Partly cloudy weather today. It's a good day to do regular farm work like weeding or pruning.";
  } else if (weatherId === 711 || weatherId === 721 || weatherId === 731 || weatherId === 741 || weatherId === 751 || weatherId === 761 || weatherId === 762 || weatherId === 771 || weatherId === 781) {
    return "Foggy weather ahead. Visibility may be poor, so it’s safer to do lighter tasks or avoid working near machinery.";
  } else if (weatherId === 511) {
    return "Freezing rain is possible. Stay indoors and avoid working outside as the conditions could be dangerous.";
  } else if (weatherId === 520 || weatherId === 521 || weatherId === 522) {
    return "Rainy weather is expected. You can still work in the fields, but make sure to avoid heavy tasks and watch for slippery areas.";
  } else if (weatherId === 300 || weatherId === 301 || weatherId === 302 || weatherId === 310 || weatherId === 311 || weatherId === 312 || weatherId === 313 || weatherId === 314 || weatherId === 321) {
    return "Light drizzle is coming. It’s not strong rain, but you may want to prepare for moisture, which can affect tasks like planting or spraying.";
  } else {
    return "The weather is good today. It’s a perfect day for regular coconut farm work like harvesting, irrigation, or general maintenance.";
  }
};

export default getFarmingMessage;