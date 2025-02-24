import "@/styles/globals.css";
import { ThemeProvider } from '@mui/material/styles';
import theme from '../styles/theme';
import { Toaster } from 'react-hot-toast';
import { PollingProvider, usePolling } from "@/utils/WeatherPolling";
import { LocationProvider } from '@/utils/LocationContext';
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
// import { useOnlineStatus } from '@/utils/useOnlineStatus';  // Import the custom hook

// Error Boundary Component
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong. Please try again later</h1>
      <p className="text-red-500 mb-4">{error.message || 'An unexpected error occurred'}</p>
      <button 
        onClick={resetErrorBoundary}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
      >
        Try Again
      </button>
    </div>
  );
}

// Wrapper Component to Handle Weather Data Errors
function WeatherErrorHandler({ children }) {
  const { weatherError, clearWeatherError } = usePolling();
  const [showErrorPage, setShowErrorPage] = useState(false);

  useEffect(() => {
    if (weatherError) {
      setShowErrorPage(true);
    }
  }, [weatherError]);

  if (showErrorPage) {
    return (
      <ErrorFallback 
        error={{ message: weatherError.message }} 
        resetErrorBoundary={() => {
          setShowErrorPage(false);
          clearWeatherError();
        }} 
      />
    );
  }

  return children;
}

function MyApp({ Component, pageProps }) {
  // const isOnline = useOnlineStatus();  // Use the hook to track online status

  // useEffect(() => {
  //   if (isOnline === null) return;  // Don't show status until it's checked for the first time

  //   if (isOnline) {
  //     console.log('User is online');
  //     // You can also show a toast or trigger any other logic
  //   } else {
  //     console.log('User is offline');
  //     // Handle offline state here (e.g., show a notification or warning)
  //   }
  // }, [isOnline]);

  return (
    <PollingProvider>
      <LocationProvider>
        <WeatherErrorHandler>
          <ThemeProvider theme={theme}>
            <Component {...pageProps} />
            <Toaster />
            {/* {isOnline === false && (
              <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-md shadow-lg">
                You are offline. Please check your internet connection.
              </div>
            )} */}
          </ThemeProvider>
        </WeatherErrorHandler>
      </LocationProvider>
    </PollingProvider>
  );
}

export default MyApp;
