import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSessionGate } from '../lib/session';
import { Ionicons } from '@expo/vector-icons';
import { listJobs, getJob } from '../lib/api';

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { userId, signOut } = useSessionGate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Match Settings screen styling
  const COLORS = {
    bg: '#f5f6f7',
    card: '#ffffff',
    text: '#111827',
    sub: '#6b7280',
    black: '#111111',
    red: '#ef4444',
    border: '#e5e7eb'
  } as const;

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View style={{ backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 }}>{children}</View>
  );
  const Row = ({ icon, title, subtitle, onPress, right, danger }: { icon?: any; title: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode; danger?: boolean }) => (
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
      {icon ? (
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          {icon}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? COLORS.red : COLORS.text, fontWeight: '700' }}>{title}</Text>
        {subtitle ? <Text style={{ color: COLORS.sub, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={COLORS.sub} /> : null)}
    </TouchableOpacity>
  );

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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>Profile</Text>
          <Row
            icon={<Ionicons name="person" size={18} color={COLORS.text} />}
            title="Your Account"
            subtitle={userId ? `ID: ${userId}` : undefined}
            right={<TouchableOpacity onPress={() => nav.navigate('Settings')} style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}><Text style={{ color: COLORS.text, fontWeight: '700' }}>Settings</Text></TouchableOpacity>}
          />
        </Card>

        {/* Go Pro */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>Subscription</Text>
          <Row icon={<Ionicons name="star" size={18} color={COLORS.text} />} title="Go Pro" subtitle="Unlock faster renders and HD results" onPress={() => nav.navigate('Paywall')} />
        </Card>

        {/* Past Designs */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>Past Designs</Text>
          {items.length === 0 ? (
            <View style={{ paddingVertical: 8 }}>
              <Text style={{ color: COLORS.sub }}>No designs yet. Start a new one from Explore.</Text>
            </View>
          ) : (
            <FlatList
              showsVerticalScrollIndicator={false}
              data={items}
              keyExtractor={(i) => i.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={{ paddingBottom: 8 }}
              renderItem={({ item }) => {
                const thumb = item.outputSignedUrls?.[0] || item.inputSignedUrl;
                return (
                  <TouchableOpacity onPress={() => openJob(item.id)} style={{ width: '48%', marginBottom: 12 }}>
                    <View style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, overflow: 'hidden', backgroundColor: COLORS.card }}>
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: '100%', height: 120, backgroundColor: '#f3f4f6' }} />
                      )}
                      <View style={{ padding: 8 }}>
                        <Text style={{ fontSize: 12, color: COLORS.text, fontWeight: '700' }} numberOfLines={1}>{item.style} • {item.status}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
              scrollEnabled={false}
            />
          )}
        </Card>

        {/* Account actions */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>Account</Text>
          <Row icon={<Ionicons name="log-out" size={18} color={COLORS.text} />} title="Sign out" onPress={() => signOut()} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
