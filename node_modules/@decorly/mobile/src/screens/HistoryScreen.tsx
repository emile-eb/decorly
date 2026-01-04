import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { listJobs, getJob } from '../lib/api';
import { useNavigation } from '@react-navigation/native';

export default function HistoryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const nav = useNavigation<any>();

  useEffect(() => {
    (async () => {
      try {
        const jobs = await listJobs();
        setItems(jobs);
      } catch {
        // ignore
      }
    })();
  }, []);

  const open = async (id: string) => {
    const job = await getJob(id);
    nav.navigate('Results', { job });
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => open(item.id)} style={{ paddingVertical: 12, borderBottomWidth: 1 }}>
            <Text>{item.style} • {item.status}</Text>
            <Text>{new Date(item.created_at).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

