import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Colors } from '../constants/colors';
import { CalendarScreen } from '../screens/calendar/CalendarScreen';
import { RecipeSearchScreen } from '../screens/recipes/RecipeSearchScreen';
import { RecipeDetailScreen } from '../screens/recipes/RecipeDetailScreen';
import { ScanScreen } from '../screens/scan/ScanScreen';
import { ShoppingListScreen } from '../screens/shopping/ShoppingListScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

const RecipeStack = createNativeStackNavigator();
function RecipesNavigator() {
  return (
    <RecipeStack.Navigator>
      <RecipeStack.Screen
        name="RecipeSearch"
        component={RecipeSearchScreen}
        options={{ title: 'Recetas' }}
      />
      <RecipeStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: '' }}
      />
    </RecipeStack.Navigator>
  );
}

const TAB_ICONS: Record<string, string> = {
  Calendar: '📅',
  Recipes: '🍳',
  Scan: '📸',
  Shopping: '🛒',
  Profile: '👤',
};

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: focused ? 24 : 20 }}>{TAB_ICONS[route.name]}</Text>
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[500],
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.08,
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: { backgroundColor: Colors.white },
        headerTitleStyle: { fontWeight: '700', color: Colors.secondary },
      })}
    >
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Semana' }} />
      <Tab.Screen name="Recipes" component={RecipesNavigator} options={{ title: 'Recetas', headerShown: false }} />
      <Tab.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan & Cook' }} />
      <Tab.Screen name="Shopping" component={ShoppingListScreen} options={{ title: 'Compras' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}
