import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useSessionGate } from '../lib/session';
import { getCustomerInfo, openManageSubscriptions, restorePurchases } from '../lib/purchases';
import { supabase } from '../lib/supabase';

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
  const build = Platform.OS === 'ios' ? String(Constants.expoConfig?.ios?.buildNumber || '') : String(Constants.expoConfig?.android?.versionCode || '');

  const Row = ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
    <TouchableOpacity activeOpacity={onPress ? 0.6 : 1} onPress={onPress} style={{ paddingVertical: 14 }}>
      {children}
    </TouchableOpacity>
  );
  const Divider = () => <View style={{ height: 1, backgroundColor: '#e5e7eb' }} />;
  const Label = ({ text }: { text: string }) => <Text style={{ color: '#6b7280' }}>{text}</Text>;
  const Value = ({ text }: { text: string }) => <Text style={{ fontWeight: '600' }}>{text}</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 16, paddingTop: 16 }}>
      {/* Account */}
      <View>
        <Row>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Text style={{ fontWeight: '700' }}>{email ? email[0]?.toUpperCase() : '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>{email || '—'}</Text>
              <Text style={{ color: '#6b7280', fontSize: 12 }}>{provider === 'apple' ? 'Apple' : 'Email'}</Text>
            </View>
          </View>
        </Row>
        <Row onPress={() => signOut()}>
          <Value text="Sign out" />
        </Row>
        <Row
          onPress={() => {
            Alert.alert('Delete account', 'This will permanently delete your account and data. Continue?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    // Client cannot delete Supabase user directly; open support email as fallback
                    await Linking.openURL('mailto:support@decorly.app?subject=Delete%20account%20request');
                  } catch {}
                }
              }
            ]);
          }}
        >
          <Value text="Delete account" />
        </Row>
      </View>

      <Divider />

      {/* Subscription */}
      <View>
        <Row>
          <Label text="Subscription" />
          <View style={{ height: 6 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Value text={subLabel} />
            <Text style={{ color: '#6b7280' }}>{subStatus}{renewal && renewal !== '—' ? ` • Renews ${renewal}` : ''}</Text>
          </View>
        </Row>
        <Row onPress={() => openManageSubscriptions()}>
          <Value text="Manage subscription" />
        </Row>
        <Row
          onPress={async () => {
            try {
              await restorePurchases();
              Alert.alert('Purchases restored');
            } catch (e: any) {
              Alert.alert('Restore failed', e?.message || 'Unable to restore');
            }
          }}
        >
          <Value text="Restore purchases" />
        </Row>
      </View>

      <Divider />

      {/* App preferences */}
      <View>
        <Row>
          <Label text="Image quality" />
          <View style={{ height: 6 }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['Standard', 'High'] as const).map((q) => (
              <TouchableOpacity key={q} onPress={() => setPref('imageQuality', q)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: prefs.imageQuality === q ? 2 : 1, borderColor: prefs.imageQuality === q ? '#111827' : '#e5e7eb' }}>
                <Text style={{ fontWeight: '600' }}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Row>
        <Row>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label text="Notifications (job completed)" />
            <Switch value={prefs.notifications} onValueChange={(v) => setPref('notifications', v)} />
          </View>
        </Row>
        <Row>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label text="Auto save results to gallery" />
            <Switch value={prefs.autoSave} onValueChange={(v) => setPref('autoSave', v)} />
          </View>
        </Row>
      </View>

      <Divider />

      {/* Support & Legal */}
      <View>
        <Row onPress={() => Linking.openURL('mailto:support@decorly.app')}>
          <Value text="Contact support" />
        </Row>
        <Row onPress={() => Linking.openURL('https://decorly.app/help')}>
          <Value text="FAQ / Help" />
        </Row>
        <Row onPress={() => Linking.openURL('https://decorly.app/privacy')}>
          <Value text="Privacy policy" />
        </Row>
        <Row onPress={() => Linking.openURL('https://decorly.app/terms')}>
          <Value text="Terms of service" />
        </Row>
        <Row onPress={() => Linking.openURL('https://decorly.app/data')}>
          <Value text="Data usage" />
        </Row>
        <Row>
          <Label text="App version" />
          <View style={{ height: 6 }} />
          <Value text={`${version}${build ? ` (${build})` : ''}`} />
        </Row>
      </View>
    </View>
  );
}
