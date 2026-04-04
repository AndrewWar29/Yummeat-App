import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useHouseholdStore } from '../store/householdStore';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { HouseholdNavigator } from './HouseholdNavigator';
import { Colors } from '../constants/colors';

export function RootNavigator() {
  const { isAuthenticated, user, loadStoredUser } = useAuthStore();
  const { household, loadHousehold } = useHouseholdStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      await loadStoredUser();
      setIsBootstrapping(false);
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.householdId && !household) {
      loadHousehold(user.householdId);
    }
  }, [isAuthenticated, user]);

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : !household ? (
        <HouseholdNavigator />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}
