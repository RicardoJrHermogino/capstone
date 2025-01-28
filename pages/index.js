import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import WelcomeDashboard from './welcome';
import getOrCreateUUID from '../utils/uuid';
import { Preferences } from '@capacitor/preferences';
import API_BASE_URL from '@/config/apiConfig';

export default function Welcome() {
  const router = useRouter();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { value: userId } = await Preferences.get({ key: 'userId' });
  
        if (userId) {
          const deviceExists = await checkDeviceExists(userId);
          
          // Only redirect if device exists
          if (deviceExists) {
            router.push('/dashboard');
          }
          // If device doesn't exist, register it but stay on welcome page
          else {
            await registerDevice(userId);
          }
        } else {
          // For new users
          const newUserId = getOrCreateUUID();
          await Preferences.set({
            key: 'userId',
            value: newUserId,
          });
  
          // Register the device but don't redirect
          await registerDevice(newUserId);
          // Stay on welcome page for new users
        }
      } catch (error) {
        console.error('Error in checkUserStatus:', error);
      }
    };
  
    checkUserStatus();
  }, [router]);

  const checkDeviceExists = async (deviceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/check_device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
      });

      if (response.status === 200) {
        const data = await response.json();
        return data.exists;
      } else {
        const errorText = await response.text();
        console.error('Check Device Error:', response.status, errorText);
        throw new Error(`Failed to check device. Status: ${response.status}, Message: ${errorText}`);
      }
    } catch (error) {
      console.error('Error checking device:', error);
      if (error instanceof TypeError) {
        console.error('Network error or CORS issue');
      }
      throw error;
    }
  };

  const registerDevice = async (deviceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register_device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
      });

      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        console.log('Device registered:', data);
        return data;
      } else {
        const errorText = await response.text();
        console.error('Register Device Error:', response.status, errorText);
        throw new Error(`Failed to register device. Status: ${response.status}, Message: ${errorText}`);
      }
    } catch (error) {
      console.error('Error registering device:', error);
      if (error instanceof TypeError) {
        console.error('Network error or CORS issue');
      }
      throw error;
    }
  };

  return (
    <>
      <WelcomeDashboard />
    </>
  );
}