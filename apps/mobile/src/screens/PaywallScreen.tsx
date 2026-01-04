import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { restorePurchases, openManageSubscriptions } from '../lib/purchases';

export default function PaywallScreen() {
  const nav = useNavigation<any>();
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Static plan options (no RevenueCat offerings dependency)
  const normalized = useMemo(() => {
    return [
      { type: 'WEEKLY', label: 'Weekly', priceString: '$4.99/week', priceNumber: 4.99 },
      { type: 'MONTHLY', label: 'Monthly', priceString: '$9.99/month', priceNumber: 9.99 },
      { type: 'ANNUAL', label: 'Yearly', priceString: '$59.99/year', priceNumber: 59.99 }
    ];
  }, []);

  // Default to Annual for best value
  useEffect(() => {
    setSelectedIdx(2);
  }, []);

  const beforeImg = useMemo(() => require('../../assets/int ex 4.jpg'), []);
  const afterImg = useMemo(() => require('../../assets/Modern Interior Style.jpg'), []);

  const buy = async () => {
    try {
      const plan = normalized[selectedIdx] ?? normalized[0];
      if (!plan) return;
      // Placeholder: integrate store purchase here
      Alert.alert('Selected plan', `${plan.label} • ${plan.priceString}`);
      nav.goBack();
    } catch (e: any) {
      Alert.alert('Purchase failed', e.message || 'Unable to complete purchase');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#ffffff' }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Visual proof */}
      <View style={{ width: '100%', aspectRatio: 1.6, position: 'relative' }}>
        <View style={{ flexDirection: 'row', width: '100%', height: '100%' }}>
          <Image source={beforeImg} style={{ width: '50%', height: '100%' }} resizeMode="cover" />
          <Image source={afterImg} style={{ width: '50%', height: '100%' }} resizeMode="cover" />
        </View>
        <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 12, color: '#111827' }}>Before</Text>
        </View>
        <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 12, color: '#111827' }}>After</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {/* Value headline */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '700' }}>Visualize upgrades without spending money</Text>
        </View>

        {/* What you get */}
        <View style={{ marginTop: 12 }}>
          {["Unlimited redesign previews", "HD results", "Faster processing", "All styles & categories"].map((t) => (
            <View key={t} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={18} color="#111827" />
              <Text style={{ marginLeft: 8 }}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Plan selection */}
        <View style={{ marginTop: 16 }}>
          <View>
            {normalized.map((row: any, idx: number) => {
                const active = idx === selectedIdx;
                const price = row.priceString;
                const id = `plan-${row.type}`;
                const label = row.label;
                // Compute simple savings badge for annual vs monthly if prices available
                let badge: string | null = null;
                if (row.type === 'ANNUAL') {
                  const m = normalized.find((r: any) => r.type === 'MONTHLY');
                  if (m && typeof m.priceNumber === 'number' && typeof row.priceNumber === 'number') {
                    const annualizedMonthly = m.priceNumber * 12;
                    if (annualizedMonthly > row.priceNumber) {
                      const pct = Math.round(((annualizedMonthly - row.priceNumber) / annualizedMonthly) * 100);
                      if (pct > 0 && pct <= 90) badge = `Save ${pct}%`;
                    }
                  } else {
                    badge = 'Best value';
                  }
                }
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setSelectedIdx(idx)}
                    style={{
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? '#111827' : '#e5e7eb',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 10,
                      backgroundColor: active ? '#111827' : '#fff',
                      position: 'relative'
                    }}
                  >
                    {row.type === 'ANNUAL' && (
                      <View style={{ position: 'absolute', top: -10, right: 8, backgroundColor: '#111827', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{badge || 'Best value'}</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '700', color: active ? '#fff' : '#111827' }}>{label}</Text>
                      <Text style={{ fontWeight: '700', color: active ? '#fff' : '#111827' }}>{price}</Text>
                    </View>
                    <Text style={{ marginTop: 4, color: active ? '#e5e7eb' : '#6b7280' }}>Cancel anytime in App Store</Text>
                  </TouchableOpacity>
                );
            })}
            <TouchableOpacity
              onPress={buy}
              style={{ backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Start now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust & escape hatches */}
        <View style={{ marginTop: 16 }}>
          <TouchableOpacity onPress={() => openManageSubscriptions()} style={{ paddingVertical: 12 }}>
            <Text style={{ fontWeight: '600' }}>Manage subscription</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                await restorePurchases();
                Alert.alert('Purchases restored');
              } catch (e: any) {
                Alert.alert('Restore failed', e?.message || 'Unable to restore');
              }
            }}
            style={{ paddingVertical: 12 }}
          >
            <Text style={{ fontWeight: '600' }}>Restore purchases</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 16, paddingVertical: 8 }}>
            <TouchableOpacity onPress={() => nav.goBack()}>
              <Text style={{ color: '#6b7280' }}>Maybe later</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://decorly.app/privacy')}>
              <Text style={{ color: '#6b7280' }}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://decorly.app/terms')}>
              <Text style={{ color: '#6b7280' }}>Terms</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Billing managed by Apple. Cancel anytime. Restore purchases available.</Text>
        </View>
      </View>
    </ScrollView>
  );
}
