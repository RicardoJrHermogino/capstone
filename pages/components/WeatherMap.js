import React, { useEffect, useState, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Grid, Typography } from '@mui/material';
import { locationCoordinates } from '../../utils/locationCoordinates';  // Ensure this contains valid coordinates.

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoicmljYXJkb2pyIiwiYSI6ImNtMWY5NTkzZTM2d2kya3Njenl5MzM3c2oifQ.XNjWBeaNLSTU4jufBC3VLw';
const OPENWEATHER_API_KEY = '5726f728f2cd3a818fdd39c3348c4399';

const WeatherMap = () => {
  const [weatherData, setWeatherData] = useState({}); // State to store weather data
  const mapInstance = useRef(null); // Ref for the map instance
  const markersRef = useRef([]); // Ref to track markers for cleanup
  const isMounted = useRef(true); // Ref to check component mounting status

  // Function to create a custom weather icon for markers
  const createWeatherIcon = (iconUrl, temp, description) => {
    const iconElement = document.createElement('div');
    iconElement.style.backgroundImage = `url(${iconUrl})`;
    iconElement.style.backgroundSize = 'contain';
    iconElement.style.width = '35px';
    iconElement.style.height = '35px';
    iconElement.style.display = 'flex';
    iconElement.style.justifyContent = 'center';
    iconElement.style.alignItems = 'center';
    iconElement.title = `${temp}°C, ${description}`; // Tooltip on hover
    return iconElement;
  };

  // Add OpenWeatherMap overlay (clouds, temperature, etc.)
  const addOpenWeatherMapLayer = (map) => {
    if (!OPENWEATHER_API_KEY) {
      console.error('OpenWeather API key is missing!');
      return;
    }

    // OpenWeatherMap Tile Layer URL for a specific layer (e.g., temperature)
    const weatherLayerUrl = `https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`;

    // Add weather layers for a specific type (e.g., clouds, temperature, etc.)
    const layers = ['clouds_new'];

    layers.forEach((layer) => {
      map.addSource(`${layer}-layer`, {
        type: 'raster',
        tiles: [
          weatherLayerUrl.replace('{layer}', layer), // Layer type (e.g., clouds_new, temp)
        ],
        tileSize: 256,
      });

      map.addLayer({
        id: `${layer}-layer`,
        type: 'raster',
        source: `${layer}-layer`,
        paint: {
          'raster-opacity': 0.6, // Set opacity for the weather layer
        },
      });
    });
  };

  // Memoized fetchWeatherDataAndAddMarkers function to avoid unnecessary re-creations
  const fetchWeatherDataAndAddMarkers = useCallback(async () => {
    if (!mapInstance.current || !isMounted.current) return;

    try {
      const fetchPromises = Object.keys(locationCoordinates).map(async (municipalityName) => {
        if (!isMounted.current) return;

        const { lat, lon } = locationCoordinates[municipalityName];
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const response = await fetch(weatherUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!isMounted.current) return;

        // Optionally store weather data in state for debugging or display elsewhere
        setWeatherData(prevData => ({
          ...prevData,
          [`${municipalityName}-${lat}-${lon}`]: data,
        }));

        if (data.weather?.[0] && mapInstance.current) {
          const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`; // Get the weather icon URL
          const weatherIcon = createWeatherIcon(iconUrl, data.main.temp, data.weather[0].description);

          // Create a new marker with the custom icon
          const marker = new mapboxgl.Marker({ element: weatherIcon })
            .setLngLat([lon, lat])
            .setPopup(
              new mapboxgl.Popup().setHTML(`
                <h3>${municipalityName}</h3>
                <p><strong>Temperature:</strong> ${data.main.temp}°C</p>
                <p><strong>Weather:</strong> ${data.weather[0].description}</p>
                <p><strong>Wind Speed:</strong> ${data.wind.speed} m/s</p>
                <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
              `)
            )
            .setOffset([0, -40]);

          // Add the marker to the map
          if (isMounted.current && mapInstance.current) {
            marker.addTo(mapInstance.current);
            markersRef.current.push(marker);
          } else {
            marker.remove();
          }
        }
      });

      // Wait for all weather data to be fetched and markers to be created
      if (isMounted.current) {
        await Promise.all(fetchPromises);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error('Error fetching weather data:', error);
      }
    }
  }, []);  // Memoizing the function with useCallback to prevent unnecessary re-creation.

  useEffect(() => {
    // Initialize Mapbox
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    const mapContainer = document.getElementById('weather-map');
  
    if (!mapContainer) return;
  
    const newMap = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11', // You can change this to another style
      center: [123.9894, 12.8477], // Example center point
      zoom: 8,
    });
  
    mapInstance.current = newMap;
  
    newMap.on('load', () => {
      if (isMounted.current) {
        newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
        addOpenWeatherMapLayer(newMap); // Add OpenWeatherMap Layer
        fetchWeatherDataAndAddMarkers(); // Fetch weather and add markers
      }
    });
  
    // Cleanup function to remove markers and map
    return () => {
      isMounted.current = false;
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [fetchWeatherDataAndAddMarkers]);  // Including the memoized function in the dependency array
  
  return (
    <Grid alignItems={'center'} style={{ width: '100%', height: '100%' }}>
      <Grid id="weather-map" style={{ height: '100%', width: '100%' }}></Grid>
    </Grid>
  );
};

export default WeatherMap;
