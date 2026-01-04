import React from 'react';
import { View, Text, Image, ScrollView, Button } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function ResultsScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const job = route.params?.job;
  const before = job?.inputSignedUrl;
  const after = job?.outputSignedUrls?.[0];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Before</Text>
      {before ? <Image source={{ uri: before }} style={{ width: '100%', height: 280, borderRadius: 8 }} /> : null}
      <Text style={{ fontSize: 18, fontWeight: '600' }}>After</Text>
      {after ? <Image source={{ uri: after }} style={{ width: '100%', height: 280, borderRadius: 8 }} /> : null}
      <Button title="Back to Upload" onPress={() => nav.navigate('Upload')} />
    </ScrollView>
  );
}

