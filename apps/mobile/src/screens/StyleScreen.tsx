import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { createJob } from '../lib/api';

export default function StyleScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const inputImagePath = route.params?.inputImagePath as string;
  const inputLocalUri = route.params?.inputLocalUri as string | undefined;
  const [style, setStyle] = useState('modern');
  const [constraints, setConstraints] = useState('');

  const submit = async () => {
    try {
      const constraintsObj = constraints ? JSON.parse(constraints) : undefined;
      const body: any = { style, constraints: constraintsObj, inputImagePath };
      const { jobId } = await createJob(body);
      nav.navigate('Progress', { jobId });
    } catch (e: any) {
      console.error('[ui] StyleScreen submit error', e);
      Alert.alert('Job creation failed', e.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18 }}>Choose style and constraints</Text>
      <TextInput value={style} onChangeText={setStyle} placeholder="e.g., modern, cozy, Scandinavian" style={{ borderWidth: 1, padding: 12, borderRadius: 8 }} />
      <Text>Constraints (JSON, optional)</Text>
      <TextInput value={constraints} onChangeText={setConstraints} placeholder='{"budget": "low"}' style={{ borderWidth: 1, padding: 12, borderRadius: 8 }} multiline numberOfLines={5} />
      <Button title="Start" onPress={submit} />
    </View>
  );
}
