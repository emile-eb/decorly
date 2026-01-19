import React from 'react';
import { View, Text } from 'react-native';

export default function CanvasColorWheel({ size = 260 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#6b7280', textAlign: 'center', paddingHorizontal: 12 }}>Custom color wheel is available on web. Enter HEX below.</Text>
    </View>
  );
}

