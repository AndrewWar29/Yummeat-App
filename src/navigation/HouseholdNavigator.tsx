import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HouseholdSetupScreen } from '../screens/household/HouseholdSetupScreen';
import { CreateHouseholdScreen } from '../screens/household/CreateHouseholdScreen';
import { JoinHouseholdScreen } from '../screens/household/JoinHouseholdScreen';

const Stack = createNativeStackNavigator();

export function HouseholdNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HouseholdSetup"
        component={HouseholdSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateHousehold"
        component={CreateHouseholdScreen}
        options={{ title: 'Crear Hogar' }}
      />
      <Stack.Screen
        name="JoinHousehold"
        component={JoinHouseholdScreen}
        options={{ title: 'Unirse a un Hogar' }}
      />
    </Stack.Navigator>
  );
}
