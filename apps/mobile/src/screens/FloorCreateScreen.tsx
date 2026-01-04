import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSessionGate } from '../lib/session';
import { compressImage, uploadToInputs } from '../lib/upload';
import { createJob } from '../lib/api';

export default function FloorCreateScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const title = route.params?.title || 'Floor Redesign';
  const mode = 'floor';
  const { userId } = useSessionGate();

  const [step, setStep] = useState<number>(1);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [floorType, setFloorType] = useState<string | null>(null);

  const floorOptions = useMemo(
    () => [
      'Light wood',
      'Dark wood',
      'Tile',
      'Stone',
      'Concrete',
      'Carpet',
      'Patterned tile',
      'Rug only'
    ],
    []
  );

  const floorImages = useMemo(
    () => ({
      'Light wood': require('../../assets/Light Wood Floor Type.png'),
      'Dark wood': require('../../assets/Dark Wood Floor Type.png'),
      Tile: require('../../assets/Tile Floor Type.png'),
      Stone: require('../../assets/Stone Floor Type.png'),
      Concrete: require('../../assets/Concrete Floor Type.png'),
      Carpet: require('../../assets/Carpet Floor Type.png'),
      'Patterned tile': require('../../assets/Patterend Floor Type.png'),
      'Rug only': require('../../assets/Rug Floor Type.png')
    }) as Record<string, any>,
    []
  );

  const handleBack = () => {
    if (step <= 1) nav.goBack();
    else setStep(step - 1);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!res.canceled) setLocalUri(res.assets[0].uri);
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!res.canceled) setLocalUri(res.assets[0].uri);
  };

  const uploadNow = async () => {
    if (!localUri) return;
    if (!userId) {
      Alert.alert('Not signed in', 'Please sign in to upload a photo.');
      return;
    }
    try {
      const compressed = await compressImage(localUri);
      const path = await uploadToInputs(userId, compressed);
      setUploadedPath(path);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message ?? 'Unable to upload image');
    }
  };

  const segmentsCount = 3;
  const completedSegments = Math.min(Math.max(step, 1), segmentsCount);

  const renderStep1 = () => (
    <View style={{ flex: 1, marginTop: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Upload Photo</Text>
      <View
        style={{
          width: '100%',
          aspectRatio: 0.8,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: '#e5e7eb',
          backgroundColor: '#f9fafb',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {localUri ? (
          <Image source={{ uri: localUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <TouchableOpacity onPress={takePhoto} style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minWidth: 180, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Take a photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minWidth: 180, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Choose from gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={() => setStep(2)}
        disabled={!localUri}
        style={{ backgroundColor: localUri ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1, marginTop: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Pick Floor Type</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          {floorOptions.map((opt) => {
            const active = floorType === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setFloorType(opt)}
                style={{ width: '48%', borderRadius: 12, borderWidth: active ? 2 : 1, borderColor: active ? '#111827' : '#e5e7eb', backgroundColor: active ? '#111827' : '#fff', overflow: 'hidden', paddingBottom: 12, alignItems: 'center' }}
              >
                {floorImages[opt] ? (
                  <Image source={floorImages[opt]} style={{ width: '100%', height: 96 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: '100%', height: 96, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>No preview</Text>
                  </View>
                )}
                <Text style={{ marginTop: 6, color: active ? '#fff' : '#111827', fontWeight: '600', textAlign: 'center' }}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <TouchableOpacity onPress={() => setStep(3)} disabled={!floorType} style={{ backgroundColor: floorType ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1, marginTop: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Review & Generate</Text>
      <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, backgroundColor: '#fff', gap: 12 }}>
        {localUri ? (
          <Image source={{ uri: localUri }} style={{ width: '100%', height: 180, borderRadius: 8 }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: 180, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#6b7280' }}>No photo selected</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#6b7280' }}>Floor Type</Text>
          <Text style={{ fontWeight: '600' }}>{floorType ?? '-'}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={async () => {
          try {
            if (!uploadedPath && localUri) {
              await uploadNow();
            }
            if (!uploadedPath) return Alert.alert('Missing photo');
            const constraints: any = { mode, floorType };
            const { jobId } = await createJob({ style: 'floor', constraints, inputImagePath: uploadedPath });
            nav.navigate('Progress', { jobId });
          } catch (e: any) {
            Alert.alert('Failed to start job', e.message);
          }
        }}
        disabled={!uploadedPath || !floorType}
        style={{ backgroundColor: uploadedPath && floorType ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Generate</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 16, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={handleBack} accessibilityRole="button" style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' }}>{title}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
        {Array.from({ length: segmentsCount }).map((_, idx) => (
          <View key={idx} style={{ flex: 1, height: 2, borderRadius: 999, backgroundColor: idx < completedSegments ? '#111827' : '#e5e7eb', marginRight: idx < segmentsCount - 1 ? 4 : 0 }} />
        ))}
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </View>
  );
}
