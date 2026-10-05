import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Leaves the signed-in screens for Login. Every open screen is closed
// first: a screen left underneath would keep running (and asking the
// server for its data) with the next person's sign-in, and Back would
// reopen it.
export function returnToLogin() {
  if (router.canDismiss()) {
    router.dismissAll();
  }

  router.replace('/login');
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const userEmail =
        await AsyncStorage.getItem('userEmail');

      console.log('Saved userEmail:', userEmail);

      setIsLoggedIn(!!userEmail);
    } catch (error) {
      console.error(
        'Auth check failed:',
        error
      );

      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      console.log('Starting logout...');

      await AsyncStorage.multiRemove([
        'userEmail',
        'userId',
        'userRole',
        'token',
      ]);

      setIsLoggedIn(false);

      console.log(
        'Logout successful. Auth data cleared.'
      );
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );

      throw error;
    }
  };

  return {
    isLoggedIn,
    isLoading,
    logout,
  };
}