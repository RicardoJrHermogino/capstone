import "@/styles/globals.css";
import { ThemeProvider } from '@mui/material/styles';
import theme from '../styles/theme';
import { Toaster } from 'react-hot-toast';
import { PollingProvider, usePolling } from "@/utils/WeatherPolling";
import { LocationProvider } from '@/utils/LocationContext';
import { useState, useEffect } from 'react';

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
  return (
    <PollingProvider>
      <LocationProvider>
        <WeatherErrorHandler>
          <ThemeProvider theme={theme}>
            <Component {...pageProps} />
            <Toaster />
          </ThemeProvider>
        </WeatherErrorHandler>
      </LocationProvider>
    </PollingProvider>
  );
}

export default MyApp;