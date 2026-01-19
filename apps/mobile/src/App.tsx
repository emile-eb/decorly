import React from 'react';
import { Text, TouchableOpacity, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import InteriorCreateScreen from './screens/InteriorCreateScreen';
import GardenCreateScreen from './screens/GardenCreateScreen';
import FloorCreateScreen from './screens/FloorCreateScreen';
import PaintCreateScreen from './screens/PaintCreateScreen';
import ReplaceCreateScreen from './screens/ReplaceCreateScreen';
import DeclutterCreateScreen from './screens/DeclutterCreateScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import DiscoverFeedScreen from './screens/DiscoverFeedScreen';
import UploadScreen from './screens/UploadScreen';
import StyleScreen from './screens/StyleScreen';
import ProgressScreen from './screens/ProgressScreen';
import ResultsScreen from './screens/ResultsScreen';
import PreviewProgressScreen from './screens/PreviewProgressScreen';
import PreviewResultsScreen from './screens/PreviewResultsScreen';
// (imported above) HistoryScreen
import PaywallScreen from './screens/PaywallScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import HistoryScreen from './screens/HistoryScreen';
import { SessionProvider, useSessionGate } from './lib/session';
import { BottomIslandContext } from './lib/island';
import { TabContext, Tab } from './lib/tabs';
import SplashOverlay from './components/SplashOverlay';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

function ExploreStackNavigator() {
  const ExploreStack = createNativeStackNavigator();
  const islandCtx = React.useContext(BottomIslandContext);
  const [isPro, setIsPro] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      try {
        // Dynamic import so missing native SDKs do not break web/dev
        const mod = await import('./lib/purchases');
        await mod.initPurchases?.();
        const info = await mod.getCustomerInfo?.();
        const active = (info as any)?.entitlements?.active || {};
        setIsPro(!!active?.pro);
      } catch {}
    })();
  }, []);
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { shadowColor: 'transparent', elevation: 0, borderBottomWidth: 0, backgroundColor: '#ffffff' },
        headerRightContainerStyle: { paddingRight: 24 },
        contentStyle: { paddingTop: 10, backgroundColor: '#ffffff' }
      }}
    >
      <ExploreStack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          headerTitle: 'Decorly AI',
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 22,
            letterSpacing: 0.5,
            fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'system-ui'
          },
          headerLeft: () => (isPro ? null : (
            <TouchableOpacity
              onPress={() => navigation.navigate('Paywall')}
              style={{ backgroundColor: '#ff0000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginLeft: 24, flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '700', color: '#fff', textTransform: 'uppercase' }}>Pro</Text>
              <Ionicons name="star" size={16} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )),
          headerLeftContainerStyle: { paddingLeft: 0 },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#000', marginRight: 16 }}
            >
              <Text style={{ fontWeight: '700', color: '#fff' }}>Settings</Text>
            </TouchableOpacity>
          ),
          headerRightContainerStyle: { paddingRight: 24 }
        })}
        listeners={{
          focus: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen
        name="InteriorCreate"
        component={InteriorCreateScreen}
        options={{ headerShown: false }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen
        name="GardenCreate"
        component={GardenCreateScreen}
        options={{ headerShown: false }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen
        name="PaintCreate"
        component={PaintCreateScreen}
        options={{ headerShown: false }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen
        name="FloorCreate"
        component={FloorCreateScreen}
        options={{ headerShown: false }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen
        name="ReplaceCreate"
        component={ReplaceCreateScreen}
        options={{ headerShown: false }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen
        name="DeclutterCreate"
        component={DeclutterCreateScreen}
        options={{ headerShown: false }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen name="Style" component={StyleScreen} options={{ title: 'Style' }} />
      <ExploreStack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: 'Progress' }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ title: 'Results' }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen
        name="PreviewProgress"
        component={PreviewProgressScreen}
        options={{ title: 'Loading Preview' }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen
        name="PreviewResults"
        component={PreviewResultsScreen}
        options={{ title: 'Results Preview' }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      {/** History belongs to Profile tab; removed from Explore */}
      <ExploreStack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ headerShown: false, contentStyle: { paddingTop: 0, backgroundColor: '#ffffff' } }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <ExploreStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          title: 'Settings',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: '700' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" style={{ paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 }}>
              <Ionicons name="chevron-back" size={22} color="#000" />
            </TouchableOpacity>
          )
        })}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
    </ExploreStack.Navigator>
  );
}

function DiscoverStackNavigator() {
  const DStack = createNativeStackNavigator();
  return (
    <DStack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { shadowColor: 'transparent', elevation: 0, borderBottomWidth: 0, backgroundColor: '#ffffff' },
        contentStyle: { paddingTop: 10, backgroundColor: '#ffffff' }
      }}
    >
      <DStack.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ headerShown: false }}
      />
      <DStack.Screen
        name="DiscoverFeed"
        component={DiscoverFeedScreen}
        options={({ route }: any) => ({ title: route.params?.title || 'Discover' })}
      />
    </DStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const PStack = createNativeStackNavigator();
  const islandCtx = React.useContext(BottomIslandContext);
  return (
    <PStack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { shadowColor: 'transparent', elevation: 0, borderBottomWidth: 0, backgroundColor: '#ffffff' },
        headerRightContainerStyle: { paddingRight: 24 },
        contentStyle: { paddingTop: 10, backgroundColor: '#ffffff' }
      }}
    >
      <PStack.Screen
        name="History"
        component={HistoryScreen}
        options={{ headerShown: false }}
        listeners={{ focus: () => islandCtx?.setVisible(true) }}
      />
      <PStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          title: 'Settings',
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: '700' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" style={{ paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 }}>
              <Ionicons name="chevron-back" size={22} color="#000" />
            </TouchableOpacity>
          )
        })}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <PStack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ headerShown: false, contentStyle: { paddingTop: 0, backgroundColor: '#ffffff' } }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <PStack.Screen
        name="PreviewProgress"
        component={PreviewProgressScreen}
        options={{ title: 'Loading Preview' }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
      <PStack.Screen
        name="PreviewResults"
        component={PreviewResultsScreen}
        options={{ title: 'Results Preview' }}
        listeners={{
          focus: () => islandCtx?.setVisible(false),
          blur: () => islandCtx?.setVisible(true)
        }}
      />
    </PStack.Navigator>
  );
}

function Tabs() {
  const [tab, setTab] = React.useState<Tab>('Explore');
  const active = '#111827';
  const inactive = '#9ca3af';
  const [islandVisible, setIslandVisible] = React.useState(true);
  // Ensure island is visible on Profile and Create root tab switches
  React.useEffect(() => {
    if (tab === 'Discover' || tab === 'Profile') setIslandVisible(true);
  }, [tab]);
  return (
    <TabContext.Provider value={{ tab, setTab }}>
    <BottomIslandContext.Provider value={{ visible: islandVisible, setVisible: setIslandVisible }}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {tab === 'Explore' ? <ExploreStackNavigator /> : tab === 'Discover' ? <DiscoverStackNavigator /> : <ProfileStackNavigator />}
        </View>
      {islandVisible && (
      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 24,
          backgroundColor: '#ffffff',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingVertical: 12,
          // shadow (iOS)
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 16,
          // elevation (Android)
          elevation: 10
        }}
      >
        <TouchableOpacity onPress={() => setTab('Explore')} accessibilityRole="button" style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
          <Ionicons name={tab === 'Explore' ? 'compass' : 'compass-outline'} size={28} color={tab === 'Explore' ? active : inactive} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('Discover')} accessibilityRole="button" style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
          <Ionicons name={tab === 'Discover' ? 'bulb' : 'bulb-outline'} size={28} color={tab === 'Discover' ? active : inactive} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('Profile')} accessibilityRole="button" style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
          <Ionicons name={tab === 'Profile' ? 'person' : 'person-outline'} size={28} color={tab === 'Profile' ? active : inactive} />
        </TouchableOpacity>
      </View>
      )}
      </View>
    </BottomIslandContext.Provider>
    </TabContext.Provider>
  );
}

function RootNavigator() {
  const { session } = useSessionGate();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="Root" component={Tabs} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <SafeAreaProvider>
      {showSplash ? (
        <SplashOverlay />
      ) : (
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      )}
    </SafeAreaProvider>
  );
}
