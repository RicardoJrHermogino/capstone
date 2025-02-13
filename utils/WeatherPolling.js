import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import API_BASE_URL from '@/config/apiConfig';

const PollingContext = createContext();

export const usePolling = () => {
  return useContext(PollingContext);
};

export const PollingProvider = ({ children }) => {
  const [fetchData, setFetchData] = useState({
    count: 0,
    firstFetchTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);  // Track offline state

  // Function to show error toast (you can keep this if you want to notify users about being offline)
  const showFetchLimitToast = () => {
    toast.error('This is the most up-to-date data. Please try again later.', {
      duration: 4000,
      style: {
        borderRadius: "30px",
        fontSize: "16px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      },
    });
  };

  // Load persisted data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFetchData = localStorage.getItem('weatherFetchData');
      
      if (savedFetchData) {
        try {
          const parsedData = JSON.parse(savedFetchData);
          const now = Date.now();
          if (parsedData.firstFetchTime && now - parsedData.firstFetchTime <= 60000) {
            setFetchData(parsedData);
          } else {
            setFetchData({ count: 0, firstFetchTime: null });
            localStorage.removeItem('weatherFetchData');
          }
        } catch (error) {
          console.error('Error parsing fetch data:', error);
        }
      }
    }
  }, []);

  // Memoized fetch weather data function
  const fetchWeatherData = useCallback(async () => {
    if (isOffline) {
      console.log("User is offline. Skipping fetch.");
      return; // Skip fetching if the user is offline
    }

    const now = Date.now();
    
    setFetchData(prev => {
      let newCount = prev.count;
      let newFirstFetchTime = prev.firstFetchTime;

      if (!newFirstFetchTime) {
        newFirstFetchTime = now;
      }

      if (now - newFirstFetchTime > 60000) {
        newCount = 0;
        newFirstFetchTime = now;
      }

      if (newCount >= 5) {
        showFetchLimitToast();
        return prev;
      }

      setIsLoading(true);

      fetch(`${API_BASE_URL}/api/fetchWeatherData`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'omit', // If you don't need credentials, use 'omit'. If needed, use 'include'.
        mode: 'cors', // Explicitly set CORS mode if necessary
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Weather data fetched successfully');
          setIsLoading(false);
          setFetchData(prevData => {
            const newData = { count: prevData.count + 1, firstFetchTime: prevData.firstFetchTime };
            if (typeof window !== 'undefined') {
              localStorage.setItem('weatherFetchData', JSON.stringify(newData));
            }
            return newData;
          });
        })
        .catch(error => {
          console.error('Error fetching weather data:', error); // Log error to console

          // Handle offline state and avoid showing any error UI
          if (error.message === 'Failed to fetch') {
            setIsOffline(true);  // Mark the user as offline
          }

          setIsLoading(false);
        });

      return { count: newCount + 1, firstFetchTime: newFirstFetchTime };
    });
  }, [isOffline]);  // Depend on `isOffline` to stop fetching when offline

  // Set up polling
  useEffect(() => {
    // Initial fetch
    fetchWeatherData();

    // Set up interval for polling every 5 minutes (if not offline)
    const intervalId = setInterval(() => {
      if (!isOffline) {
        fetchWeatherData();
      }
    }, 300000);  // 5 minutes

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchWeatherData, isOffline]);

  return (
    <PollingContext.Provider value={{ fetchWeatherData, isLoading, isOffline }}>
      {children}
    </PollingContext.Provider>
  );
};

export default PollingProvider;
