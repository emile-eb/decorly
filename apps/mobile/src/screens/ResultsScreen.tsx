import React from 'react';
import { View, Text, Image, Pressable, Alert, Platform, Share, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

export default function ResultsScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const job = route.params?.job;
  const showCongrats = route.params?.showCongrats !== false;
  const before = job?.inputSignedUrl;
  const after = job?.outputSignedUrls?.[0];
  const [showBefore, setShowBefore] = React.useState(false);
  const [aspect, setAspect] = React.useState<number | undefined>(undefined);
  const [imgSize, setImgSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [saving, setSaving] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editChoice, setEditChoice] = React.useState<string | null>(null);
  const editOptions = ['New Floor', 'Paint', 'Replace object', 'Custom'];
  const baseScale = React.useRef(new Animated.Value(1)).current;
  const pinchScale = React.useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);

  const onPinchEvent = Animated.event([{ nativeEvent: { scale: pinchScale } }], { useNativeDriver: true });
  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const nextScale = event.nativeEvent.scale;
      baseScale.setValue(Math.min(3, Math.max(1, nextScale)));
      pinchScale.setValue(1);
    }
  };

  React.useEffect(() => {
    nav.setOptions({
      headerBackVisible: false,
      gestureEnabled: false,
      headerLeft: () => null,
      headerTitle: '',
      headerRight: () => (
        <Pressable
          onPress={() => nav.navigate('History')}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            borderRadius: 999,
            backgroundColor: pressed ? '#e5e7eb' : '#f3f4f6',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8
          })}
        >
          <Ionicons name="close" size={18} color="#111827" />
        </Pressable>
      )
    });
  }, [nav]);

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
      const mediaLib = await import('expo-media-library');
      const fsMod = await import('expo-file-system');
      const ml = (mediaLib as any).default ?? mediaLib;
      const fs = (fsMod as any).default ?? fsMod;
      const requestPermissionsAsync =
        (ml as any).requestPermissionsAsync ?? (mediaLib as any).requestPermissionsAsync;
      const saveToLibraryAsync = (ml as any).saveToLibraryAsync ?? (mediaLib as any).saveToLibraryAsync;
      const downloadAsync = (fs as any).downloadAsync ?? (fsMod as any).downloadAsync;
      const cacheDirectory = (fs as any).cacheDirectory ?? (fsMod as any).cacheDirectory;
      if (typeof requestPermissionsAsync !== 'function' || typeof saveToLibraryAsync !== 'function') {
        throw new Error('Media library is unavailable');
      }
      if (typeof downloadAsync !== 'function' || typeof cacheDirectory !== 'string') {
        throw new Error('File system is unavailable');
      }
      const perm = await requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow Photos permission to save the image.');
        setSaving(false);
        return;
      }
      const fileName = `decorly_${Date.now()}.png`;
      const fileUri = cacheDirectory + fileName;
      const dl = await downloadAsync(after, fileUri);
      await saveToLibraryAsync(dl.uri);
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
      if (typeof (Share as any)?.share !== 'function') {
        throw new Error('Share is unavailable');
      }
      if (Platform.OS !== 'web') {
        const fsMod = await import('expo-file-system');
        const fs = (fsMod as any).default ?? fsMod;
        const downloadAsync = (fs as any).downloadAsync ?? (fsMod as any).downloadAsync;
        const cacheDirectory = (fs as any).cacheDirectory ?? (fsMod as any).cacheDirectory;
        if (typeof downloadAsync === 'function' && typeof cacheDirectory === 'string') {
          const fileName = `decorly_share_${Date.now()}.png`;
          const fileUri = cacheDirectory + fileName;
          await downloadAsync(after, fileUri);
          await Share.share({ url: fileUri });
        } else {
          await Share.share({ url: after, message: after });
        }
        return;
      }
      await Share.share({ message: after, url: after });
    } catch (e: any) {
      Alert.alert('Share failed', e?.message || 'Unable to share');
    }
  }, [after]);

  const onStartEdit = React.useCallback(() => {
    if (!after) {
      Alert.alert('Missing image', 'No generated image found.');
      return;
    }
    if (!editChoice) {
      Alert.alert('Select an edit', 'Choose an edit type first.');
      return;
    }
    const params = { initialImageUri: after, startStep: 2 };
    if (editChoice === 'New Floor') return nav.navigate('FloorCreate', params);
    if (editChoice === 'Paint') return nav.navigate('PaintCreate', params);
    if (editChoice === 'Replace object') return nav.navigate('ReplaceCreate', params);
    return nav.navigate('CustomCreate', { ...params, title: 'Custom Design', mode: 'custom' });
  }, [after, editChoice, nav]);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView contentContainerStyle={{ paddingTop: 0, paddingBottom: 24, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '92%', alignSelf: 'center' }}>
          {showCongrats && (
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', textAlign: 'left', marginBottom: 12 }} numberOfLines={1}>
              Congratulations your design is complete!
            </Text>
          )}
          <View style={{ width: '100%', aspectRatio: aspect ?? 3 / 4, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
            <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
              <Animated.View style={{ width: '100%', height: '100%', transform: [{ scale }] }}>
                {after ? (
                  <Image source={{ uri: after }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                ) : null}
                {before && showBefore ? (
                  <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'transparent' }} pointerEvents="none">
                    <Image source={{ uri: before }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                  </View>
                ) : null}
              </Animated.View>
            </PinchGestureHandler>
            {!!before && (
              <Pressable
                onPressIn={() => setShowBefore(true)}
                onPressOut={() => setShowBefore(false)}
                style={({ pressed }) => ({
                  position: 'absolute',
                  right: 12,
                  bottom: 12,
                  backgroundColor: pressed ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.65)',
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center'
                })}
              >
                <Ionicons name="eye" size={16} color="#ffffff" />
              </Pressable>
            )}
          </View>

          <View style={{ marginTop: 16, backgroundColor: '#f9fafb', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', padding: 14 }}>
            <Text style={{ color: '#111827', fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Make edits to your design</Text>
            <Pressable
              onPress={() => setEditOpen((v) => !v)}
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: pressed ? '#111827' : '#e5e7eb',
                backgroundColor: '#ffffff',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              })}
            >
              <Text style={{ color: editChoice ? '#111827' : '#6b7280', fontWeight: '600' }}>{editChoice || 'Choose an edit'}</Text>
              <Ionicons name={editOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#6b7280" />
            </Pressable>
            {editOpen && (
              <View style={{ marginTop: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#ffffff', overflow: 'hidden' }}>
                {editOptions.map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      setEditChoice(opt);
                      setEditOpen(false);
                    }}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      backgroundColor: pressed ? '#f3f4f6' : '#ffffff',
                      borderBottomWidth: opt === editOptions[editOptions.length - 1] ? 0 : 1,
                      borderColor: '#e5e7eb'
                    })}
                  >
                    <Text style={{ color: '#111827', fontWeight: '600' }}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <Pressable
              onPress={onStartEdit}
              style={({ pressed }) => ({
                marginTop: 10,
                backgroundColor: pressed ? '#cc0000' : '#ff0000',
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center'
              })}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700' }}>Start edit</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Pressable
              onPress={onSaveToGallery}
              disabled={saving}
              style={({ pressed }) => ({
                flexGrow: 1,
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: pressed ? '#111827' : '#e5e7eb',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 14,
                alignItems: 'center',
                opacity: saving ? 0.6 : 1
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="download-outline" size={18} color="#111827" />
                <Text style={{ color: '#111827', fontWeight: '700', marginLeft: 8 }}>{saving ? 'Saving...' : 'Save to gallery'}</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={onShare}
              style={({ pressed }) => ({
                flexGrow: 1,
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: pressed ? '#111827' : '#e5e7eb',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 14,
                alignItems: 'center'
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="share-social-outline" size={18} color="#111827" />
                <Text style={{ color: '#111827', fontWeight: '700', marginLeft: 8 }}>Share</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => nav.navigate('Home')}
              style={({ pressed }) => ({
                flexGrow: 1,
                borderWidth: 1,
                borderColor: pressed ? '#111827' : '#e5e7eb',
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 14,
                alignItems: 'center'
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#111827" />
                <Text style={{ color: '#111827', fontWeight: '700', marginLeft: 8 }}>Done</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
