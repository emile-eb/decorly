import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, RefreshControl, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSessionGate } from '../lib/session';
import { Ionicons } from '@expo/vector-icons';
import { listJobs, getJob } from '../lib/api';

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { userId, signOut } = useSessionGate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const jobs = await listJobs();
      setItems(jobs);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubs = nav.addListener('focus', load);
    load();
    return unsubs;
  }, [nav]);

  const openJob = async (id: string) => {
    const job = await getJob(id);
    nav.navigate('Results', { job });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ padding: 16 }}>
      {/* Header Row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Ionicons name="person" size={24} color="#111827" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700' }}>Your Profile</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }} numberOfLines={1}>ID: {userId}</Text>
        </View>
        <TouchableOpacity onPress={() => nav.navigate('Settings')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#111827' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Pro Promo Card */}
      <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', marginBottom: 16, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#111827' }}>
          <Ionicons name="star" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Go Pro</Text>
        </View>
        <View style={{ padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, color: '#111827' }}>Unlock faster renders and HD results.</Text>
          <TouchableOpacity onPress={() => nav.navigate('Paywall')} style={{ marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Past Designs */}
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Past Designs</Text>
      {items.length === 0 ? (
        <View style={{ padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ color: '#6b7280' }}>No designs yet. Start a new one from Explore.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => {
            const thumb = item.outputSignedUrls?.[0] || item.inputSignedUrl;
            return (
              <TouchableOpacity onPress={() => openJob(item.id)} style={{ width: '48%', marginBottom: 12 }}>
                <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: '100%', height: 120, backgroundColor: '#f3f4f6' }} />
                  )}
                  <View style={{ padding: 8 }}>
                    <Text style={{ fontSize: 12, color: '#111827' }} numberOfLines={1}>{item.style} • {item.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          scrollEnabled={false}
        />
      )}

      {/* Danger zone */}
      <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={signOut} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#ef4444' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
