import React from 'react';
import { View, Text, Image, Pressable, Alert, Platform, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function ResultsScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const job = route.params?.job;
  const before = job?.inputSignedUrl;
  const after = job?.outputSignedUrls?.[0];
  const [showBefore, setShowBefore] = React.useState(false);
  const [aspect, setAspect] = React.useState<number | undefined>(undefined);
  const [containerSize, setContainerSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [imgSize, setImgSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => {
    if (after) {
      Image.getSize(
        after,
        (w, h) => {
          if (w && h) {
            setAspect(w / h);
            setImgSize({ w, h });
          }
        },
        () => {}
      );
    }
  }, [after]);

  const onSaveToGallery = React.useCallback(async () => {
    try {
      if (!after) return;
      setSaving(true);
      if (Platform.OS === 'web') {
        Alert.alert('Not available on web', 'Use a device build to save to gallery.');
        setSaving(false);
        return;
      }
      const MediaLibrary = await import('expo-media-library');
      const FileSystem = await import('expo-file-system');
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow Photos permission to save the image.');
        setSaving(false);
        return;
      }
      const fileName = `decorly_${Date.now()}.png`;
      const fileUri = (FileSystem as any).cacheDirectory + fileName;
      const dl = await (FileSystem as any).downloadAsync(after, fileUri);
      await (MediaLibrary as any).saveToLibraryAsync(dl.uri);
      Alert.alert('Saved', 'Image added to your gallery.');
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Unable to save image');
    } finally {
      setSaving(false);
    }
  }, [after]);

  const onShare = React.useCallback(async () => {
    try {
      if (!after) return;
      if (Platform.OS === 'web' && (navigator as any)?.share) {
        try {
          await (navigator as any).share({ title: 'Decorly result', url: after });
          return;
        } catch {}
      }
      await Share.share({ message: after, url: after });
    } catch (e: any) {
      Alert.alert('Share failed', e?.message || 'Unable to share');
    }
  }, [after]);
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
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ transform: [{ translateY: -200 }], width: '100%', alignItems: 'center' }}>
          <View
            onLayout={(e) => setContainerSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
            style={{ width: '92%', alignSelf: 'center', aspectRatio: aspect ?? 3/4, backgroundColor: 'transparent', position: 'relative' }}
          >
            {after ? (
              <Image source={{ uri: after }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            ) : null}
            {before && showBefore ? (
              <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'transparent' }} pointerEvents="none">
                <Image source={{ uri: before }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
            ) : null}
          </View>
          <View style={{ width: '92%', alignSelf: 'center', alignItems: 'center', marginTop: 8 - vPad, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={() => nav.navigate('Home')}
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
                onPress={onShare}
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
                onPress={onSaveToGallery}
                disabled={saving}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#0f172a' : '#111827',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  opacity: saving ? 0.6 : 1,
                  marginLeft: 8
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving…' : 'Add to gallery'}</Text>
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
    </View>
  );
}
