import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Button, Alert, Image, Animated, Easing } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getJob } from '../lib/api';

export default function ProgressScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const jobId = route.params?.jobId as string;
  const [status, setStatus] = useState('queued');
  const [error, setError] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState<string | null>(null);
  const translateY = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    const t = setInterval(async () => {
      try {
        const job = await getJob(jobId);
        if (cancelled) return;
        setStatus(job.status);
        if (!inputUrl && job.inputSignedUrl) setInputUrl(job.inputSignedUrl);
        if (job.status === 'complete') {
          clearInterval(t);
          nav.replace('Results', { job });
        } else if (job.status === 'failed') {
          clearInterval(t);
          setError(job.error || 'Unknown error');
        }
      } catch (e: any) {
        // ignore transient
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [jobId]);

  useEffect(() => {
    // subtle vertical pan animation to give a "scanning" feel over the uploaded image
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -30, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  useEffect(() => {
    // indeterminate loading bar animation
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bar, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(bar, { toValue: 0, duration: 0, useNativeDriver: false })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {inputUrl ? (
          <View style={{ width: '86%', aspectRatio: 3/4, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
            <Animated.View style={{ transform: [{ translateY }] }}>
              <Image source={{ uri: inputUrl }} style={{ width: '100%', height: undefined, aspectRatio: 3/4 }} resizeMode="cover" />
            </Animated.View>
          </View>
        ) : (
          <ActivityIndicator />
        )}
        <View style={{ height: 16 }} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Designing your room…</Text>
        <Text style={{ marginTop: 6, color: '#6b7280', fontSize: 12 }}>Don't lock your screen or leave the app</Text>
        <View style={{ height: 42 }} />
        <View style={{ width: '86%', height: 8, borderRadius: 999, backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
          <Animated.View
            style={{ height: '100%', width: bar.interpolate({ inputRange: [0, 1], outputRange: ['10%', '90%'] }), backgroundColor: '#111827', borderRadius: 999 }}
          />
        </View>
        {error ? <Text style={{ marginTop: 8, color: '#ef4444' }}>{error}</Text> : null}
        {!!error && <Button title="Back" onPress={() => nav.navigate('Upload')} />}
      </View>
    </View>
  );
}
