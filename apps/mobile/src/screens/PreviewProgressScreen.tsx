import React from 'react';
import { View, Text, Image, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PreviewProgressScreen() {
  const translateY = React.useRef(new Animated.Value(0)).current;
  const bar = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -30, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bar, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(bar, { toValue: 0, duration: 0, useNativeDriver: false })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const sample = require('../../assets/int ex 6.webp');
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ transform: [{ translateY: -100 }], alignItems: 'center' }}>
          <View style={{ width: '86%', aspectRatio: 3/4, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
            <Animated.View style={{ transform: [{ translateY }] }}>
              <Image source={sample} style={{ width: '100%', height: undefined, aspectRatio: 3/4 }} resizeMode="cover" />
            </Animated.View>
          </View>
          <View style={{ height: 16 }} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', textAlign: 'center' }}>Designing your room…</Text>
          <Text style={{ marginTop: 6, color: '#6b7280', fontSize: 12, textAlign: 'center' }}>Don't lock your screen or leave the app</Text>
          <View style={{ height: 42 }} />
          <View style={{ width: 280, alignSelf: 'center', height: 8, borderRadius: 999, backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
            <Animated.View
              style={{ height: '100%', width: bar.interpolate({ inputRange: [0, 1], outputRange: ['10%', '90%'] }), backgroundColor: '#111827', borderRadius: 999 }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
