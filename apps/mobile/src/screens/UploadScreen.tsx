import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Button, Image, Alert, TouchableOpacity, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { compressImage, uploadToInputs } from '../lib/upload';
import { useSessionGate } from '../lib/session';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function UploadScreen() {
  const [uri, setUri] = useState<string | null>(null);
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const mode = route.params?.mode as string | undefined;
  const { userId } = useSessionGate();
  const examplePhotos = useMemo(
    () => [
      'https://picsum.photos/seed/decorly-ex-1/800/600',
      'https://picsum.photos/seed/decorly-ex-2/800/600',
      'https://picsum.photos/seed/decorly-ex-3/800/600',
      'https://picsum.photos/seed/decorly-ex-4/800/600'
    ],
    []
  );

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    })();
  }, []);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!res.canceled) setUri(res.assets[0].uri);
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!res.canceled) setUri(res.assets[0].uri);
  };

  const proceed = async () => {
    try {
      if (!uri) return;
      if (!userId) throw new Error('No user');
      const compressed = await compressImage(uri);
      const path = await uploadToInputs(userId, compressed);
      nav.navigate('Style', { inputImagePath: path, inputLocalUri: uri });
    } catch (e: any) {
      Alert.alert('Upload failed', e.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, paddingTop: 56, backgroundColor: '#ffffff' }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>Add Photo</Text>
      <View
        style={{
          width: '100%',
          aspectRatio: 1,
          borderWidth: 5,
          borderStyle: 'dashed',
          borderColor: '#e5e7eb',
          backgroundColor: '#f9fafb',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={takePhoto}
              style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minWidth: 180, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Take a photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickImage}
              style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minWidth: 180, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Choose from gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 16 }} />
      <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>My Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
        {[...(uri ? [uri] : []), ...examplePhotos].map((u, idx) => (
          <TouchableOpacity key={String(idx)} onPress={() => setUri(u)}>
            <Image source={{ uri: u }} style={{ width: 96, height: 96, borderRadius: 8, marginRight: 10, borderWidth: u === uri ? 2 : 1, borderColor: u === uri ? '#111827' : '#e5e7eb' }} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={proceed}
        disabled={!uri}
        style={{
          backgroundColor: uri ? '#111827' : '#9ca3af',
          paddingVertical: 16,
          borderRadius: 20,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}
