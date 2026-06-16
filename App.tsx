import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { tap } from './src/components/UI';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import { Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { SettingsProvider } from './src/lib/SettingsContext';
import { AuthProvider, useAuth } from './src/lib/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import RankScreen from './src/screens/RankScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import JoinGroupScreen from './src/screens/JoinGroupScreen';
import AddPlaceScreen from './src/screens/AddPlaceScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import TopplisteScreen from './src/screens/TopplisteScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import StatsScreen from './src/screens/StatsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Hjem: 'home', Kart: 'map', Rang: 'star', Grupper: 'people', Innstillinger: 'person',
};

function FloatingDock({ state, navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 10, alignItems: 'center' }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 4, padding: 9, borderRadius: 28,
          backgroundColor: c.surface, borderWidth: 1, borderColor: c.stoneLine,
          shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 14,
        }}
      >
        {state.routes.map((route: any, i: number) => {
          const focused = state.index === i;
          const isCenter = route.name === 'Rang';
          const onPress = () => {
            tap();
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
          };
          if (isCenter) {
            return (
              <Pressable key={route.key} onPress={onPress} hitSlop={6}>
                <LinearGradient colors={focused ? ['#FF8A47', '#E2480A'] : [c.stone, c.stone]} style={{ width: 56, height: 56, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="star" size={27} color={focused ? '#fff' : c.inkSoft} />
                </LinearGradient>
              </Pressable>
            );
          }
          return (
            <Pressable key={route.key} onPress={onPress} hitSlop={6} style={{ width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? c.emberGlow : 'transparent' }}>
              <Ionicons name={TAB_ICONS[route.name]} size={24} color={focused ? c.ember : c.inkSoft} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator tabBar={(props) => <FloatingDock {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Hjem" component={HomeScreen} />
      <Tab.Screen name="Kart" component={MapScreen} />
      <Tab.Screen name="Rang" component={RankScreen} />
      <Tab.Screen name="Grupper" component={GroupsScreen} />
      <Tab.Screen name="Innstillinger" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { c, isDark } = useTheme();
  const { user, ready, profile, profileLoaded } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('fjellfot.onboarded').then((v) => setOnboarded(!!v));
  }, []);

  // Wait for auth + onboarding flag, and (when signed in) for the profile fetch.
  if (!ready || onboarded === null || (user && !profileLoaded)) {
    return <View style={{ flex: 1, backgroundColor: c.snow }} />;
  }

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: c.snow, card: c.surface } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: c.snow, card: c.surface } };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* ONE navigator with conditional screens (React Navigation auth pattern).
          When `user` flips, the navigator cleanly switches screen sets. */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : !profile ? (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : (
          <>
            {!onboarded && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="AddPlace" component={AddPlaceScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Toppliste" component={TopplisteScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Stats" component={StatsScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold, Inter_500Medium, Inter_700Bold,
  });
  if (!fontsLoaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              <Root />
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
