import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type CardItem = {
  key: string;
  title: string;
  image: string;
  mode: string;
  description: string;
};

const DATA: CardItem[] = [
  {
    key: 'interior',
    title: 'Interior Design',
    image: 'https://picsum.photos/seed/decorly-interior/1600/900',
    mode: 'interior',
    description: 'Transform room layouts, furniture, and decor styles.'
  },
  {
    key: 'replace',
    title: 'Replace Objects',
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1600&auto=format&fit=crop',
    mode: 'replace',
    description: 'Swap furniture, fixtures, or decor items.'
  },
  {
    key: 'floor',
    title: 'Floor Redesign',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1600&auto=format&fit=crop',
    mode: 'floor',
    description: 'Try new materials, patterns, and finishes.'
  },
  {
    key: 'garden',
    title: 'Garden Design',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1600&auto=format&fit=crop',
    mode: 'garden',
    description: 'Plan planting, pathways, seating, and lighting.'
  },
  {
    key: 'paint',
    title: 'Paint',
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1600&auto=format&fit=crop',
    mode: 'paint',
    description: 'Preview fresh wall and trim color palettes.'
  },
  {
    key: 'exterior',
    title: 'Exterior Design',
    image: 'https://picsum.photos/seed/decorly-exterior/1600/900',
    mode: 'exterior',
    description: 'Refresh facades, materials, and curb appeal.'
  },
  {
    key: 'custom',
    title: 'Custom',
    image: 'https://picsum.photos/seed/decorly-custom/1600/900',
    mode: 'custom',
    description: 'Describe your own transformation.'
  },
  {
    key: 'declutter',
    title: 'Declutter',
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1600&auto=format&fit=crop',
    mode: 'declutter',
    description: 'Remove visual clutter and simplify spaces.'
  },
  
];

const CARD_HEIGHT = 300;
const IMAGE_HEIGHT = Math.round(CARD_HEIGHT * 0.7);
const screenWidth = Dimensions.get('window').width;
const CARD_MARGIN = 24;
const CARD_WIDTH = screenWidth - CARD_MARGIN * 2;

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const interiorGif = require('../../assets/Untitled design (3).gif');
  const exteriorGif = require('../../assets/ExteriorCard.gif');
  const gardenGif = require('../../assets/GardenCard.gif');
  const paintGif = require('../../assets/PaintCard.gif');
  const floorGif = require('../../assets/Updated FloorCard.gif');
  const replaceGif = require('../../assets/ReplaceCard.gif');
  const declutterGif = require('../../assets/Declutter Create Gif.gif');
  const customGif = require('../../assets/Custom Create Gif.gif');

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: '#ffffff' }}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 100, backgroundColor: '#ffffff' }}
      data={DATA}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => (
        <View style={{ marginHorizontal: CARD_MARGIN, marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' }}>
          <Image
            source={
              item.key === 'interior'
                ? interiorGif
                : item.key === 'exterior'
                ? exteriorGif
                : item.key === 'garden'
                ? gardenGif
                : item.key === 'paint'
                ? paintGif
                : item.key === 'floor'
                ? floorGif
              : item.key === 'replace'
                ? replaceGif
                : item.key === 'declutter'
                ? declutterGif
                : item.key === 'custom'
                ? customGif
                : { uri: item.image }
            }
            style={{ width: CARD_WIDTH, height: IMAGE_HEIGHT }}
            resizeMode="cover"
          />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#f3f4f6' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700' }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: '#4b5563' }} numberOfLines={1}>{item.description}</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                item.mode === 'garden'
                  ? nav.navigate('GardenCreate', { mode: item.mode, title: item.title })
                  : item.mode === 'paint'
                  ? nav.navigate('PaintCreate', { mode: item.mode, title: item.title })
                  : item.mode === 'floor'
                  ? nav.navigate('FloorCreate', { mode: item.mode, title: item.title })
                  : item.mode === 'replace'
                  ? nav.navigate('ReplaceCreate', { mode: item.mode, title: item.title })
                  : item.mode === 'declutter'
                  ? nav.navigate('DeclutterCreate', { mode: item.mode, title: item.title })
                  : nav.navigate('InteriorCreate', { mode: item.mode, title: item.title })
              }
              style={{
                backgroundColor: '#111827',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Try it</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}
