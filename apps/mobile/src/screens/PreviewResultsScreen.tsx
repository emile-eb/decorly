import React from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PreviewResultsScreen() {
  const [showBefore, setShowBefore] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editChoice, setEditChoice] = React.useState<string | null>(null);
  const editOptions = ['New Floor', 'Paint', 'Replace object', 'Custom'];
  const before = require('../../assets/int ex 4.jpg');
  const after = require('../../assets/int ex 5.jpg');
  const [aspect, setAspect] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    try {
      const src = Image.resolveAssetSource(after) as any;
      if (src?.width && src?.height) setAspect(src.width / src.height);
    } catch {}
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 0 }}>
        <View style={{ width: '92%', alignSelf: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '600', color: '#111827', textAlign: 'left', marginBottom: 12 }} numberOfLines={1}>
            Congratulations your design is complete!
          </Text>
          <View style={{ width: '100%', aspectRatio: aspect ?? 3 / 4, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
            <Image source={after} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            {showBefore ? (
              <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="none">
                <Image source={before} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
            ) : null}
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
              onPress={() => Alert.alert('Preview', 'Start edit is available after a real generation.')}
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
              onPress={() => Alert.alert('Preview', 'Saving is available after a real generation.')}
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
                <Ionicons name="download-outline" size={18} color="#111827" />
                <Text style={{ color: '#111827', fontWeight: '700', marginLeft: 8 }}>Save to gallery</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert('Preview', 'Sharing is not available in preview.')}
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
              onPress={() => Alert.alert('Preview', 'Done is available after a real generation.')}
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
      </View>
    </SafeAreaView>
  );
}
