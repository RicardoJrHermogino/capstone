import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CircularProgress from '@mui/material/CircularProgress';
import WelcomeDashboard from './welcome';
import getOrCreateUUID from '../utils/uuid';
import { Preferences } from '@capacitor/preferences';
import API_BASE_URL from '@/config/apiConfig';

export default function Welcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);

  const updateActivity = async (deviceId) => {
    try {
      console.log('Attempting to update activity for device:', deviceId); // Debug log
  
      const response = await fetch(`${API_BASE_URL}/api/devices/update_activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId }),
      });
      
      const responseData = await response.text();
      console.log('Raw response:', responseData); // Debug log
      
      if (!response.ok) {
        throw new Error(`Failed to update activity: ${responseData}`);
      }
      
      const data = JSON.parse(responseData);
      console.log('Activity updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { value: userId } = await Preferences.get({ key: 'userId' });
  
        if (userId) {
          await updateActivity(userId); // Update activity timestamp
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
          await updateActivity(newUserId); // Update activity for new users
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

  const checkDeviceExists = async (deviceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices/check_device`, {
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
      const response = await fetch(`${API_BASE_URL}/api/devices/register_device`, {
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