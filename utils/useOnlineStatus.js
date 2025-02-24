import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Utility function to check online status
const checkOnlineStatus = async () => {
  try {
    const response = await fetch('https://api.openweathermap.org/data/2.5/weather?lat=12.9742&lon=124.0058&appid=588741f0d03717db251890c0ec9fd071&units=metric');
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    return data ? true : false;  // Return true if data is returned (online)
  } catch (error) {
    return false;  // Return false if there's an error (offline)
  }
};

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(null);  // null for undefined, true for online, false for offline
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      const online = await checkOnlineStatus();
      setIsOnline(online);

      // Use localStorage or sessionStorage to track previous status
      const wasOffline = localStorage.getItem('wasOffline');

      if (online && wasOffline) {
        // If the user was offline previously and is now online, redirect to dashboard
        router.push('/dashboard');
        localStorage.removeItem('wasOffline');  // Clear 'wasOffline' after redirect
      } else if (!online) {
        // If the user is offline, set 'wasOffline' to true
        localStorage.setItem('wasOffline', 'true');
        router.push('/offline');
      }
    };

    // Check the status once on initial load
    checkStatus();

    // Check the status every 5 seconds after that
    const intervalId = setInterval(checkStatus, 5000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [router]);

  return isOnline;
}
