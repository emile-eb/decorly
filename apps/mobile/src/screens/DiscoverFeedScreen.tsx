import React, { useMemo } from 'react';
import { View, FlatList, Image, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function DiscoverFeedScreen() {
  const route = useRoute<any>();
  const category = (route.params?.category as 'interior' | 'garden' | 'exterior') || 'interior';

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
  const exteriorExamples = [
    require('../../assets/Exterior Example Photo 1.jpg'),
    require('../../assets/Exterior Example Photo 2.jpg'),
    require('../../assets/Exterior Example Photo 3.jpg'),
    require('../../assets/Exterior Modern Example.jpg'),
    require('../../assets/Exterior Craftsman Example.jpg')
  ];

  const data = useMemo(() => {
    const base = category === 'interior' ? interiorExamples : category === 'garden' ? gardenExamples : exteriorExamples;
    // repeat to create a longer feed
    const arr: any[] = [];
    for (let i = 0; i < 4; i++) arr.push(...base);
    // map to objects with key and source
    return arr.map((src, idx) => ({ key: `${category}-${idx}`, src }));
  }, [category]);

  const screenWidth = Dimensions.get('window').width;
  const imageHeight = Math.round((screenWidth - 32) * 0.6); // 60% of content width

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <FlatList
        data={data}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' }}>
            <Image source={item.src} style={{ width: '100%', height: imageHeight }} resizeMode="cover" />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

