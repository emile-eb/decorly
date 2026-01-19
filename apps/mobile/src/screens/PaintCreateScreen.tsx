import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSessionGate } from '../lib/session';
import { compressImage, uploadToInputs } from '../lib/upload';
import { createJob } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';

type Palette = { label: string; colors: string[] };

export default function PaintCreateScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const title = route.params?.title || 'Paint';
  const mode = 'paint';
  const { userId } = useSessionGate();

  const [step, setStep] = useState<number>(1);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  // Current conditions
  const roomTypes = useMemo(() => ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining', 'Office', 'Entryway'], []);
  const bulbTones = useMemo(() => ['Warm', 'Neutral', 'Cool'], []);
  const brands = useMemo(() => ['None', 'Sherwin-Williams', 'Benjamin Moore', 'Behr'], []);

  const [roomType, setRoomType] = useState<string | null>(null);
  const [lightTime, setLightTime] = useState<'Day' | 'Night' | null>(null);
  const [bulbTone, setBulbTone] = useState<string | null>(null);
  const [surfaces, setSurfaces] = useState<{ walls: boolean; trim: boolean; ceiling: boolean }>({ walls: true, trim: false, ceiling: false });
  const [sheenWalls, setSheenWalls] = useState<'Flat' | 'Eggshell' | 'Satin'>('Eggshell');
  const [sheenTrim, setSheenTrim] = useState<'Semi-gloss' | 'Gloss'>('Semi-gloss');
  const [sheenCeiling, setSheenCeiling] = useState<'Flat'>('Flat');
  const [keepTrimWhite, setKeepTrimWhite] = useState<boolean>(true);
  const [brand, setBrand] = useState<string>('None');

  // Palettes
  const paintPalettes = useMemo<Palette[]>(
    () => [
      { label: 'Neutrals', colors: ['#EAE8E5', '#C9C6C1', '#A7A49E'] },
      { label: 'Greige', colors: ['#D8D4CC', '#BFB8AF', '#9D968B'] },
      { label: 'Coastal', colors: ['#E3EEF5', '#A8C4D7', '#5F87A1'] },
      { label: 'Moody', colors: ['#2B2E34', '#3E4752', '#596273'] },
      { label: 'Pastels', colors: ['#F8E6E0', '#E3F1ED', '#E9F0FF'] },
      { label: 'Earthy', colors: ['#E7D9C9', '#C9A890', '#8B6B53'] },
      { label: 'Black & White', colors: ['#111111', '#9CA3AF', '#FFFFFF'] }
    ],
    []
  );
  const [palette, setPalette] = useState<Palette | null>(null);
  const colorOptions = useMemo(
    () => [
      // Whites / Neutrals
      { label: 'Warm White', hex: '#F5F2EB' },
      { label: 'Pure White', hex: '#FFFFFF' },
      { label: 'Ivory', hex: '#FFFFF0' },
      { label: 'Antique White', hex: '#FAEBD7' },
      { label: 'Cream', hex: '#F7F3E9' },
      { label: 'Alabaster', hex: '#EEEAE2' },
      { label: 'Soft Gray', hex: '#D9DBE0' },
      { label: 'Cool Gray', hex: '#C7CDD3' },
      { label: 'Pewter', hex: '#8A8F98' },
      { label: 'Greige', hex: '#CFC9BF' },
      { label: 'Stone', hex: '#BDB5A7' },
      { label: 'Taupe', hex: '#B8AAA0' },
      { label: 'Sand', hex: '#D8CBB6' },
      { label: 'Beige', hex: '#D6C9B6' },
      { label: 'Oat', hex: '#DDD2BF' },
      // Browns / Earthy
      { label: 'Cappuccino', hex: '#AD8A64' },
      { label: 'Chestnut', hex: '#8B5E3C' },
      { label: 'Walnut', hex: '#6B4F3A' },
      { label: 'Mocha', hex: '#7B4F3A' },
      // Blues
      { label: 'Sky Blue', hex: '#A8C4D7' },
      { label: 'Powder Blue', hex: '#CFE3F3' },
      { label: 'Robin Egg', hex: '#9FD3E6' },
      { label: 'Slate Blue', hex: '#5F87A1' },
      { label: 'Steel Blue', hex: '#3E6A8A' },
      { label: 'Denim', hex: '#224C73' },
      { label: 'Navy', hex: '#1F2A44' },
      // Greens
      { label: 'Sage', hex: '#A9B5A1' },
      { label: 'Olive', hex: '#747F54' },
      { label: 'Forest', hex: '#2E5E4E' },
      { label: 'Hunter Green', hex: '#2E4F3A' },
      { label: 'Eucalyptus', hex: '#8BB89A' },
      { label: 'Mint', hex: '#BEE3C4' },
      { label: 'Deep Teal', hex: '#1F4A4F' },
      // Warm Accents
      { label: 'Blush', hex: '#F6D6D8' },
      { label: 'Rose', hex: '#E8B1B6' },
      { label: 'Coral', hex: '#FF7F50' },
      { label: 'Terracotta', hex: '#C97A5A' },
      { label: 'Rust', hex: '#B45A3C' },
      { label: 'Copper', hex: '#B87333' },
      { label: 'Mustard', hex: '#D1A73D' },
      { label: 'Goldenrod', hex: '#DAA520' },
      // Purples / Dramatic
      { label: 'Lavender', hex: '#C9B7E7' },
      { label: 'Mauve', hex: '#A8899C' },
      { label: 'Aubergine', hex: '#4B2E39' },
      { label: 'Charcoal', hex: '#2B2E34' },
      { label: 'Graphite', hex: '#3B3F46' },
      { label: 'Black', hex: '#111111' },
      // Extras
      { label: 'Pearl', hex: '#F2F1EC' },
      { label: 'Snow', hex: '#FAFAFA' },
      { label: 'Cobalt', hex: '#0047AB' },
      { label: 'Teal Blue', hex: '#367588' },
      { label: 'Seafoam', hex: '#9FE2BF' },
      { label: 'Spruce', hex: '#2C4F47' },
      { label: 'Clay', hex: '#B66A50' },
      { label: 'Brick', hex: '#8B3A3A' },
      { label: 'Canary', hex: '#FFF59E' },
      { label: 'Indigo', hex: '#3F51B5' }
    ],
    []
  );
  const [selectedColor, setSelectedColor] = useState<{ label: string; hex: string } | null>(null);

  // Example photos (moved inside component to avoid invalid hook call)
  const interiorExampleModules = useMemo(
    () => [
      require('../../assets/int ex 1.webp'),
      require('../../assets/int ex 2.jpg'),
      require('../../assets/int ex 3.jpg'),
      require('../../assets/int ex 4.jpg'),
      require('../../assets/int ex 5.jpg'),
      require('../../assets/int ex 6.webp')
    ],
    []
  );
  const examplePhotos = useMemo(() => interiorExampleModules.map((m) => Asset.fromModule(m).uri), [interiorExampleModules]);

  const segmentsCount = 3;
  const completedSegments = Math.min(Math.max(step, 1), segmentsCount);

  const handleBack = () => {
    if (step <= 1) nav.navigate('Home');
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
    if (!localUri) return null as string | null;
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
      Alert.alert('Upload failed', e?.message ?? 'Unable to upload image');
      return null;
    }
  };

  const renderStep1 = () => (
    <View style={{ flex: 1, marginTop: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Upload Photo</Text>
      <View style={{ width: '100%', aspectRatio: 0.9, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
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
      <View style={{ height: 16 }} />
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Example Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
        {examplePhotos.map((u, idx) => (
          <TouchableOpacity key={String(idx)} onPress={() => setLocalUri(u)}>
            <Image
              source={{ uri: u }}
              style={{ width: 96, height: 96, borderRadius: 8, marginRight: 10, borderWidth: localUri === u ? 2 : 1, borderColor: localUri === u ? '#111827' : '#e5e7eb' }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={async () => {
          try {
            await uploadNow();
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

  const ChipRow = ({ title, options, value, onChange }: { title: string; options: string[]; value: string | null; onChange: (v: string) => void }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: '#6b7280', marginBottom: 6 }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity key={opt} onPress={() => onChange(opt)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: active ? 2 : 1, borderColor: active ? '#111827' : '#e5e7eb', backgroundColor: active ? '#111827' : '#fff' }}>
              <Text style={{ color: active ? '#fff' : '#111827', fontWeight: '600' }}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <TouchableOpacity onPress={() => onChange(!value)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: value ? 2 : 1, borderColor: value ? '#111827' : '#e5e7eb', backgroundColor: value ? '#111827' : '#fff' }}>
      <Text style={{ color: value ? '#fff' : '#111827', fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );

  const renderStep2 = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Current Conditions</Text>
      <ChipRow title="Room Type" options={roomTypes} value={roomType} onChange={setRoomType} />
      <ChipRow title="Lighting (Time)" options={['Day', 'Night']} value={lightTime} onChange={(v) => setLightTime(v as any)} />
      <ChipRow title="Bulb Tone" options={bulbTones} value={bulbTone} onChange={setBulbTone} />

      <Text style={{ color: '#6b7280', marginBottom: 6 }}>Surfaces</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <Toggle label={`Walls (${sheenWalls})`} value={surfaces.walls} onChange={(v) => setSurfaces({ ...surfaces, walls: v })} />
        <Toggle label={`Trim (${sheenTrim})`} value={surfaces.trim} onChange={(v) => setSurfaces({ ...surfaces, trim: v })} />
        <Toggle label={`Ceiling (${sheenCeiling})`} value={surfaces.ceiling} onChange={(v) => setSurfaces({ ...surfaces, ceiling: v })} />
      </View>
      <Text style={{ color: '#6b7280', marginBottom: 6 }}>Sheen</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {['Flat', 'Eggshell', 'Satin'].map((s) => (
          <TouchableOpacity key={s} onPress={() => setSheenWalls(s as any)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: sheenWalls === (s as any) ? 2 : 1, borderColor: sheenWalls === (s as any) ? '#111827' : '#e5e7eb', backgroundColor: sheenWalls === (s as any) ? '#111827' : '#fff' }}>
            <Text style={{ color: sheenWalls === (s as any) ? '#fff' : '#111827', fontWeight: '600' }}>Walls: {s}</Text>
          </TouchableOpacity>
        ))}
        {['Semi-gloss', 'Gloss'].map((s) => (
          <TouchableOpacity key={s} onPress={() => setSheenTrim(s as any)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: sheenTrim === (s as any) ? 2 : 1, borderColor: sheenTrim === (s as any) ? '#111827' : '#e5e7eb', backgroundColor: sheenTrim === (s as any) ? '#111827' : '#fff' }}>
            <Text style={{ color: sheenTrim === (s as any) ? '#fff' : '#111827', fontWeight: '600' }}>Trim: {s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ color: '#6b7280', marginBottom: 6 }}>Trim Preference</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <Toggle label={keepTrimWhite ? 'Keep trim white: Yes' : 'Keep trim white: No'} value={keepTrimWhite} onChange={setKeepTrimWhite} />
      </View>

      <ChipRow title="Brand Preference (optional)" options={brands} value={brand} onChange={setBrand} />

      <TouchableOpacity onPress={() => setStep(3)} disabled={!roomType || !lightTime || !bulbTone} style={{ backgroundColor: roomType && lightTime && bulbTone ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderPaletteSwatch = (colors: string[]) => (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
      {colors.map((c, idx) => (
        <View key={idx} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c, borderWidth: 1, borderColor: '#e5e7eb' }} />
      ))}
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1, marginTop: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Choose Color</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          {colorOptions.map((c) => {
            const active = selectedColor?.label === c.label;
            return (
              <TouchableOpacity
                key={c.label}
                onPress={() => {
                  setSelectedColor(c);
                }}
                style={{ width: '48%', borderRadius: 12, borderWidth: active ? 2 : 1, borderColor: active ? '#111827' : '#e5e7eb', backgroundColor: active ? '#111827' : '#fff', overflow: 'hidden', paddingBottom: 12 }}
              >
                <View style={{ width: '100%', height: 72, backgroundColor: c.hex }} />
                <Text style={{ marginTop: 6, color: active ? '#fff' : '#111827', fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>
                  {c.label}
                </Text>
                <Text style={{ marginTop: 2, color: active ? '#e5e7eb' : '#6b7280', fontSize: 12, textAlign: 'center' }}>{c.hex}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <TouchableOpacity onPress={() => setStep(3)} disabled={!selectedColor} style={{ backgroundColor: selectedColor ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
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
          <Text style={{ color: '#6b7280' }}>Color</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontWeight: '600' }}>{selectedColor?.label ?? '-'}</Text>
            {selectedColor ? (
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: selectedColor.hex, borderWidth: 1, borderColor: '#e5e7eb' }} />
            ) : null}
          </View>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={async () => {
          try {
            let finalPath = uploadedPath;
            if (!finalPath && localUri) {
              finalPath = await uploadNow();
            }
            if (!finalPath) return Alert.alert('Missing photo');
            const constraints: any = { mode, color: selectedColor };
            const { jobId } = await createJob({ style: 'paint', constraints, inputImagePath: finalPath });
            nav.navigate('Progress', { jobId });
          } catch (e: any) {
            console.error('[ui] PaintCreate generate error', e);
            (e?.statusCode===402 ? nav.navigate('Paywall') : Alert.alert('Failed to start job', e?.message || ''));
          }
        }}
        disabled={!localUri || !selectedColor}
        style={{ backgroundColor: localUri && selectedColor ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Generate</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 16, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={handleBack} accessibilityRole="button" style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' }}>{title}</Text>
        <View style={{ width: 32, height: 32, marginLeft: 8 }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
        {Array.from({ length: segmentsCount }).map((_, idx) => (
          <View key={idx} style={{ flex: 1, height: 2, borderRadius: 999, backgroundColor: idx < completedSegments ? '#111827' : '#e5e7eb', marginRight: idx < segmentsCount - 1 ? 4 : 0 }} />
        ))}
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep3()}
      {step === 3 && renderStep4()}
      </View>
    </SafeAreaView>
  );
}

