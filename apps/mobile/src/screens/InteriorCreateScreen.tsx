import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, Dimensions, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSessionGate } from '../lib/session';
import { compressImage, uploadToInputs } from '../lib/upload';
import { createJob } from '../lib/api';

type Palette = { label: string; colors: string[] };

export default function InteriorCreateScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const title = route.params?.title || 'Interior Design';
  const mode = route.params?.mode || 'interior';
  const { userId } = useSessionGate();
  const isExterior = mode === 'exterior';

  const [step, setStep] = useState<number>(1);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [customStyle, setCustomStyle] = useState<string>('');
  const [customOverlayOpen, setCustomOverlayOpen] = useState<boolean>(false);
  const [palette, setPalette] = useState<Palette | null>(null);

  // Example images: use local interior examples for interior flow; keep remote placeholders for exterior
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

  // Exterior example photos (local)
  const exteriorExampleModules = useMemo(
    () => [
      require('../../assets/Exterior Example Photo 1.jpg'),
      require('../../assets/Exterior Example Photo 2.jpg'),
      require('../../assets/Exterior Example Photo 3.jpg'),
      require('../../assets/Exterior Example Photo 4.webp'),
      require('../../assets/Exterior Example Photo 5.jpg'),
      require('../../assets/Exterior Example Photo 6.webp')
    ],
    []
  );

  const examplePhotos = useMemo(() => {
    if (isExterior) {
      return exteriorExampleModules.map((m) => Asset.fromModule(m).uri);
    }
    // Resolve local assets to URIs (works across native and web)
    return interiorExampleModules.map((m) => Asset.fromModule(m).uri);
  }, [isExterior, interiorExampleModules, exteriorExampleModules]);

  // Use same exterior example set for home style thumbnails
  const exteriorHomeStyleImages = useMemo(() => exteriorExampleModules.map((m) => Asset.fromModule(m).uri), [exteriorExampleModules]);

  const roomTypes = useMemo(
    () => [
      'Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Dining Room', 'Home Office',
      'Nursery', 'Kids Room', 'Guest Room', 'Entryway', 'Hallway', 'Laundry Room',
      'Basement', 'Attic', 'Garage', 'Balcony', 'Patio', 'Sunroom', 'Home Theater',
      'Gym', 'Study', 'Mudroom', 'Pantry', 'Closet'
    ],
    []
  );

  const houseTypes = useMemo(
    () => [
      'Ranch', 'Colonial', 'Victorian', 'Craftsman', 'Mediterranean', 'Modern',
      'Contemporary', 'Farmhouse', 'Cottage', 'Townhouse', 'Cape Cod', 'Mid-century',
      'Tudor', 'Bungalow', 'Spanish', 'Split-level', 'A-frame', 'Chalet'
    ],
    []
  );

  const styles3 = useMemo(
    () => [
      'Custom', 'Modern', 'Contemporary', 'Minimalist', 'Scandinavian', 'Industrial',
      'Mid-century Modern', 'Traditional', 'Farmhouse', 'Rustic', 'Bohemian', 'Coastal',
      'Japandi', 'Art Deco', 'Transitional', 'Eclectic', 'Glam', 'Mediterranean'
    ],
    []
  );

  // Local images corresponding to interior styles
  const interiorStyleImages = useMemo(() => ({
    Modern: require('../../assets/Modern Interior Style.jpg'),
    Contemporary: require('../../assets/Contemporary Interior Style.jpg'),
    Minimalist: require('../../assets/Minimilist Style Ex.jpg'),
    Scandinavian: require('../../assets/Scandinavian Int Style.jpg'),
    Industrial: require('../../assets/Industrial Int Style.jpg'),
    'Mid-century Modern': require('../../assets/Mid Century Modern Interior Style.jpg'),
    Traditional: require('../../assets/Traditional Interior Style.jpg'),
    Farmhouse: require('../../assets/Farmhouse Int Style.webp'),
    Rustic: require('../../assets/Rustic Interior Style.webp'),
    Bohemian: require('../../assets/Bohemian Interior Style.webp'),
    Coastal: require('../../assets/Costal Interior Style.jpg'),
    Japandi: require('../../assets/Japoni Interior Style.webp'),
    'Art Deco': require('../../assets/Art Deco Interior Style.jpg'),
    Transitional: require('../../assets/Transitional Interior Style.jpg'),
    Eclectic: require('../../assets/Ecelectic Interior Style.jpg'),
    Glam: require('../../assets/Glam Interior Style.jpg'),
    Mediterranean: require('../../assets/Mediterranean Interior Style.jpg')
  } as Record<string, any>), []);

  // Local images corresponding to exterior styles
  const exteriorStyleImages = useMemo(() => ({
    Modern: require('../../assets/Exterior Modern Example.jpg'),
    Contemporary: require('../../assets/Exterior Contemporary Example.jpg'),
    Craftsman: require('../../assets/Exterior Craftsman Example.jpg'),
    Colonial: require('../../assets/Exterior Colonial Example.jpg'),
    Victorian: require('../../assets/Exterior Victorian Example.jpg'),
    Ranch: require('../../assets/Exterior Ranch Example.jpg'),
    Tudor: require('../../assets/Exterior Tudor Example.jpg'),
    Mediterranean: require('../../assets/Exterior Mediterranean Example.png'),
    'Spanish Revival': require('../../assets/Exterior Spanish Revivial Example.jpg'),
    'Cape Cod': require('../../assets/Exterior Cape Cod Example.jpg'),
    'Mid-century Modern': require('../../assets/Exterior Mid Century Modern Example.webp'),
    Farmhouse: require('../../assets/Exterior Farmhouse Example.jpg'),
    Cottage: require('../../assets/Exterior Cottage Example.jpg'),
    Coastal: require('../../assets/Exterior Coastal Example.jpg'),
    'French Country': require('../../assets/Exterior French Country Example.jpg'),
    Georgian: require('../../assets/Exterior Georgian Example.jpeg')
  } as Record<string, any>), []);
  const exteriorStyles = useMemo(
    () => [
      'Custom',
      'Modern',
      'Contemporary',
      'Craftsman',
      'Colonial',
      'Victorian',
      'Ranch',
      'Tudor',
      'Mediterranean',
      'Spanish Revival',
      'Cape Cod',
      'Mid-century Modern',
      'Farmhouse',
      'Cottage',
      'Coastal',
      'French Country',
      'Georgian'
    ],
    []
  );

const palettes = useMemo<Palette[]>(
    () => [
      { label: 'Warm Neutrals', colors: ['#E5D5C5', '#C2A488', '#8C6E5A'] },
      { label: 'Cool Neutrals', colors: ['#E6E8EB', '#BFC5CD', '#6C7A89'] },
      { label: 'Black & White', colors: ['#000000', '#666666', '#FFFFFF'] },
      { label: 'Earthy Greens', colors: ['#E3E8E1', '#9BB798', '#3F6B4A'] },
      { label: 'Navy & Brass', colors: ['#0C2745', '#C8A96D', '#F2F2F2'] },
      { label: 'Blush & Gold', colors: ['#F6D6D8', '#D4A373', '#FAFAFA'] },
      { label: 'Sage & Oak', colors: ['#CFE0D5', '#8DA58C', '#8A6D46'] },
      { label: 'Charcoal & Walnut', colors: ['#2D2F33', '#7C5F47', '#ECECEC'] },
      { label: 'Terracotta & Cream', colors: ['#D88C65', '#F2E6DA', '#6B4F3B'] },
      { label: 'Sand & Stone', colors: ['#E9E2D0', '#B9B1A4', '#6E6A63'] },
      { label: 'Teal & Copper', colors: ['#1B7F8E', '#B87333', '#F3F4F6'] },
      { label: 'Greige & Black', colors: ['#DAD7D2', '#8D8A83', '#111111'] },
      // Added extended palettes
      { label: 'Monochrome Grays', colors: ['#F2F2F2', '#9CA3AF', '#111827'] },
      { label: 'Coastal Blues', colors: ['#E8F1F8', '#7DA4C3', '#2C4F6B'] },
      { label: 'Sunset Tones', colors: ['#FFD7BA', '#FF9F68', '#D86141'] },
      { label: 'Moody Jewel', colors: ['#0E2A47', '#245C5C', '#5A2A5A'] },
      { label: 'Soft Pastels', colors: ['#F8E8EE', '#E7F0FA', '#EAF7E6'] },
      { label: 'Cream & Espresso', colors: ['#F6F1EA', '#C7B8A0', '#3B2F2F'] },
      { label: 'Forest Cabin', colors: ['#E5E1D8', '#7A8F74', '#3D4A3E'] },
      { label: 'Urban Loft', colors: ['#EFEFEF', '#A3A3A3', '#2F2F2F'] }
    ],
    []
  );

  const exteriorPalettes = useMemo<Palette[]>(
    () => [
      { label: 'Classic White + Black Trim', colors: ['#F7F7F7', '#111111', '#D6D6D6'] },
      { label: 'Warm Beige + White Trim', colors: ['#D8CBB6', '#FFFFFF', '#8C7A67'] },
      { label: 'Greige + Charcoal', colors: ['#CFC8BF', '#333333', '#ECEAE7'] },
      { label: 'Slate Blue + White', colors: ['#4E6478', '#FFFFFF', '#D8E2EA'] },
      { label: 'Sage Green + Cream', colors: ['#8FA391', '#F4F1E9', '#5F6E61'] },
      { label: 'Navy + White Trim', colors: ['#1E2A3A', '#FFFFFF', '#C9D3DF'] },
      { label: 'Charcoal + Cedar Accents', colors: ['#2B2E33', '#8A5A3B', '#E8E6E3'] },
      { label: 'Taupe + Black', colors: ['#B2A497', '#111111', '#E9E4DF'] },
      { label: 'Terracotta + Cream', colors: ['#C0653B', '#F3EEE7', '#6E4E3F'] },
      { label: 'Olive + Stone', colors: ['#6E7A5C', '#B9B4A6', '#E7E4DC'] },
      { label: 'Coastal Gray + White', colors: ['#9AA3AD', '#FFFFFF', '#DDE3E8'] },
      { label: 'Sand + White Trim', colors: ['#D9CDBE', '#FFFFFF', '#A89E8E'] }
    ],
    []
  );

  const handleBack = () => {
    if (step <= 1) {
      // Always return to Home explicitly to avoid wrong stack focus
      nav.navigate('Home');
    } else {
      setStep(step - 1);
    }
  };

  const handleExit = () => {
    // Return to Home screen in the Explore stack
    nav.navigate('Home');
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
    console.log('[ui] InteriorCreate upload starting');
    const compressed = await compressImage(localUri);
    const path = await uploadToInputs(userId, compressed);
    setUploadedPath(path);
    console.log('[ui] InteriorCreate uploaded', { path });
    return path;
  };

  const continueFromStep1 = async () => {
    // Move upload to final submission; allow advancing even without a photo for now
    setStep(2);
  };

  const submitJob = async () => {
    try {
      console.log('[ui] InteriorCreate submit clicked', { hasLocal: Boolean(localUri), hasUploaded: Boolean(uploadedPath), roomType, style, palette: palette?.label, mode });
      let finalPath = uploadedPath;
      if (!finalPath && localUri) {
        const path = await uploadIfNeeded();
        if (path) {
          setUploadedPath(path);
          finalPath = path;
        }
      }
      if (!localUri || !finalPath) return Alert.alert('Missing photo');
      if (!roomType) return Alert.alert(isExterior ? 'Select a house type' : 'Select a room type');
      if (!style) return Alert.alert('Select a style');
      if (!palette) return Alert.alert('Select a color palette');
      const typeKey = isExterior ? 'house_type' : 'room_type';
      const chosenStyle = style === 'Custom' ? (customStyle.trim() || 'custom') : style;
      const body: any = {
        style: chosenStyle,
        constraints: { [typeKey]: roomType, palette: palette.label, palette_colors: palette.colors, mode },
        inputImagePath: finalPath
      };
      const { jobId } = await createJob(body);
      nav.navigate('Progress', { jobId });
    } catch (e: any) {
      console.error('[ui] InteriorCreate submitJob error', e);
      (e?.statusCode===402 ? nav.navigate('Paywall') : Alert.alert('Failed to start job', e?.message || ''));
    }
  };

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
        onPress={continueFromStep1}
        disabled={!localUri}
        style={{ backgroundColor: localUri ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={{ flex: 1, marginTop: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Choose {isExterior ? 'House' : 'Room'} Type</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {(isExterior ? houseTypes : roomTypes).map((r) => {
            const active = roomType === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setRoomType(r)}
                style={{
                  width: '48%',
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? '#111827' : '#e5e7eb',
                  alignItems: 'center',
                  backgroundColor: active ? '#111827' : '#fff',
                  minHeight: 56
                }}
              >
                <Text style={{ color: active ? '#fff' : '#111827', fontWeight: '600', fontSize: 16, textAlign: 'center' }}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <TouchableOpacity
        onPress={() => setStep(3)}
        disabled={!roomType}
        style={{ backgroundColor: roomType ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={{ flex: 1, marginTop: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Choose {isExterior ? 'Home Style' : 'Style'}</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          {(isExterior ? exteriorStyles : styles3).map((s, idx) => {
            const active = style === s;
            const blank = { uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=' };
            const source = s === 'Custom'
              ? blank
              : isExterior
              ? (exteriorStyleImages[s] ?? { uri: `https://picsum.photos/seed/decorly-${encodeURIComponent(s)}/200/200` })
              : (interiorStyleImages[s] ?? { uri: `https://picsum.photos/seed/decorly-${encodeURIComponent(s)}/200/200` });
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
                <Image
                  source={source}
                  style={{ width: '100%', height: 120, marginBottom: 8 }}
                  resizeMode="cover"
                />
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
                  placeholder={isExterior ? 'e.g., Modern farmhouse with cedar accents' : 'e.g., Wabi-sabi minimalism'}
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

  const renderPaletteSwatch = (colors: string[]) => (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
      {colors.map((c, idx) => (
        <View key={idx} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c, borderWidth: 1, borderColor: '#e5e7eb' }} />
      ))}
    </View>
  );

  const renderStep4 = () => (
    <View style={{ flex: 1, marginTop: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Choose {isExterior ? 'Exterior' : ''} Color Palette</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {(isExterior ? exteriorPalettes : palettes).map((p) => {
            const active = palette?.label === p.label;
            return (
              <View key={p.label} style={{ width: '48%' }}>
                <TouchableOpacity
                  onPress={() => setPalette(p)}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? '#111827' : '#e5e7eb',
                    backgroundColor: active ? '#111827' : '#fff',
                    overflow: 'hidden'
                  }}
                >
                  <View style={{ width: '100%', height: 72 }}>
                    {p.colors.map((c, idx) => (
                      <View key={idx} style={{ flex: 1, backgroundColor: c }} />
                    ))}
                  </View>
                </TouchableOpacity>
                <Text style={{ marginTop: 6, color: '#111827', fontWeight: '600', textAlign: 'center' }} numberOfLines={2}>
                  {p.label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <TouchableOpacity
        onPress={() => setStep(5)}
        disabled={!palette}
        style={{ backgroundColor: palette ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
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
          <Text style={{ color: '#6b7280' }}>{isExterior ? 'House Type' : 'Room'}</Text>
          <Text style={{ fontWeight: '600' }}>{roomType ?? '-'}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: '#6b7280' }}>{isExterior ? 'Home Style' : 'Style'}</Text>
          <Text style={{ fontWeight: '600' }}>{style === 'Custom' ? (customStyle || 'Custom') : (style ?? '-')}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#6b7280' }}>{isExterior ? 'Exterior Palette' : 'Palette'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontWeight: '600' }}>{palette?.label ?? '-'}</Text>
            {palette ? renderPaletteSwatch(palette.colors) : null}
          </View>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={submitJob}
        disabled={!localUri || !roomType || !style || (style === 'Custom' && !customStyle.trim()) || !palette}
        style={{ backgroundColor: localUri && roomType && style && (!(style === 'Custom') || !!customStyle.trim()) && palette ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Generate</Text>
      </TouchableOpacity>
    </View>
  );

  const totalSteps = 5;
  const segmentsCount = 4; // Four dashes for four progressive steps
  const completedSegments = Math.min(Math.max(step, 1), segmentsCount);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 16, paddingTop: 8 }}>
      {/* Top bar with back button and progress */}
      <View style={{ flexDirection: 'column', marginBottom: 12 }}>
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
          {(step === 2 || step === 3 || step === 4 || step === 5) ? (
            <TouchableOpacity
              onPress={handleExit}
              accessibilityRole="button"
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                backgroundColor: '#f3f4f6',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8
              }}
            >
              <Ionicons name="close" size={20} color="#111827" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
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

  // Reserved: headerBarWidth if needed for future layout
  const headerBarWidth = Math.round(Dimensions.get('window').width * 0.8);


  // no-op

