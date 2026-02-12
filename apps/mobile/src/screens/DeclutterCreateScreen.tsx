import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useSessionGate } from '../lib/session';
import { compressImage, uploadToInputs } from '../lib/upload';
import { createJob } from '../lib/api';
import PhotoGuideModal from '../components/PhotoGuideModal';

export default function DeclutterCreateScreen() {
  const nav = useNavigation<any>();
  const { userId } = useSessionGate();
  const handleExit = () => {
    nav.navigate('Home');
  };
  const [step, setStep] = useState<number>(1);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    })();
  }, []);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!res.canceled) setLocalUri(res.assets[0].uri);
  };
  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!res.canceled) setLocalUri(res.assets[0].uri);
  };

  const uploadIfNeeded = async () => {
    if (!localUri) return null;
    if (uploadedPath) return uploadedPath;
    if (!userId) throw new Error('No user');
    const compressed = await compressImage(localUri);
    const path = await uploadToInputs(userId, compressed);
    setUploadedPath(path);
    return path;
  };

  const submitJob = async () => {
    try {
      let finalPath = uploadedPath;
      if (!finalPath && localUri) finalPath = await uploadIfNeeded();
      if (!localUri || !finalPath) return Alert.alert('Missing photo');
      const body: any = {
        style: 'Declutter',
        constraints: { mode: 'declutter' },
        inputImagePath: finalPath
      };
      const { jobId } = await createJob(body);
      nav.navigate('Progress', { jobId });
    } catch (e: any) {
      (e?.statusCode===402 ? nav.navigate('Paywall') : Alert.alert('Failed to start job', e?.message || ''));
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() => nav.goBack()}
            accessibilityRole="button"
            style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' }}>Declutter</Text>
          <TouchableOpacity
            onPress={handleExit}
            accessibilityRole="button"
            style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
          >
            <Ionicons name="close" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {step === 1 && (
          <View style={{ flex: 1, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>Add Photo</Text>
              <TouchableOpacity
                onPress={() => setShowGuide(true)}
                style={{ backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#111827', flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="information-circle-outline" size={16} color="#111827" />
                <Text style={{ marginLeft: 6, color: '#111827', fontWeight: '600' }}>Photo tips</Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                width: '100%',
                aspectRatio: 0.9,
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
        )}

        {step === 2 && (
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
            </View>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={submitJob} disabled={!localUri} style={{ backgroundColor: localUri ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Generate</Text>
            </TouchableOpacity>
          </View>
        )}
        <PhotoGuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
      </View>
    </SafeAreaView>
  );
}


