import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, Platform, ScrollView, Image, Pressable, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSessionGate } from '../lib/session';
import { getCustomerInfo, restorePurchases } from '../lib/purchases';
import { supabase } from '../lib/supabase';

export default function SettingsScreen() {
  const nav = useNavigation<any>();
  const { signOut, userId } = useSessionGate();
  const [email, setEmail] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
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
        {/* Subscription */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>Subscription</Text>
          <Row
            icon={<Ionicons name="card" size={18} color={COLORS.text} />}
            title={`${subLabel}`}
            subtitle={renewal && renewal !== '—' ? `Renews ${renewal}` : subStatus}
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

        {/* Support & Legal */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>Support & Legal</Text>
          <Row icon={<Ionicons name="mail" size={18} color={COLORS.text} />} title="Contact support" onPress={() => Linking.openURL('https://decorlysite.vercel.app/contact')} />
          <Row icon={<Ionicons name="help-circle" size={18} color={COLORS.text} />} title="FAQ / Help" onPress={() => Linking.openURL('https://decorlysite.vercel.app/')} />
          <Row icon={<Ionicons name="document-text" size={18} color={COLORS.text} />} title="Privacy policy" onPress={() => Linking.openURL('https://decorlysite.vercel.app/privacy')} />
          <Row icon={<Ionicons name="document-text" size={18} color={COLORS.text} />} title="Terms of service" onPress={() => Linking.openURL('https://decorlysite.vercel.app/terms')} />
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: COLORS.sub, fontSize: 12 }}>App version {version}{build ? ` (${build})` : ''}</Text>
          </View>
        </Card>

        {/* Sign out */}
        <Card>
          <Text style={{ color: COLORS.sub, marginBottom: 10 }}>Sign out</Text>
          <Row icon={<Ionicons name="log-out" size={18} color={COLORS.red} />} title="Sign out" danger onPress={() => signOut()} />
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}
