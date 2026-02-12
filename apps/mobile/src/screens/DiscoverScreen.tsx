import React, { useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function DiscoverScreen() {
  const nav = useNavigation<any>();
  const interiorSubs = [
    'Living Room',
    'Bedroom',
    'Bathroom',
    'Dining Room',
    'Kitchen',
    'Nursery',
    'Under Stairwell',
    'Hallway',
    'Home Office',
    'Kids Room',
    'Attic',
    'Basement',
    'Home Theater'
  ];

  const gardenSubs = ['Front Yard', 'Backyard', 'Side Yard', 'Courtyard', 'Patio'];


  // Thumbnail sources from local assets
  const interiorExamples = [
    require('../../assets/int ex 1.webp'),
    require('../../assets/int ex 2.jpg'),
    require('../../assets/int ex 3.jpg'),
    require('../../assets/int ex 4.jpg'),
    require('../../assets/int ex 5.jpg'),
    require('../../assets/int ex 6.webp')
  ];
  const gardenExamples = [
    require('../../assets/Garden Design Example.jpg'),
    require('../../assets/Garden Design Example 2.jpg'),
    require('../../assets/Garden Design Example 3.jpg'),
    require('../../assets/Garden Design Example 4.jpg'),
    require('../../assets/Garden Design Example 6.png')
  ];
  // Prefer specific "<Name> Discover" assets when present
  const interiorDiscoverThumbs: Record<string, any> = {
    'Living Room': require('../../assets/Living Room Discover.avif'),
    Bedroom: require('../../assets/Bedroom Discover.webp'),
    Bathroom: require('../../assets/Bathroom Discover.webp'),
    'Dining Room': require('../../assets/Dining Room Discover.webp'),
    Kitchen: require('../../assets/Kitchen Discover.webp'),
    Nursery: require('../../assets/Nursery Discover.jpg'),
    'Under Stairwell': require('../../assets/Under Stairwell Discover.jpg'),
    Hallway: require('../../assets/Hallway Discover.jpg'),
    'Home Office': require('../../assets/Home Office Discover.webp'),
    'Kids Room': require('../../assets/Kids Room Discover.jpg'),
    // Note: file named "Home Theartre Discover.webp" (typo in filename)
    'Home Theater': require('../../assets/Home Theartre Discover.webp')
  };
  const gardenDiscoverThumbs: Record<string, any> = {
    'Front Yard': require('../../assets/Front Yard Discover.jpg'),
    Backyard: require('../../assets/Backyard Discover.jpg'),
    'Side Yard': require('../../assets/Side Yard Discover.jpg'),
    Courtyard: require('../../assets/Courtyard Discover.jpeg'),
    Patio: require('../../assets/Patio Discover.jpg')
  };
  const exteriorThumb = require('../../assets/Exterior Example Photo 1.jpg');

  function pickFallback(label: string, arr: any[]) {
    const code = Array.from(label).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return arr[code % arr.length];
  }

  const PhotoTile = ({ source, onPress }: { source: any; onPress?: () => void }) => (
    <TouchableOpacity onPress={onPress} style={{ width: '48%', marginBottom: 12 }}>
      <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>
        <Image source={source} style={{ width: '100%', height: 140 }} resizeMode="cover" />
      </View>
    </TouchableOpacity>
  );

  const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) => (
    <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>{title}</Text>
      {subtitle ? <Text style={{ marginTop: 4, color: '#6b7280' }}>{subtitle}</Text> : null}
      <View style={{ height: 10 }} />
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: '#ffffff' }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#111827' }}>Discover</Text>
          <Text style={{ marginTop: 4, color: '#6b7280' }}>Get inspiration for your home</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <Section title="Interior" subtitle="Browse rooms and find styles you love">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {interiorSubs.map((s) => (
            <PhotoTile
              key={s}
              source={interiorDiscoverThumbs[s] ?? pickFallback(s, interiorExamples)}
              onPress={() => nav.navigate('DiscoverFeed', { category: 'interior', title: s })}
            />
          ))}
        </View>
      </Section>

      <Section title="Exterior" subtitle="Curb appeal, materials, and facades">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <PhotoTile source={exteriorThumb} onPress={() => nav.navigate('DiscoverFeed', { category: 'exterior', title: 'Exterior' })} />
        </View>
      </Section>

      <Section title="Garden" subtitle="Planting, pathways, seating, and lighting">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {gardenSubs.map((s) => (
            <PhotoTile
              key={s}
              source={gardenDiscoverThumbs[s] ?? pickFallback(s, gardenExamples)}
              onPress={() => nav.navigate('DiscoverFeed', { category: 'garden', title: s })}
            />
          ))}
        </View>
      </Section>
      </ScrollView>
    </View>
  );
}
