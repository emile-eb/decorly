import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import InteriorCreateScreen from './screens/InteriorCreateScreen';
import GardenCreateScreen from './screens/GardenCreateScreen';
import FloorCreateScreen from './screens/FloorCreateScreen';
import PaintCreateScreen from './screens/PaintCreateScreen';
import UploadScreen from './screens/UploadScreen';
import StyleScreen from './screens/StyleScreen';
import ProgressScreen from './screens/ProgressScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import PaywallScreen from './screens/PaywallScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import { SessionProvider, useSessionGate } from './lib/session';

const Stack = createNativeStackNavigator();

function ExploreStackNavigator() {
  const ExploreStack = createNativeStackNavigator();
  return (
    <ExploreStack.Navigator>
      <ExploreStack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          headerTitle: '',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Paywall')}
              style={{ backgroundColor: '#ff0000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginLeft: 24, flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ fontWeight: '700', color: '#fff', textTransform: 'uppercase' }}>Pro</Text>
              <Ionicons name="star" size={16} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          ),
          headerLeftContainerStyle: { paddingLeft: 0 },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#000', marginRight: 24 }}
            >
              <Text style={{ fontWeight: '700', color: '#fff' }}>Settings</Text>
            </TouchableOpacity>
          ),
          headerRightContainerStyle: { paddingRight: 0 }
        })}
      />
      <ExploreStack.Screen
        name="InteriorCreate"
        component={InteriorCreateScreen}
        options={{ headerShown: false }}
      />
      <ExploreStack.Screen
        name="GardenCreate"
        component={GardenCreateScreen}
        options={{ headerShown: false }}
      />
      <ExploreStack.Screen
        name="PaintCreate"
        component={PaintCreateScreen}
        options={{ headerShown: false }}
      />
      <ExploreStack.Screen
        name="FloorCreate"
        component={FloorCreateScreen}
        options={{ headerShown: false }}
      />
      <ExploreStack.Screen name="Style" component={StyleScreen} options={{ title: 'Style' }} />
      <ExploreStack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
      <ExploreStack.Screen name="Results" component={ResultsScreen} options={{ title: 'Results' }} />
      <ExploreStack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <ExploreStack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'Go Pro' }} />
      <ExploreStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </ExploreStack.Navigator>
  );
}

function CreateStackNavigator() {
  const CreateStack = createNativeStackNavigator();
  return (
    <CreateStack.Navigator>
      <CreateStack.Screen
        name="Upload"
        component={UploadScreen}
        options={({ navigation }) => ({
          title: 'Create',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 }}>
              <Ionicons name="chevron-back" size={22} color="#000" />
            </TouchableOpacity>
          )
        })}
      />
      <CreateStack.Screen name="Style" component={StyleScreen} options={{ title: 'Style' }} />
      <CreateStack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
      <CreateStack.Screen name="Results" component={ResultsScreen} options={{ title: 'Results' }} />
    </CreateStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const PStack = createNativeStackNavigator();
  return (
    <PStack.Navigator>
      <PStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <PStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <PStack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'Go Pro' }} />
    </PStack.Navigator>
  );
}

function Tabs() {
  const [tab, setTab] = React.useState<'Explore' | 'Create' | 'Profile'>('Explore');
  const active = '#111827';
  const inactive = '#9ca3af';
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === 'Explore' ? <ExploreStackNavigator /> : tab === 'Create' ? <CreateStackNavigator /> : <ProfileStackNavigator />}
      </View>
      <View
        style={{
          height: 64,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff'
        }}
      >
        <TouchableOpacity onPress={() => setTab('Explore')} accessibilityRole="button">
          <Ionicons name={tab === 'Explore' ? 'compass' : 'compass-outline'} size={28} color={tab === 'Explore' ? active : inactive} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('Create')} accessibilityRole="button">
          <Ionicons name={tab === 'Create' ? 'add-circle' : 'add-circle-outline'} size={28} color={tab === 'Create' ? active : inactive} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('Profile')} accessibilityRole="button">
          <Ionicons name={tab === 'Profile' ? 'person' : 'person-outline'} size={28} color={tab === 'Profile' ? active : inactive} />
        </TouchableOpacity>
      </View>
    </View>
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
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}
