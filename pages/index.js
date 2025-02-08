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
    'Content-Type': 'application/json'
  }
});

export default function Welcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);

  const updateActivity = async (deviceId) => {
    try {
      console.log('Attempting to update activity for device:', deviceId);
      const { data } = await api.post('/api/devices/update_activity', { deviceId });
      console.log('Activity updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating activity:', error.response?.data || error.message);
      throw error;
    }
  };

  const checkDeviceExists = async (deviceId) => {
    try {
      const { data } = await api.post('/api/devices/check_device', { deviceId });
      return data.exists;
    } catch (error) {
      console.error('Error checking device:', error.response?.data || error.message);
      if (error.code === 'ERR_NETWORK') {
        console.error('Network error or CORS issue');
      }
      throw error;
    }
  };

  const registerDevice = async (deviceId) => {
    try {
      const { data } = await api.post('/api/devices/register_device', { deviceId });
      console.log('Device registered:', data);
      return data;
    } catch (error) {
      console.error('Error registering device:', error.response?.data || error.message);
      if (error.code === 'ERR_NETWORK') {
        console.error('Network error or CORS issue');
      }
      throw error;
    }
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { value: userId } = await Preferences.get({ key: 'userId' });

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
          await Preferences.set({
            key: 'userId',
            value: newUserId,
          });

          await registerDevice(newUserId);
          await updateActivity(newUserId);
          setShouldShowWelcome(true);
        }
      } catch (error) {
        console.error('Error in checkUserStatus:', error);
        setShouldShowWelcome(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [router]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </div>
    );
  }

  return shouldShowWelcome ? <WelcomeDashboard /> : null;
}