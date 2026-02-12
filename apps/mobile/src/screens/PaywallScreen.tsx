import React, { useEffect, useState } from 'react';
import { ScrollView, View, Image, Text, TouchableOpacity, Dimensions, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initPurchases, getOfferings, purchasePackage, restorePurchases, getCustomerInfo } from '../lib/purchases';
import { useSessionGate } from '../lib/session';
import Toggle from '../components/Toggle';
import { trackEvent, trackPurchase } from '../lib/meta';

export default function PaywallScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { signOut } = useSessionGate();
  // Use local animated GIF for hero
  const heroSource = require('../../assets/Paywall Gif.gif');
  const [selectedPlan, setSelectedPlan] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('YEARLY');
  const { height: screenHeight } = Dimensions.get('window');
  const HERO_HEIGHT = Math.round(screenHeight * 0.4);

  // Load offerings on mount (native only). On web this will be a no-op.
  const [packages, setPackages] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      await initPurchases();
      try {
        const { current } = await getOfferings();
        setPackages(current?.availablePackages || []);
      } catch {}
    })();
  }, []);
  useEffect(() => {
    trackEvent('paywall_viewed');
  }, []);
  // Find a package by plan using packageType first, then common identifiers
  const findPackageByPlan = (plan: 'WEEKLY' | 'MONTHLY' | 'YEARLY') => {
    // Prefer matching by packageType from RevenueCat SDK
    const byType = packages.find((p: any) => (p.packageType || '').toUpperCase() === plan);
    if (byType) return byType;
    // Fallback to common identifiers
    const idMap: Record<typeof plan, string[]> = {
      WEEKLY: ['weekly', '$rc_weekly'],
      MONTHLY: ['monthly', '$rc_monthly'],
      YEARLY: ['annual', 'yearly', '$rc_annual']
    } as const;
    const candidates = idMap[plan];
    const byId = packages.find((p: any) => candidates.includes(p.identifier));
    return byId || packages[0];
  };

  const activePackage = findPackageByPlan(selectedPlan);
  const purchaseDisabled = !activePackage;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      contentContainerStyle={{ paddingBottom: 0 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', height: HERO_HEIGHT, position: 'relative' }}>
        <Image source={heroSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {/* Back button overlay */}
        <TouchableOpacity
          onPress={() => nav.goBack()}
          accessibilityRole="button"
          style={{
            position: 'absolute',
            left: 16,
            top: Math.max(12, insets.top + 8),
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(17,24,39,0.6)',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Content */}
      <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: '100%' }}>
            <Text style={{ fontSize: 28, fontWeight: '700', textAlign: 'center' }}>
              Start Designing
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>
              See the magic happen
            </Text>
            <Text style={{ marginTop: 6, fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
              Unlock unlimited designs and generations
            </Text>
            {/* Subscription plan buttons */}
            {([
                  { key: 'YEARLY' as const, label: 'Yearly', price: 39.99, cadence: 'year' },
                  { key: 'MONTHLY' as const, label: 'Monthly', price: 19.99, cadence: 'month' },
                  { key: 'WEEKLY' as const, label: 'Weekly', price: 9.99, cadence: 'week' }
                ]).map((p, idx) => {
              const active = selectedPlan === p.key;
              const weeklyDisplay = p.key === 'YEARLY' ? '$.99/wk' : p.key === 'MONTHLY' ? '$4.99/wk' : '$9.99/wk';
              return (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setSelectedPlan(p.key)}
                  activeOpacity={0.8}
                  style={{
                    marginTop: idx === 0 ? 14 : 10,
                    width: '100%',
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? '#ff0000' : '#e5e7eb',
                    borderRadius: 12,
                    backgroundColor: '#fff',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  {/* Left: radio + label */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: active ? '#ff0000' : '#cbd5e1',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10
                      }}
                    >
                      {active ? (
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff0000' }} />
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{p.label}</Text>
                  </View>

                  {/* Right: price block */}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                      {weeklyDisplay}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>${p.price.toFixed(2)}/{p.cadence}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={async () => {
                try {
                  const pkg = activePackage;
                  if (!pkg) return Alert.alert('No purchase available', 'Purchases are not available at the moment.');
                  trackEvent('initiate_checkout', { plan: selectedPlan });
                  await purchasePackage(pkg);
                  const info = await getCustomerInfo();
                  const active = (info as any)?.entitlements?.active?.pro;
                  if (active) {
                    const price = Number(pkg?.product?.price ?? pkg?.product?.priceAmount ?? 0);
                    const currency = String(pkg?.product?.currencyCode ?? 'USD');
                    if (price > 0) {
                      trackPurchase(price, currency, { plan: selectedPlan });
                    } else {
                      trackEvent('purchase', { plan: selectedPlan });
                    }
                    Alert.alert('You are Pro!');
                    nav.goBack();
                  } else {
                    Alert.alert('Purchase incomplete', 'Pro entitlement not active yet');
                  }
                } catch (e: any) {
                  Alert.alert('Purchase failed', e?.message || 'Unable to purchase');
                }
              }}
              activeOpacity={0.9}
              style={{
                backgroundColor: purchaseDisabled ? '#f3f4f6' : '#ff0000',
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: 'center',
                marginTop: 14
              }}
              disabled={purchaseDisabled}
            >
              <Text style={{ color: purchaseDisabled ? '#9ca3af' : '#fff', fontWeight: '800' }}>Continue</Text>
            </TouchableOpacity>
            {/* Restore Purchases link */}
            <TouchableOpacity
              onPress={async () => {
                try {
                  await restorePurchases();
                  Alert.alert('Purchases restored');
                } catch (e: any) {
                  Alert.alert('Restore failed', e?.message || 'Unable to restore');
                }
              }}
              activeOpacity={0.8}
              style={{ alignSelf: 'center', marginTop: 10 }}
            >
              <Text style={{ textDecorationLine: 'underline', color: '#6b7280', fontSize: 13 }}>Restore Purchases</Text>
            </TouchableOpacity>
            {/* Footer links: Privacy / Logout / Terms */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
              <TouchableOpacity onPress={() => Linking.openURL('https://decorly.app/privacy')} accessibilityRole="link">
                <Text style={{ fontSize: 11, color: '#6b7280' }}>Privacy</Text>
              </TouchableOpacity>
              <Text style={{ marginHorizontal: 10, color: '#9ca3af' }}>|</Text>
              <TouchableOpacity onPress={() => signOut()} accessibilityRole="link">
                <Text style={{ fontSize: 11, color: '#6b7280' }}>Logout</Text>
              </TouchableOpacity>
              <Text style={{ marginHorizontal: 10, color: '#9ca3af' }}>|</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')} accessibilityRole="link">
                <Text style={{ fontSize: 11, color: '#6b7280' }}>EULA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
