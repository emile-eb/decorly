import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, Platform, ScrollView, Image, Pressable, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSessionGate } from '../lib/session';
import { getCustomerInfo, openManageSubscriptions, restorePurchases } from '../lib/purchases';
import { supabase } from '../lib/supabase';
import Toggle from '../components/Toggle';

type Prefs = {
  imageQuality: 'Standard' | 'High';
  autoSave: boolean;
  notifications: boolean;
};

const DEFAULT_PREFS: Prefs = {
  imageQuality: 'Standard',
  autoSave: false,
  notifications: true
};

export default function SettingsScreen() {
  const nav = useNavigation<any>();
  const { signOut } = useSessionGate();
  const [email, setEmail] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [subLabel, setSubLabel] = useState<string>('Free');
  const [subStatus, setSubStatus] = useState<string>('Inactive');
  const [renewal, setRenewal] = useState<string>('—');

  useEffect(() => {
    // Load account info
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user as any;
      setEmail(u?.email || '');
      const prov = Array.isArray(u?.identities) && u.identities[0]?.provider ? u.identities[0].provider : 'email';
      setProvider(prov);
    });
    // Load subscription info (best-effort)
    getCustomerInfo().then((info: any) => {
      const active = info?.entitlements?.active || {};
      const isPro = !!active.pro;
      setSubLabel(isPro ? 'Pro' : 'Free');
      setSubStatus(isPro ? 'Active' : 'Inactive');
      const exp = info?.latestExpirationDate;
      setRenewal(exp ? new Date(exp).toLocaleDateString() : '—');
    }).catch(() => {});
  }, []);

  // Simple in-memory prefs; could persist to SecureStore if desired
  const setPref = <K extends keyof Prefs>(key: K, val: Prefs[K]) => setPrefs((p) => ({ ...p, [key]: val }));

  const version = String(Constants.expoConfig?.version || '');
  const build = Platform.OS === 'ios' ? String(Constants.expoConfig?.ios?.buildNumber || '') : '';

  const COLORS = {
    bg: '#f5f6f7',
    card: '#ffffff',
    text: '#111827',
    sub: '#6b7280',
    black: '#111111',
    red: '#ef4444',
    border: '#e5e7eb'
  } as const;

  // Preview components for Loading and Results without spending generations
  const PreviewProgress = () => {
    const translateY = React.useRef(new Animated.Value(0)).current;
    React.useEffect(() => {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, { toValue: -30, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
        ])
      );
      anim.start();
      return () => anim.stop();
    }, []);
    const sample = require('../../assets/int ex 2.jpg');
    return (
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <View style={{ width: '100%', aspectRatio: 3/4, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#f9fafb' }}>
          <Animated.View style={{ transform: [{ translateY }] }}>
            <Image source={sample} style={{ width: '100%', height: undefined, aspectRatio: 3/4 }} resizeMode="cover" />
          </Animated.View>
        </View>
        <Text style={{ marginTop: 8, color: COLORS.text, fontWeight: '700' }}>Designing your room…</Text>
      </View>
    );
  };

  const PreviewResults = () => {
    const [showBefore, setShowBefore] = React.useState(false);
    const before = require('../../assets/int ex 2.jpg');
    const after = require('../../assets/int ex 3.jpg');
    return (
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <View style={{ width: '100%', aspectRatio: 3/4, backgroundColor: '#f3f4f6', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border }}>
          <Image source={after} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          {showBefore ? (
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} pointerEvents="none">
              <Image source={before} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ) : null}
        </View>
        <View style={{ width: '100%', alignItems: 'flex-end', marginTop: 8 }}>
          <Pressable
            onPressIn={() => setShowBefore(true)}
            onPressOut={() => setShowBefore(false)}
            style={({ pressed }) => ({ backgroundColor: pressed ? '#111827' : '#000', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 999 })}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Hold: Before</Text>
          </Pressable>
        </View>
      </View>
    );
  };

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Debug / Environment removed */}
        {/* Subscription */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>Subscription</Text>
          <Row
            icon={<Ionicons name="card" size={18} color={COLORS.text} />}
            title={`${subLabel}`}
            subtitle={renewal && renewal !== '—' ? `Renews ${renewal}` : subStatus}
          />
          <Row
            icon={<Ionicons name="construct" size={18} color={COLORS.text} />}
            title="Manage subscription"
            onPress={() => openManageSubscriptions()}
          />
          <Row
            icon={<Ionicons name="refresh" size={18} color={COLORS.text} />}
            title="Restore purchases"
            onPress={async () => {
              try {
                await restorePurchases();
                Alert.alert('Purchases restored');
              } catch (e: any) {
                Alert.alert('Restore failed', e?.message || 'Unable to restore');
              }
            }}
          />
        </Card>

        {/* Preferences */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>App Preferences</Text>
          <Row
            icon={<Ionicons name="images" size={18} color={COLORS.text} />}
            title="Image quality"
            right={
              <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 4, borderRadius: 999 }}>
                {(['Standard', 'High'] as const).map((q) => (
                  <TouchableOpacity key={q} onPress={() => setPref('imageQuality', q)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: prefs.imageQuality === q ? COLORS.red : 'transparent' }}>
                    <Text style={{ color: prefs.imageQuality === q ? '#fff' : COLORS.text, fontWeight: '700', fontSize: 12 }}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            }
          />
          <Row
            icon={<Ionicons name="notifications" size={18} color={COLORS.text} />}
            title="Notifications"
            subtitle="Job completed"
            right={<Toggle value={prefs.notifications} onValueChange={(v) => setPref('notifications', v)} />}
          />
          <Row
            icon={<Ionicons name="download" size={18} color={COLORS.text} />}
            title="Auto save to gallery"
            right={<Toggle value={prefs.autoSave} onValueChange={(v) => setPref('autoSave', v)} />}
          />
        </Card>

        {/* Account */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>Account</Text>
          <Row icon={<Ionicons name="log-out" size={18} color={COLORS.text} />} title="Sign out" onPress={() => signOut()} />
          <Row
            icon={<Ionicons name="trash" size={18} color={COLORS.red} />}
            title="Delete account"
            danger
            onPress={() => {
              Alert.alert('Delete account', 'This will permanently delete your account and data. Continue?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await Linking.openURL('mailto:support@decorly.app?subject=Delete%20account%20request');
                    } catch {}
                  }
                }
              ]);
            }}
          />
        </Card>

        {/* Support & Legal */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>Support & Legal</Text>
          <Row icon={<Ionicons name="mail" size={18} color={COLORS.text} />} title="Contact support" onPress={() => Linking.openURL('mailto:support@decorly.app')} />
          <Row icon={<Ionicons name="help-circle" size={18} color={COLORS.text} />} title="FAQ / Help" onPress={() => Linking.openURL('https://decorly.app/help')} />
          <Row icon={<Ionicons name="document-text" size={18} color={COLORS.text} />} title="Privacy policy" onPress={() => Linking.openURL('https://decorly.app/privacy')} />
          <Row icon={<Ionicons name="document-text" size={18} color={COLORS.text} />} title="Terms of service" onPress={() => Linking.openURL('https://decorly.app/terms')} />
          <Row icon={<Ionicons name="shield-checkmark" size={18} color={COLORS.text} />} title="Data usage" onPress={() => Linking.openURL('https://decorly.app/data')} />
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: COLORS.sub, fontSize: 12 }}>App version {version}{build ? ` (${build})` : ''}</Text>
          </View>
        </Card>

        {/* Preview links */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>UI Previews</Text>
          <Row
            icon={<Ionicons name="time" size={18} color={COLORS.text} />}
            title="Open Loading Preview"
            subtitle="See the designing animation"
            onPress={() => nav.navigate('PreviewProgress')}
          />
          <Row
            icon={<Ionicons name="image" size={18} color={COLORS.text} />}
            title="Open Results Preview"
            subtitle="Hold to compare before/after"
            onPress={() => nav.navigate('PreviewResults')}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
