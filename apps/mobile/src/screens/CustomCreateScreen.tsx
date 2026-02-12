import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSessionGate } from '../lib/session';
import { compressImage, uploadToInputs } from '../lib/upload';
import { createJob } from '../lib/api';
import PhotoGuideModal from '../components/PhotoGuideModal';

export default function CustomCreateScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const title = route.params?.title || 'Custom';
  const { userId } = useSessionGate();

  const [step, setStep] = useState<number>(1);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [descText, setDescText] = useState<string>('');
  const [showGuide, setShowGuide] = useState(false);

  const initialImageUri = route.params?.initialImageUri as string | undefined;
  const startStep = route.params?.startStep as number | undefined;

  const handleBack = () => {
    if (step <= 1) nav.navigate('Home');
    else setStep(step - 1);
  };
  const handleExit = () => {
    nav.navigate('Home');
  };

  useEffect(() => {
    if (initialImageUri && !localUri) setLocalUri(initialImageUri);
    if (typeof startStep === 'number' && startStep > 1 && step === 1) setStep(startStep);
  }, [initialImageUri, startStep, localUri, step]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed', 'Allow photo library access.');
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
      if (!res.canceled) setLocalUri(res.assets[0].uri);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unable to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed', 'Allow camera access.');
      const res = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!res.canceled) setLocalUri(res.assets[0].uri);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unable to take photo');
    }
  };

  const uploadNow = async (): Promise<string | null> => {
    if (!localUri) return null;
    if (!userId) {
      Alert.alert('Not signed in', 'Please sign in to upload a photo.');
      return null;
    }
    try {
      const compressed = await compressImage(localUri);
      const path = await uploadToInputs(userId, compressed);
      setUploadedPath(path);
      return path;
    } catch (e: any) {
      console.error('[ui] CustomCreate upload error', e);
      Alert.alert('Upload failed', e?.message ?? 'Unable to upload image');
      return null;
    }
  };

  const renderStep1 = () => (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }} style={{ flex: 1, marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Upload Photo</Text>
        <TouchableOpacity
          onPress={() => setShowGuide(true)}
          style={{ backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#111827', flexDirection: 'row', alignItems: 'center' }}
        >
          <Ionicons name="information-circle-outline" size={16} color="#111827" />
          <Text style={{ marginLeft: 6, color: '#111827', fontWeight: '600' }}>Photo tips</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width: '100%', aspectRatio: 0.9, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {localUri ? (
          <Image source={{ uri: localUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity onPress={takePhoto} style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minWidth: 180, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Take a photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minWidth: 180, alignItems: 'center', marginTop: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Choose from gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={() => setStep(2)} disabled={!localUri} style={{ backgroundColor: localUri ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }} style={{ flex: 1, marginTop: 8 }}>
        <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          {localUri ? (
            <Image source={{ uri: localUri }} style={{ width: '100%', height: 260 }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: 260, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#6b7280' }}>No photo selected</Text>
            </View>
          )}
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Describe your custom transformation</Text>
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, minHeight: 240, position: 'relative' }}>
            <TextInput
              value={descText}
              onChangeText={(t) => setDescText(t.slice(0, 450))}
              multiline
              placeholder="e.g. Modern boho living room with warm wood, sage green accents, and a plush white rug"
              placeholderTextColor="#9ca3af"
              style={{ minHeight: 200 }}
            />
            <Text style={{ position: 'absolute', left: 12, bottom: 8, color: '#6b7280', fontSize: 12 }}>{descText.length}/450</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={async () => {
            try {
              let path = uploadedPath;
              if (!path && localUri) {
                path = await uploadNow();
              }
              if (!path) return Alert.alert('Missing photo');
              if (!descText.trim()) return Alert.alert('Missing prompt', 'Please describe your custom transformation.');
              const constraints: any = { mode: 'interior', choices: { style: 'Custom', customStyle: descText.trim() } };
              const { jobId } = await createJob({ style: 'Custom', constraints, inputImagePath: path });
              nav.navigate('Progress', { jobId });
            } catch (e: any) {
              console.error('[ui] CustomCreate generate error', e);
              (e?.statusCode===402 ? nav.navigate('Paywall') : Alert.alert('Failed to start job', e?.message || ''));
            }
          }}
          disabled={!localUri || !descText.trim()}
          style={{ backgroundColor: localUri && descText.trim() ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Generate</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 16, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={handleBack} accessibilityRole="button" style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' }}>{title}</Text>
          <TouchableOpacity
            onPress={handleExit}
            accessibilityRole="button"
            style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
          >
            <Ionicons name="close" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
          {Array.from({ length: 2 }).map((_, idx) => (
            <View key={idx} style={{ flex: 1, height: 2, borderRadius: 999, backgroundColor: idx < Math.min(Math.max(step, 1), 2) ? '#111827' : '#e5e7eb', marginRight: idx < 1 ? 4 : 0 }} />
          ))}
        </View>

        <View style={{ flex: 1, marginTop: 6 }}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </View>
        <PhotoGuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
      </View>
    </SafeAreaView>
  );
}
