import React, { useEffect, useState } from 'react';
import API_BASE_URL from '@/config/apiConfig';

function Test() {
  const [weatherData, setWeatherData] = useState(null); // State to hold the fetched data
  const [loading, setLoading] = useState(true); // State to manage the loading state
  const [error, setError] = useState(null); // State to handle errors

  useEffect(() => {
    const fetchWeatherData = async () => {
      const endpoint = `${API_BASE_URL}/api/getWeatherData`;
      console.log('Fetching data from endpoint:', endpoint); // Log the endpoint
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // Parse the JSON data
        setWeatherData(data); // Update the state with the fetched data
        setLoading(false); // Set loading to false
      } catch (err) {
        setError(err.message); // Update the error state
        setLoading(false); // Set loading to false
      }
    };

    fetchWeatherData();
  }, []); // Empty dependency array ensures this runs once when the component mounts

  // Handle loading, error, and display data
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Weather Data</h1>
      <pre>{JSON.stringify(weatherData, null, 2)}</pre> {/* Display the fetched data */}
    </div>
  );
}

export default Test;
