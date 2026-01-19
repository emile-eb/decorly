import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
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
      'Rug only': require('../../assets/Rug Floor Type.png'),
      // Carpet variants
      'Beige': require('../../assets/Floor Redsign Beige Carpet.png'),
      'Light Grey': require('../../assets/Floor Redesign Light Grey Carpet.png'),
      'Medium Grey': require('../../assets/Floor Redesign Medium Grey Carpet.png'),
      'Dark Grey': require('../../assets/Floor Redesign Dark Grery Carpet.png'),
      'Greige': require('../../assets/Floor Redesign Greige Carpet.png'),
      'Cream': require('../../assets/Floor Redesign Cream Carpet.png'),
      'Brown': require('../../assets/Floor Redesign Brown Carpet.png'),
      'Black': require('../../assets/Floor Redesign Black Carpet.png'),
      // Rug variants
      'Solid Light': require('../../assets/Floor Redesign White Rug.png'),
      'Solid Dark': require('../../assets/Floor Redesign Black Rug.png'),
      'Tan': require('../../assets/Floor Redesign Tan Rug.png'),
      'Grey': require('../../assets/Floor Redesign Grey Rug.png'),
      'Vintage Persian': require('../../assets/Floor Redesign Persian Rug.png'),
      'Modern Geometric': require('../../assets/Floor Redesign Geometric Rug.png'),
      'Moroccan Diamond': require('../../assets/Floor Redesign Moroccan Rug.png'),
      'Abtract Modern': require('../../assets/Floor Redesign Abtract Rug.png'),
      'jute': require('../../assets/Floor Redesign Jute Rug.png'),
      'Shag': require('../../assets/Floor Redesign Shag Rug.png'),
      'Stripped': require('../../assets/Floor Redesign Stripped Rug.png'),
      // Specific tile/stone variants (thumbnails)
      'White Ceramic': require('../../assets/Floor Redesign White Ceramic Tile.png'),
      'Grey Porcelian': require('../../assets/Floor Redesign Porcelain Tile.png'),
      'Beige Tile': require('../../assets/Floor Redesign Beige Tile.png'),
      'Marble': require('../../assets/Floor Redesign Marble Tile.png'),
      'Travertine': require('../../assets/Floor Redesign Travertine Tile.png'),
      'Slate': require('../../assets/Floor Redesign Slate Tile.png'),
      'Terrazzo': require('../../assets/Floor Redesign Terrazzo Tile.png'),
      'Moroccan': require('../../assets/Floor Redesign Moroccan Tile.png')
    }) as Record<string, any>,
    []
  );

  // Specific wood variant images (if available)
  const woodVariantImages = useMemo(
    () => ({
      'Natural': require('../../assets/Floor Redesign Natural Wood.png'),
      'Light Blonde': require('../../assets/Floor Redesign Light Blonde .png'),
      'Golden Oak': require('../../assets/Floor Redesign Golden Oak Wood.png'),
      'Warm Oak': require('../../assets/Floor Redesign Warm Oak Wood.png'),
      'Medium Brown': require('../../assets/Floor Redesign Medium Brown Wood.png'),
      'Chestnut': require('../../assets/Floor Redesign Chestnut Wood.png'),
      'Black': require('../../assets/Floor Redesign Black Wood.png'),
      'Bleached': require('../../assets/Floor Redesign Bleached Wood.png'),
      'Expresso': require('../../assets/Floor Redesign Expersso Wood.png'),
      'Greige': require('../../assets/Floor Redesign Greige Wood.png'),
      'Grey': require('../../assets/Floor Redesign Grey Wood.png')
    }) as Record<string, any>,
    []
  );

  // Rows with swipeable variants per material
  const materialRows = useMemo(
    () => (
      [
        {
          label: 'Wood',
          variants: ['Natural', 'Light Blonde', 'Golden Oak', 'Warm Oak', 'Medium Brown', 'Chestnut', 'Expresso', 'Grey', 'Griege', 'Bleached', 'Black']
        },
        {
          label: 'Tile & Stone',
          variants: ['White Ceramic', 'Grey Porcelian', 'Beige Tile', 'Marble', 'Travertine', 'Slate', 'Terrazzo', 'Moroccan']
        },
        {
          label: 'Concrete',
          variants: ['Concrete - Light', 'Concrete - Medium', 'Concrete - Charcoal']
        },
        {
          label: 'Carpet',
          variants: ['Beige', 'Light Grey', 'Medium Grey', 'Dark Grey', 'Greige', 'Cream', 'Brown', 'Black', 'Patterned Carpet']
        },
        {
          label: 'Rugs',
          variants: ['Solid Light', 'Solid Dark', 'Tan', 'Grey', 'Vintage Persian', 'Modern Geometric', 'Moroccan Diamond', 'Abtract Modern', 'jute', 'Shag', 'Stripped']
        }
      ] as { label: string; variants: string[] }[]
    ),
    []
  );

  const getVariantImage = (variant: string) => {
    // Map variant to nearest base image
    // Prefer specific floor images first (so 'Black' carpet doesn't use black wood)
    if (floorImages[variant]) return floorImages[variant];
    if (woodVariantImages[variant]) return woodVariantImages[variant];
    // Wood mapping
    if (/natural|light\s*blonde|golden\s*oak|warm\s*oak|grey|gr(e|i)ege|bleached/i.test(variant)) return floorImages['Light wood'];
    if (/walnut|expres{1,2}o|espresso|black|chestnut|medium\s*brown|brown/i.test(variant)) return floorImages['Dark wood'];
    if (/wood/i.test(variant)) return floorImages['Light wood'];
    if (/patterned tile|moroccan/i.test(variant)) return floorImages['Patterned tile'];
    if (/quarry|mosaic|terracotta|ceramic|porcelain|tile|terrazzo/i.test(variant)) return floorImages['Tile'];
    if (/stone|marble|travertine|slate|granite|limestone|sandstone/i.test(variant)) return floorImages['Stone'];
    if (/concrete/i.test(variant)) return floorImages['Concrete'];
    if (/carpet/i.test(variant)) return floorImages['Carpet'];
    if (/rug/i.test(variant)) return floorImages['Rug only'];
    return undefined;
  };

  

  const handleBack = () => {
    if (step <= 1) nav.navigate('Home');
    else setStep(step - 1);
  };

  // Interior example photos (reuse)
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

  const segmentsCount = 3;
  const completedSegments = Math.min(Math.max(step, 1), segmentsCount);

  const renderStep1 = () => (
    <View style={{ flex: 1, marginTop: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Upload Photo</Text>
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
      <View style={{ height: 16 }} />
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Example Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
        {examplePhotos.map((u, idx) => (
          <TouchableOpacity key={String(idx)} onPress={() => setLocalUri(u)}>
            <Image
              source={{ uri: u }}
              style={{ width: 96, height: 96, borderRadius: 8, marginRight: 10, borderWidth: localUri === u ? 2 : 1, borderColor: localUri === u ? '#111827' : '#e5e7eb' }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        {materialRows.map((row) => (
          <View key={row.label} style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>{row.label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
              {row.variants.map((v) => {
                const active = floorType === v;
                const img = getVariantImage(v);
                const label = v.includes('-') ? v.split('-').slice(1).join('-').trim() : v;
                return (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setFloorType(v)}
                    style={{ width: 120, marginRight: 10 }}
                  >
                    <View style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', borderWidth: active ? 2 : 1, borderColor: active ? '#111827' : '#e5e7eb' }}>
                      {img ? (
                        <Image source={img} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#6b7280', fontSize: 12 }}>No preview</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ marginTop: 6, color: '#111827', fontWeight: '600' }} numberOfLines={1}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ))}
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
            let finalPath = uploadedPath;
            if (!finalPath && localUri) {
              finalPath = await uploadNow();
            }
            if (!finalPath) return Alert.alert('Missing photo');
            const constraints: any = { mode, floorType };
            const { jobId } = await createJob({ style: 'floor', constraints, inputImagePath: finalPath });
            nav.navigate('Progress', { jobId });
          } catch (e: any) {
            console.error('[ui] FloorCreate generate error', e);
            (e?.statusCode===402 ? nav.navigate('Paywall') : Alert.alert('Failed to start job', e?.message || ''));
          }
        }}
        disabled={!localUri || !floorType}
        style={{ backgroundColor: localUri && floorType ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
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
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      </View>
    </SafeAreaView>
  );
}

