import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a Context for the location
const LocationContext = createContext();

// Create a custom hook to use the LocationContext
export const useLocation = () => useContext(LocationContext);

// Provider component to wrap the app and provide the context
export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null); // The location state
  const [isClient, setIsClient] = useState(false); // Client-side flag to ensure no SSR mismatch

  // Default location if no location is found in localStorage
  const defaultLocation = 'Sorsogon City'; // Change this to any default city you'd like

  // This effect runs once on the client side to prevent accessing localStorage during SSR
  useEffect(() => {
    setIsClient(true); // Set the flag to indicate we're on the client side

    // Try to fetch location from localStorage if it's available
    const storedLocation = localStorage.getItem('location');
    if (storedLocation) {
      setLocation(storedLocation);
    } else {
      setLocation(defaultLocation); // Use default location if no location is in localStorage
    }
  }, []);

  // Update localStorage when the location changes
  useEffect(() => {
    if (location) {
      localStorage.setItem('location', location);
    }
  }, [location]); // Only run this effect when location changes

  // Only render children once the component is mounted on the client side
  if (!isClient) {
    return null; // Avoid rendering children during SSR to prevent hydration issues
  }

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
