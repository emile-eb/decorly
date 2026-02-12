import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ScrollView, LayoutChangeEvent, PanResponder, GestureResponderEvent, PanResponderGestureState, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSessionGate } from '../lib/session';
import { compressImage, uploadToInputs } from '../lib/upload';
import { createJob } from '../lib/api';
import Svg, { Path } from 'react-native-svg';
import PhotoGuideModal from '../components/PhotoGuideModal';

type Point = { x: number; y: number; r: number; mode: 'draw' };
type Stroke = { radius: number; points: { x: number; y: number }[] };

export default function ReplaceCreateScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const title = route.params?.title || 'Replace Objects';
  const mode = 'replace';
  const { userId } = useSessionGate();

  const [step, setStep] = useState<number>(1);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [descText, setDescText] = useState<string>("");
  const [refObjectUri, setRefObjectUri] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Brush state
  const [brushSize, setBrushSize] = useState<number>(32);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStrokes, setRedoStrokes] = useState<Stroke[]>([]);
  const imgBox = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const onImageLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout as any;
    imgBox.current = { x, y, w: width, h: height };
  };

  // Interior example photos (reuse from interior flow)
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
  const replaceExampleUri = useMemo(() => Asset.fromModule(require('../../assets/Replace Object Example.jpg')).uri, []);

  const distance2 = (a: {x:number;y:number}, b:{x:number;y:number}) => {
    const dx = a.x - b.x, dy = a.y - b.y; return dx*dx + dy*dy;
  };

  const addPointFromTouch = (evt: GestureResponderEvent, startNew: boolean) => {
    const box = imgBox.current; if (!box) return;
    const { locationX, locationY } = evt.nativeEvent;
    const bx = Math.max(0, Math.min(box.w, locationX));
    const by = Math.max(0, Math.min(box.h, locationY));
    const pt = { x: bx, y: by };
    setStrokes((prev) => {
      const next = [...prev];
      if (startNew || next.length === 0) {
        next.push({ radius: brushSize / 2, points: [pt] });
        // starting a new stroke invalidates redo stack
        setRedoStrokes([]);
        return next;
      }
      const last = next[next.length - 1];
      const threshold = Math.max(3, last.radius * 0.6);
      const lastPt = last.points[last.points.length - 1];
      if (!lastPt || distance2(lastPt, pt) >= threshold * threshold) {
        last.points.push(pt);
      }
      return next;
    });
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => addPointFromTouch(evt, true),
    onPanResponderMove: (evt: GestureResponderEvent, _gs: PanResponderGestureState) => addPointFromTouch(evt, false),
    onPanResponderTerminationRequest: () => true,
    onPanResponderRelease: () => {},
  }), [brushSize]);

  // Slider state
  const sliderRef = useRef<{ w: number }>({ w: 0 });
  const [sliderWidth, setSliderWidth] = useState<number>(0);
  const minSize = 6;
  const maxSize = 64;
  const onSliderLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    sliderRef.current.w = w;
    setSliderWidth(w);
  };
  const setSizeByTouch = (evt: GestureResponderEvent) => {
    const w = sliderRef.current.w || 1;
    const x = Math.max(0, Math.min(w, evt.nativeEvent.locationX));
    const ratio = x / w;
    const val = Math.round(minSize + ratio * (maxSize - minSize));
    setBrushSize(val);
  };

  const handleBack = () => {
    if (step <= 1) nav.navigate('Home');
    else setStep(step - 1);
  };

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
      console.error('[ui] ReplaceCreate upload error', e);
      Alert.alert('Upload failed', e?.message ?? 'Unable to upload image');
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
            <Text style={{ color: '#6b7280', fontWeight: '600' }}>No photo selected</Text>
          </View>
        )}
      </View>
      <View style={{ marginTop: 12, alignItems: 'center' }}>
        <TouchableOpacity onPress={takePhoto} style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minWidth: 180, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Take a photo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={pickImage} style={{ backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, minWidth: 180, alignItems: 'center', marginTop: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Choose from gallery</Text>
        </TouchableOpacity>
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
      <TouchableOpacity onPress={() => setStep(2)} disabled={!localUri} style={{ backgroundColor: localUri ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }} style={{ flex: 1, marginTop: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Brush to select object</Text>
      <View onLayout={onImageLayout} style={{ width: '100%', aspectRatio: 0.9, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
        {localUri ? (
          <Image source={{ uri: localUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, backgroundColor: '#f3f4f6' }} />
        )}
        {/* Paint overlay (smooth paths) */}
        <View {...panResponder.panHandlers} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
          <Svg width="100%" height="100%" pointerEvents="none">
            {strokes.map((s, idx) => {
              if (s.points.length < 2) return null;
              const d = s.points.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');
              return (
                <Path key={idx} d={d} stroke="#F43F5E" strokeOpacity={0.35} strokeWidth={s.radius * 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              );
            })}
          </Svg>
        </View>
      </View>
      {/* Controls */}
      <View style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => {
              setStrokes((prev) => {
                if (!prev.length) return prev;
                const next = [...prev];
                const popped = next.pop()!;
                setRedoStrokes((r) => [...r, popped]);
                return next;
              });
            }}
            disabled={strokes.length === 0}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: strokes.length ? '#e5e7eb' : '#f3f4f6' }}
          >
            <Text style={{ color: '#111827', fontWeight: '700' }}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setRedoStrokes((prev) => {
                if (!prev.length) return prev;
                const nextRedo = [...prev];
                const restored = nextRedo.pop()!;
                setStrokes((s) => [...s, restored]);
                return nextRedo;
              });
            }}
            disabled={redoStrokes.length === 0}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: redoStrokes.length ? '#e5e7eb' : '#f3f4f6' }}
          >
            <Text style={{ color: '#111827', fontWeight: '700' }}>Redo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setStrokes([]); setRedoStrokes([]); }} style={{ marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#ef4444' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Restart</Text>
          </TouchableOpacity>
        </View>
        {/* Slider row: label + value left, slider right */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
          <View style={{ width: 140, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#6b7280', fontWeight: '600' }}>Brush size</Text>
            <Text style={{ fontWeight: '800' }}>{brushSize}px</Text>
          </View>
          <View onLayout={onSliderLayout} style={{ flex: 1, height: 32, justifyContent: 'center' }}>
            {(() => {
              const progress = Math.max(0, Math.min(1, (brushSize - minSize) / (maxSize - minSize)));
              const activeW = sliderWidth ? progress * sliderWidth : undefined as any;
              const thumbLeft = sliderWidth ? Math.max(0, progress * sliderWidth - 8) : 0;
              return (
                <View
                  style={{ height: 4, backgroundColor: '#e5e7eb', borderRadius: 999 }}
                  onStartShouldSetResponder={() => true}
                  onResponderGrant={setSizeByTouch}
                  onResponderMove={setSizeByTouch}
                >
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: activeW, backgroundColor: '#111827', borderRadius: 999 }} />
                  <View style={{ position: 'absolute', left: thumbLeft, top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#111827' }} />
                </View>
              );
            })()}
          </View>
        </View>

        {/* Removed replacement description textbox as requested */}
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={() => setStep(3)} disabled={strokes.reduce((n,s)=>n+s.points.length,0) === 0} style={{ backgroundColor: strokes.reduce((n,s)=>n+s.points.length,0) ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep4 = () => (
    <View style={{ flex: 1, marginTop: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Review & Generate</Text>
      <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, backgroundColor: '#fff', gap: 12 }}>
        {localUri ? (
          <View style={{ width: '100%', aspectRatio: 0.9, borderRadius: 8, overflow: 'hidden' }}>
            <Image source={{ uri: localUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            {/* Simple legend preview */}
            <View style={{ position: 'absolute', right: 8, bottom: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontSize: 12 }}>{strokes.reduce((n,s)=>n+s.points.length,0)} points</Text>
            </View>
          </View>
        ) : (
          <View style={{ width: '100%', aspectRatio: 0.9, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#6b7280' }}>No photo selected</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        onPress={async () => {
          try {
            if (!uploadedPath && localUri) {
              await uploadNow();
            }
            if (!uploadedPath) return Alert.alert('Missing photo');
            const marks: Point[] = strokes.flatMap((s) => s.points.map((pt) => ({ x: pt.x, y: pt.y, r: s.radius, mode: 'draw' as const })));
            const canvas = imgBox.current ? { width: imgBox.current.w, height: imgBox.current.h } : undefined;
            const constraints: any = { mode, brushSize, marks, canvas, prompt: descText.trim() || undefined };
            const { jobId } = await createJob({ style: 'replace', constraints, inputImagePath: uploadedPath });
            nav.navigate('Progress', { jobId });
          } catch (e: any) {
            console.error('[ui] ReplaceCreate generate error', e);
            (e?.statusCode===402 ? nav.navigate('Paywall') : Alert.alert('Failed to start job', e?.message || ''));
          }
        }}
        disabled={!localUri || strokes.reduce((n,s)=>n+s.points.length,0) === 0}
        style={{ backgroundColor: localUri && strokes.reduce((n,s)=>n+s.points.length,0) ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Generate</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }} style={{ flex: 1, marginTop: 8 }}>
        <View style={{ marginBottom: 12, marginHorizontal: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Describe the new object to replace the existing one</Text>
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, minHeight: 240, position: 'relative' }}>
            <TextInput
              value={descText}
              onChangeText={(t) => setDescText(t.slice(0, 450))}
              multiline
              placeholder="A cozy black couch with red pillow"
              placeholderTextColor="#9ca3af"
              style={{ minHeight: 200 }}
            />
            <Text style={{ position: 'absolute', left: 12, bottom: 8, color: '#6b7280', fontSize: 12 }}>{descText.length}/450</Text>
          </View>
        </View>

        <View style={{ marginTop: 8, marginHorizontal: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Or upload a photo of the object you want to replace</Text>
          <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, minHeight: 300, alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#f3f4f6' }}>
            {refObjectUri ? (
              <View style={{ width: '100%', height: 300, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                <Image source={{ uri: refObjectUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => setRefObjectUri(null)}
                  accessibilityRole="button"
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 999, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="remove" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: '100%', height: 300, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                {replaceExampleUri ? (
                  <Image source={{ uri: replaceExampleUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb' }} />
                )}
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== 'granted') return Alert.alert('Permission needed', 'Allow photo library access.');
                      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
                      if (!res.canceled) setRefObjectUri(res.assets[0].uri);
                    } catch (e: any) {
                      Alert.alert('Error', e?.message || 'Unable to pick image');
                    }
                  }}
                  accessibilityRole="button"
                  style={{ position: 'absolute', alignSelf: 'center', top: '50%', transform: [{ translateY: -22 }], flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 }}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>Add photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => setStep(4)} disabled={!descText.trim() && !refObjectUri} style={{ backgroundColor: (descText.trim() || refObjectUri) ? '#111827' : '#9ca3af', paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Continue</Text>
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
          {/* Right spacer to balance back button and truly center the title */}
          <View style={{ width: 32, height: 32, marginLeft: 8 }} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <View key={idx} style={{ flex: 1, height: 2, borderRadius: 999, backgroundColor: idx < Math.min(Math.max(step, 1), 4) ? '#111827' : '#e5e7eb', marginRight: idx < 3 ? 4 : 0 }} />
          ))}
        </View>

        <View style={{ marginTop: 6 }}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </View>
        <PhotoGuideModal visible={showGuide} onClose={() => setShowGuide(false)} />
      </View>
    </SafeAreaView>
  );
}

