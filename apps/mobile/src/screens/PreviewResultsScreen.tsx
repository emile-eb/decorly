import React from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PreviewResultsScreen() {
  const [showBefore, setShowBefore] = React.useState(false);
  const before = require('../../assets/int ex 4.jpg');
  const after = require('../../assets/int ex 5.jpg');
  // Force a taller preview aspect ratio to visualize layout with vertical images
  const aspect = 3 / 5; // width / height (taller than 3/4)
  const [containerSize, setContainerSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [imgSize, setImgSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  React.useEffect(() => {
    try {
      const src = Image.resolveAssetSource(after) as any;
      if (src?.width && src?.height) setImgSize({ w: src.width, h: src.height });
    } catch {}
  }, []);
  const vPad = React.useMemo(() => {
    const { w: cw, h: ch } = containerSize;
    const { w: iw, h: ih } = imgSize;
    if (!cw || !ch || !iw || !ih) return 0;
    const cr = cw / ch;
    const r = iw / ih;
    const displayedH = r >= cr ? cw / r : ch;
    return Math.max(0, (ch - displayedH) / 2);
  }, [containerSize, imgSize]);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ transform: [{ translateY: -200 }], width: '100%', alignItems: 'center' }}>
          <View
            onLayout={(e) => setContainerSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
            style={{ width: '92%', alignSelf: 'center', aspectRatio: aspect ?? 3/4, backgroundColor: 'transparent', position: 'relative' }}
          >
            <Image source={after} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            {showBefore ? (
              <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="none">
                <Image source={before} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
            ) : null}
          </View>
          <View style={{ width: '92%', alignSelf: 'center', alignItems: 'center', marginTop: 8 - vPad, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={() => {}}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#0f172a' : '#111827',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Done</Text>
              </Pressable>
              <Pressable
                onPress={() => Alert.alert('Preview', 'Sharing is not available in preview.')}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#0f172a' : '#111827',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  marginLeft: 8
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Share</Text>
              </Pressable>
              <Pressable
                onPress={() => Alert.alert('Preview', 'This is a preview. Run a generation to save the output to your gallery.')}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#0f172a' : '#111827',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  marginLeft: 8
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Add to gallery</Text>
              </Pressable>
            </View>
            <View>
              <Pressable
                onPressIn={() => setShowBefore(true)}
                onPressOut={() => setShowBefore(false)}
                style={({ pressed }) => ({
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.9 : 1
                })}
              >
                <Ionicons name="eye" size={22} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
