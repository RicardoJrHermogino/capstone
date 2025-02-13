import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import WelcomeDashboard from './welcome';
import getOrCreateUUID from '../utils/uuid';
import { Preferences } from '@capacitor/preferences';
import API_BASE_URL from '@/config/apiConfig';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default function Welcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);

  // Function to check if the user is online by calling the OpenWeatherMap API
  const checkOnlineStatus = async () => {
    try {
      // Set a timeout for the fetch request
      const response = await Promise.race([
        fetch('https://api.openweathermap.org/data/2.5/weather?lat=12.9742&lon=124.0058&appid=588741f0d03717db251890c0ec9fd071&units=metric'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)) // 5-second timeout
      ]);
      return true; // User is online
    } catch (error) {
      console.warn('User is offline. Skipping API calls.', error);
      return false; // User is offline
    }
  };
  

  const updateActivity = async (deviceId) => {
    try {
      console.log('Updating activity for device:', deviceId);
      await api.post('/api/devices/update_activity', { deviceId });
    } catch (error) {
      console.warn('Failed to update activity. Assuming offline mode.');
    }
  };

  const checkDeviceExists = async (deviceId) => {
    try {
      const { data } = await api.post('/api/devices/check_device', { deviceId });
      return data.exists;
    } catch (error) {
      console.warn('Failed to check device. Assuming offline mode.');
      return true; // Assume the device exists to allow offline functionality
    }
  };

  const registerDevice = async (deviceId) => {
    try {
      await api.post('/api/devices/register_device', { deviceId });
      console.log('Device registered:', deviceId);
    } catch (error) {
      console.warn('Failed to register device. Assuming offline mode.');
    }
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const isOnline = await checkOnlineStatus();
  
        const { value: userId } = await Preferences.get({ key: 'userId' });
  
        if (isOnline) {
          if (userId) {
            await updateActivity(userId);
            const deviceExists = await checkDeviceExists(userId);
  
            if (deviceExists) {
              router.push('/dashboard');
            } else {
              await registerDevice(userId);
              setShouldShowWelcome(true);
            }
          } else {
            const newUserId = getOrCreateUUID();
            await Preferences.set({ key: 'userId', value: newUserId });
  
            await registerDevice(newUserId);
            await updateActivity(newUserId);
            setShouldShowWelcome(true);
          }
        } else {
          if (userId) {
            router.push('/dashboard');
          } else {
            const newUserId = getOrCreateUUID();
            console.log('Generated new userId (offline):', newUserId);
            await Preferences.set({ key: 'userId', value: newUserId });
            setShouldShowWelcome(true);
          }
        }
      } catch (error) {
        console.warn('Error in checkUserStatus. Assuming offline mode.', error);
        setShouldShowWelcome(true);
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false); // Ensure this is called
      }
    };
  
    checkUserStatus();
  }, [router]);
  

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </div>
    );
  }

  return shouldShowWelcome ? <WelcomeDashboard /> : null;
}
