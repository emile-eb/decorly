import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Button, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getJob } from '../lib/api';

export default function ProgressScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const jobId = route.params?.jobId as string;
  const [status, setStatus] = useState('queued');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setInterval(async () => {
      try {
        const job = await getJob(jobId);
        if (cancelled) return;
        setStatus(job.status);
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

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <ActivityIndicator />
      <Text>Status: {status}</Text>
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
      {!!error && <Button title="Back" onPress={() => nav.navigate('Upload')} />}
    </View>
  );
}

