import React, { useEffect, useState } from 'react';
import { View, Image, Dimensions, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashOverlay() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const total = 1200; // ms
    const step = 20; // ms
    const inc = 100 / (total / step);
    const t = setInterval(() => {
      setProgress((p) => {
        const n = Math.min(100, p + inc);
        if (n >= 100) clearInterval(t);
        return n;
      });
    }, step);
    return () => clearInterval(t);
  }, []);

  const width = Math.round(Dimensions.get('window').width * 0.6);
  const filled = Math.round((progress / 100) * width);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ width: 140, height: 140, borderRadius: 24, overflow: 'hidden' }}>
          <Image source={require('../../assets/App Logo.png')} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
        </View>
        <View style={{ height: 10 }} />
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827' }}>Decorly AI</Text>
        <View style={{ height: 280 }} />
        <View style={{ width, height: 8, borderRadius: 999, backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
          <View style={{ width: filled, height: '100%', backgroundColor: '#111827' }} />
        </View>
      </View>
    </SafeAreaView>
  );
}
