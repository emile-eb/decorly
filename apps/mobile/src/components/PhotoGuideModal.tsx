import React from 'react';
import { View, Text, Pressable, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TIPS = [
  'Shoot in daylight or bright, even lighting',
  'Keep the camera level and avoid extreme angles',
  'Step back to capture the full room',
  'Clear clutter from the main surfaces',
  'Wipe the lens for a sharp image'
];

export default function PhotoGuideModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  const example = require('../../assets/Photo Tips Example Photo.png');
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 999 }}>
      <Pressable
        onPress={onClose}
        style={[
          { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
          Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : null
        ]}
      />
      <View style={{ marginTop: 80, marginHorizontal: 16, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#111827' }}>Photo tips</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: pressed ? '#e5e7eb' : '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center'
            })}
          >
            <Ionicons name="close" size={16} color="#111827" />
          </Pressable>
        </View>
        <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb', marginBottom: 10 }}>
          <Image source={example} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        {TIPS.map((tip) => (
          <View key={tip} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Ionicons name="checkmark" size={12} color="#ffffff" />
            </View>
            <Text style={{ color: '#111827' }}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
