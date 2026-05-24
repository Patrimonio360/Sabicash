import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from './src/context/AppContext';
import OnboardingScreen   from './src/screens/OnboardingScreen';
import HomeScreen         from './src/screens/HomeScreen';
import GamesScreen        from './src/screens/GamesScreen';
import WalletScreen       from './src/screens/WalletScreen';
import HistoryScreen      from './src/screens/HistoryScreen';
import ParentScreen       from './src/screens/ParentScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Versión actual de la app ──────────────────────────────────
const APP_VERSION     = '1.0.3';
const VERSION_URL = 'https://raw.githubusercontent.com/Patrimonio360/Sabicash/main/version.json';

function compareVersions(v1, v2) {
  const a = v1.split('.').map(Number);
  const b = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) < (b[i] || 0)) return -1;
    if ((a[i] || 0) > (b[i] || 0)) return  1;
  }
  return 0;
}

async function checkForUpdates() {
  try {
    const res  = await fetch(VERSION_URL + '?t=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    if (compareVersions(APP_VERSION, data.version) < 0) {
      Alert.alert(
        '🆕 Nueva versión disponible',
        `Versión ${data.version} lista para descargar.\n\n${data.notes || ''}`,
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Descargar', onPress: () => Linking.openURL(data.url) },
        ]
      );
    }
  } catch { /* sin internet, ignorar */ }
}

function MainTabs() {
  const { state } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 4,
        },
        tabBarActiveTintColor:   '#60a5fa',
        tabBarInactiveTintColor: '#475569',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ focused }) => {
          const emojis = { Inicio: '🏠', Juegos: '🎮', Paga: '💰', Historial: '📋', Padres: '🔐' };
          const showBadge = route.name === 'Padres' && state.unreadAlerts > 0;
          return (
            <View style={{ alignItems: 'center' }}>
              <View style={focused ? { backgroundColor: '#1e40af', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 2 } : {}}>
                <Text style={{ fontSize: 20 }}>{emojis[route.name]}</Text>
                {showBadge && (
                  <View style={{
                    position: 'absolute', top: -4, right: -8,
                    backgroundColor: '#dc2626', borderRadius: 99,
                    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 4, borderWidth: 2, borderColor: '#0f172a',
                  }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{state.unreadAlerts}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Inicio"    component={HomeScreen} />
      <Tab.Screen name="Juegos"    component={GamesScreen} />
      <Tab.Screen name="Paga"      component={WalletScreen} />
      <Tab.Screen name="Historial" component={HistoryScreen} />
      <Tab.Screen name="Padres"    component={ParentScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { state, loaded } = useApp();

  useEffect(() => {
    if (loaded) checkForUpdates();
  }, [loaded]);

  if (!loaded) return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!state.setupDone
          ? <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          : <Stack.Screen name="Main"       component={MainTabs} />
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
