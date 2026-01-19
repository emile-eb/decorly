import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, Dimensions, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSessionGate } from '../lib/session';
import { compressImage, uploadToInputs } from '../lib/upload';
import { createJob } from '../lib/api';

type Palette = { label: string; colors: string[] };

export default function GardenCreateScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const title = route.params?.title || 'Garden Design';
  const mode = 'garden';
  const { userId } = useSessionGate();

  const [step, setStep] = useState<number>(1);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  // Step 2 – site conditions
  const [areaType, setAreaType] = useState<string | null>(null);
  const [sunlight, setSunlight] = useState<string | null>(null);
  const [zone, setZone] = useState<string>('');
  const [soilType, setSoilType] = useState<string | null>(null);
  const [drainage, setDrainage] = useState<string | null>(null);
  const [slope, setSlope] = useState<string | null>(null);
  const [wind, setWind] = useState<string | null>(null);

  // Step 3 – style + palette
  const [style, setStyle] = useState<string | null>(null);
  const [customStyle, setCustomStyle] = useState<string>('');
  const [customOverlayOpen, setCustomOverlayOpen] = useState<boolean>(false);
  const [palette, setPalette] = useState<Palette | null>(null);

  // Step 4 – features & budget
  const [features, setFeatures] = useState<string[]>([]);
  const [maintenance, setMaintenance] = useState<string | null>(null);
  const [irrigation, setIrrigation] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [pets, setPets] = useState<boolean>(false);
  const [kids, setKids] = useState<boolean>(false);

  const areaTypes = useMemo(() => ['Front Yard', 'Backyard', 'Side Yard', 'Courtyard', 'Balcony/Patio'], []);
  const sunOptions = useMemo(() => ['Full Sun', 'Partial', 'Shade'], []);
  const soilOptions = useMemo(() => ['Clay', 'Loam', 'Sandy'], []);
  const drainageOptions = useMemo(() => ['Good', 'Moderate', 'Poor'], []);
  const slopeOptions = useMemo(() => ['Flat', 'Gentle', 'Steep'], []);
  const windOptions = useMemo(() => ['Sheltered', 'Exposed'], []);

  const gardenStyles = useMemo(
    () => [
      'Custom',
      'Cottage',
      'Modern Minimal',
      'Mediterranean',
      'Japanese',
      'Desert / Drought‑tolerant',
      'Woodland',
      'Pollinator',
      'French',
    'Tropical',
    'Bohemian',
    
    ],
    []
  );

  const gardenPalettes = useMemo<Palette[]>(
    () => [
      { label: 'Cool Greens', colors: ['#9FBCA1', '#6F8F72', '#3E5C44'] },
      { label: 'Warm Neutrals', colors: ['#D8CBB6', '#B39B7B', '#7D6A57'] },
      { label: 'Seasonal Color', colors: ['#8FBF7F', '#E89F6B', '#C95C5C'] },
      { label: 'White Garden', colors: ['#F7F7F7', '#DADADA', '#A5A5A5'] },
      { label: 'Native Wildflower', colors: ['#6FA66D', '#C4D96B', '#F1C75B'] }
    ],
    []
  );

  const featureOptions = useMemo(
    () => [
      'Furniture',
      'Swimming Pool',
      'Gazebo',
      'Flowers',
      'Fire Pit',
      'Kids Slide',
      'BBQ',
      'Stone Path',
      'Produce'
    ],
    []
  );

  const featureImages = useMemo(
    () => ({
      'Furniture': require('../../assets/Furniture Garden Feature.png'),
      'Swimming Pool': require('../../assets/Pool Garden Feature.png'),
      'Gazebo': require('../../assets/Gazebo Garden Feature.png'),
      'Flowers': require('../../assets/Flower Garden Feature.png'),
      'Fire Pit': require('../../assets/Firepit Garden Feature.png'),
      'Kids Slide': require('../../assets/Playset Garden Feature.png'),
      'BBQ': require('../../assets/BBQ Garden Feature.png'),
      'Stone Path': require('../../assets/Stone Walkway Garden Feature.png'),
      'Produce': require('../../assets/Produce Garden Feature.png')
    }) as Record<string, any>,
    []
  );

  // Local images for some garden styles (filenames may contain typos by design)
  const gardenStyleImages = useMemo(() => ({
    Mediterranean: require('../../assets/Mediterranean Garden Style.png'),
    'Modern Minimal': require('../../assets/Modern Minimalism Garden Stlye.png'),
    Pollinator: require('../../assets/Polinator Garden Stlye.png'),
    Tropical: require('../../assets/Tropical Garden Style.png'),
    Woodland: require('../../assets/Woodland Garden Stlye.png'),
    Cottage: require('../../assets/Cottage  Garden Style.png'),
    Japanese: require('../../assets/Japanese Garden Style.png'),
    French: require('../../assets/French Garden Style.png'),
    Bohemian: require('../../assets/Bohemain Garden Style.png'),
    'Desert / Drought-tolerant': require('../../assets/Desert Garden Style.png'),
    'Desert / Drought�?`tolerant': require('../../assets/Desert Garden Style.png')
  }) as Record<string, any>, []);

  const resolveStyleImage = (label: string) => {
    try {
      const canonical = label
        .normalize('NFKC')
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
      return gardenStyleImages[canonical] ?? gardenStyleImages[label];
    } catch {
      return gardenStyleImages[label];
    }
  };

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

  const toggleFeature = (f: string) => {
    setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const handleBack = () => {
    if (step <= 1) {
      nav.navigate('Home');
    } else {
      setStep(step - 1);
    }
  };

  const continueFromStep1 = async () => {
    setStep(2);
  };

  const submitJob = async () => {
    try {
      if (!localUri || !uploadedPath) return Alert.alert('Missing photo');
      if (!areaType) return Alert.alert('Select an area');
      if (!sunlight) return Alert.alert('Select sun exposure');
      if (!soilType || !drainage || !slope || !wind) return Alert.alert('Complete site conditions');
      if (!style) return Alert.alert('Select a style');
      if (style === 'Custom' && !customStyle.trim()) return Alert.alert('Describe your custom style');
      if (!palette) return Alert.alert('Select a color palette');
      if (!maintenance || !irrigation || !budget) return Alert.alert('Select maintenance, irrigation, and budget');

      const body: any = {
        style: style === 'Custom' ? customStyle.trim() : style,
        constraints: {
          mode,
          area_type: areaType,
          sunlight,
          zone: zone || undefined,
          soil_type: soilType,
          drainage,
          slope,
          wind,
          palette: palette.label,
          palette_colors: palette.colors,
          features,
          maintenance,
          irrigation,
          budget,
          household: { pets, kids }
        },
        inputImagePath: uploadedPath
      };
      const { jobId } = await createJob(body);
      nav.navigate('Progress', { jobId });
    } catch (e: any) {
      console.error('[ui] GardenCreate submitJob error', e);
      (e?.statusCode===402 ? nav.navigate('Paywall') : Alert.alert('Failed to start job', e?.message || ''));
    }
  };

  // Use local example photos added to assets (resolved to URIs)
  const gardenExampleModules = useMemo(
    () => [
      require('../../assets/Garden Design Example.jpg'),
      require('../../assets/Garden Design Example 2.jpg'),
      require('../../assets/Garden Design Example 3.jpg'),
      require('../../assets/Garden Design Example 4.jpg'),
      require('../../assets/Garden Design Example 6.png')
    ],
    []
  );
  const examplePhotos = useMemo(() => gardenExampleModules.map((m) => Asset.fromModule(m).uri), [gardenExampleModules]);

  const renderChip = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: active ? 2 : 1,
        borderColor: active ? '#111827' : '#e5e7eb',
        backgroundColor: active ? '#111827' : '#fff'
      }}
    >
      <Text style={{ color: active ? '#fff' : '#111827', fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );

  const renderStep1 = () => (
    <View style={{ flex: 1, marginTop: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Add Photo</Text>
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
            <TouchableOpacity
              onPress={async () => {
                const res = await ImagePicker.launchCameraAsync({ quality: 1 });
                if (!res.canceled) setLocalUri(res.assets[0].uri);
              }}
              style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minWidth: 180, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Take a photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
                if (!res.canceled) setLocalUri(res.assets[0].uri);
              }}
              style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minWidth: 180, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Choose from gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{ height: 16 }} />
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Example Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
        {examplePhotos.map((u, idx) => (
          <TouchableOpacity key={String(idx)} onPress={() => setLocalUri(u)}>
            <Image
              source={{ uri: u }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 8,
                marginRight: 10,
                borderWidth: localUri === u ? 2 : 1,
                borderColor: localUri === u ? '#111827' : '#e5e7eb'
              }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={async () => {
          try {
            if (!localUri) return;
            const compressed = await compressImage(localUri);
            const path = await uploadToInputs(userId, compressed);
            setUploadedPath(path);
            setStep(2);
          } catch (e: any) {
            Alert.alert('Upload failed', e.message);
          }
        }}
        disabled={!localUri}
        style={{ backgroundColor: localUri ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1, marginTop: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Choose Area Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
        {areaTypes.map((a) => {
          const active = areaType === a;
          return (
            <TouchableOpacity
              key={a}
              onPress={() => setAreaType(a)}
              style={{
                width: '48%',
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: active ? 2 : 1,
                borderColor: active ? '#111827' : '#e5e7eb',
                alignItems: 'center',
                backgroundColor: active ? '#111827' : '#fff'
              }}
            >
              <Text style={{ color: active ? '#fff' : '#111827', fontWeight: '600', fontSize: 16, textAlign: 'center' }}>{a}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={() => setStep(3)} disabled={!areaType} style={{ backgroundColor: areaType ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1, marginTop: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Choose Style</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <Text style={{ color: '#6b7280', marginBottom: 6 }}>Style</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 12 }}>
          {(['No Style', ...gardenStyles] as string[]).map((s) => {
            const active = style === s;
          const blank = { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=' };
          const source = s === 'Custom'
            ? blank
            : s === 'No Style'
            ? null
            : resolveStyleImage(s) ?? { uri: `https://picsum.photos/seed/garden-${encodeURIComponent(s)}/300/200` };
            return (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  setStyle(s);
                  if (s === 'Custom') {
                    setCustomOverlayOpen(true);
                  } else {
                    setCustomOverlayOpen(false);
                    setCustomStyle('');
                  }
                }}
                style={{
                  width: '48%',
                  paddingTop: 0,
                  paddingBottom: 12,
                  borderRadius: 12,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? '#111827' : '#e5e7eb',
                  alignItems: 'center',
                  backgroundColor: active ? '#111827' : '#fff',
                  overflow: 'hidden'
                }}
              >
                {s === 'No Style' ? (
                  <View style={{ width: '100%', height: 120, marginBottom: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
                    <View style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: '#111827', alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 4, height: 72, backgroundColor: '#111827', transform: [{ rotate: '45deg' }] }} />
                    </View>
                  </View>
                ) : (
                  <Image source={source as any} style={{ width: '100%', height: 120, marginBottom: 8 }} resizeMode="cover" />
                )}
                <Text style={{ color: active ? '#fff' : '#111827', fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {customOverlayOpen && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 50, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={[
              { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
              Platform.OS === 'web' ? ({ backdropFilter: 'blur(10px)' } as any) : null
            ]}
          />
          {(() => {
            const { width, height } = Dimensions.get('window');
            const boxSize = Math.floor(Math.min(width, height) * 0.8);
            return (
              <View style={{ width: boxSize, height: boxSize, backgroundColor: '#ffffff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
                <Text style={{ marginBottom: 8, fontSize: 16, fontWeight: '600', color: '#111827' }}>Describe your custom style</Text>
                <TextInput
                  value={customStyle}
                  onChangeText={setCustomStyle}
                  placeholder={'e.g., Native meadow with winding path'}
                  style={{ flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, textAlignVertical: 'top' }}
                  multiline
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => { setStyle(null); setCustomStyle(''); setCustomOverlayOpen(false); }}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#e5e7eb' }}
                  >
                    <Text style={{ color: '#111827', fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCustomOverlayOpen(false)}
                    disabled={!customStyle.trim()}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: customStyle.trim() ? '#111827' : '#9ca3af' }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '700' }}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </View>
      )}

      <TouchableOpacity
        onPress={() => setStep(4)}
        disabled={!style || (style === 'Custom' && !customStyle.trim())}
        style={{ backgroundColor: !style || (style === 'Custom' && !customStyle.trim()) ? '#9ca3af' : '#111827', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={{ flex: 1, marginTop: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Choose Features</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          {featureOptions.map((f) => {
            const active = features.includes(f);
            const source = featureImages[f] ?? { uri: `https://picsum.photos/seed/garden-feature-${encodeURIComponent(f)}/300/200` };
            return (
              <TouchableOpacity
                key={f}
                onPress={() => toggleFeature(f)}
                style={{
                  width: '48%',
                  paddingTop: 0,
                  paddingBottom: 12,
                  borderRadius: 12,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? '#111827' : '#e5e7eb',
                  alignItems: 'center',
                  backgroundColor: active ? '#111827' : '#fff',
                  overflow: 'hidden'
                }}
              >
                <Image source={source} style={{ width: '100%', height: 120, marginBottom: 8 }} resizeMode="cover" />
                <Text style={{ color: active ? '#fff' : '#111827', fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <TouchableOpacity
        onPress={() => setStep(5)}
        disabled={!areaType || !style || (style === 'Custom' && !customStyle.trim())}
        style={{ backgroundColor: areaType && style && (!(style === 'Custom') || !!customStyle.trim()) ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep5 = () => (
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#6b7280' }}>Area</Text>
          <Text style={{ fontWeight: '600' }}>{areaType ?? '-'}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#6b7280' }}>Style</Text>
          <Text style={{ fontWeight: '600' }}>{style === 'Custom' ? (customStyle || 'Custom') : (style ?? '-')}</Text>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={{ color: '#6b7280' }}>Features</Text>
          {features.length ? (
            <Text style={{ fontWeight: '600' }}>{features.join(', ')}</Text>
          ) : (
            <Text style={{ color: '#9ca3af' }}>None selected</Text>
          )}
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={async () => {
          try {
            let finalPath = uploadedPath;
            if (!finalPath && localUri) {
              const compressed = await compressImage(localUri);
              finalPath = await uploadToInputs(userId, compressed);
              setUploadedPath(finalPath);
            }
            if (!finalPath) return Alert.alert('Missing photo');
            const outStyle = style === 'Custom' ? (customStyle.trim() || 'custom') : (style === 'No Style' ? 'none' : style);
            const body: any = {
              style: outStyle,
              constraints: { mode, area_type: areaType, features },
              inputImagePath: finalPath
            };
            const { jobId } = await createJob(body);
            nav.navigate('Progress', { jobId });
          } catch (e: any) {
            console.error('[ui] GardenCreate generate error', e);
            (e?.statusCode===402 ? nav.navigate('Paywall') : Alert.alert('Failed to start job', e?.message || ''));
          }
        }}
        disabled={!(uploadedPath || localUri) || !areaType || !style || (style === 'Custom' && !customStyle.trim())}
        style={{ backgroundColor: (uploadedPath || localUri) && areaType && style && (!(style === 'Custom') || !!customStyle.trim()) ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Generate</Text>
      </TouchableOpacity>
    </View>
  );


  const segmentsCount = 4;
  const completedSegments = Math.min(Math.max(step, 1), segmentsCount);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 16, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityRole="button"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            backgroundColor: '#f3f4f6',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' }}>{title}</Text>
        <View style={{ width: 32, height: 32, marginLeft: 8 }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
        {Array.from({ length: segmentsCount }).map((_, idx) => (
          <View
            key={idx}
            style={{
              flex: 1,
              height: 2,
              borderRadius: 999,
              backgroundColor: idx < completedSegments ? '#111827' : '#e5e7eb',
              marginRight: idx < segmentsCount - 1 ? 4 : 0
            }}
          />
        ))}
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
      </View>
    </SafeAreaView>
  );
}

