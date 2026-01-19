import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTabs } from '../lib/tabs';
import Toggle from '../components/Toggle';
import * as SecureStore from 'expo-secure-store';
import { listJobs, getJob } from '../lib/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

type Job = {
  id: string;
  status: string;
  style: string | null;
  created_at: string;
  input_image_path?: string;
  output_image_paths?: string[];
};

export default function HistoryScreen() {
  const [items, setItems] = useState<Job[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const nav = useNavigation<any>();
  const { setTab } = useTabs();

  const load = useCallback(async () => {
    try {
      const jobs = await listJobs();
      setItems(jobs);
      // warm thumbnails for first 20
      const first = jobs.slice(0, 20);
      const results = await Promise.allSettled(first.map((j: any) => getJob(j.id)));
      const map: Record<string, string> = {};
      results.forEach((r: any, idx: number) => {
        if (r.status === 'fulfilled') {
          const job = r.value;
          const uri = job.outputSignedUrls?.[0] || job.inputSignedUrl;
          if (uri) map[first[idx].id] = uri;
        }
      });
      setThumbs((prev) => ({ ...prev, ...map }));
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    (async () => {
      try {
        const v = await SecureStore.getItemAsync('decorly:autoSaveGallery');
        if (v != null) setAutoSave(v === '1');
      } catch {}
    })();
  }, []);

  const toggleAutoSave = async () => {
    const next = !autoSave;
    setAutoSave(next);
    try {
      await SecureStore.setItemAsync('decorly:autoSaveGallery', next ? '1' : '0');
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const open = async (id: string) => {
    const job = await getJob(id);
    nav.navigate('Results', { job });
  };

  const statusColor = (s: string) =>
    s === 'complete' ? '#10b981' : s === 'failed' ? '#ef4444' : s === 'processing' ? '#f59e0b' : '#6b7280';

  const Empty = () => (
    <View
      style={{
        padding: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        height: 220
      }}
    >
      <Text style={{ color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 10 }}>No Designs Yet.</Text>
      <TouchableOpacity
        onPress={() => {
          try {
            setTab('Explore');
          } catch {}
        }}
        activeOpacity={0.9}
        style={{
          backgroundColor: '#111827',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 180
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>Start Transforming</Text>
      </TouchableOpacity>
      <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>Start a new one from Explore.</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={["top"]}>
      {/* Custom header matching Discover spacing */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontWeight: '800', fontSize: 28, color: '#111827' }}>Your Designs</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => nav.navigate('Paywall')}
            style={{ backgroundColor: '#ff0000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
          >
            <Text style={{ fontWeight: '700', color: '#fff', textTransform: 'uppercase' }}>Pro</Text>
            <Ionicons name="star" size={16} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => nav.navigate('Settings')}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#000' }}
          >
            <Text style={{ fontWeight: '700', color: '#fff' }}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: 30, paddingBottom: 16, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginBottom: 8 }}>
        <Text style={{ color: '#6b7280' }}>Auto save to gallery</Text>
        <Toggle value={autoSave} onValueChange={() => toggleAutoSave()} />
      </View>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={items}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={<Empty />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const thumb = thumbs[item.id];
          const created = new Date(item.created_at);
          return (
            <TouchableOpacity onPress={() => open(item.id)} style={{ width: '48%', marginBottom: 12 }}>
              <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff' }}>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: '100%', height: 120, backgroundColor: '#f3f4f6' }} />
                )}
                <View style={{ padding: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: '#111827', fontWeight: '700' }} numberOfLines={1}>
                      {item.style || '—'}
                    </Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: statusColor(item.status) }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' }}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={{ marginTop: 4, color: '#6b7280', fontSize: 11 }} numberOfLines={1}>
                    {created.toLocaleDateString()} {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      </View>
    </SafeAreaView>
  );
}
