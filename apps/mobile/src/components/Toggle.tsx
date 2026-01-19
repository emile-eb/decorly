import React from 'react';
import { Pressable, Animated, Easing } from 'react-native';

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  width?: number;
  height?: number;
  activeColor?: string;
  inactiveColor?: string;
};

export default function Toggle({
  value,
  onValueChange,
  width = 58,
  height = 32,
  activeColor = '#ff0000',
  inactiveColor = '#9ca3af'
}: Props) {
  const contentPadding = 4;
  const knobSize = Math.min(height - contentPadding * 2, 24);
  const radius = height / 2;
  const translateMax = width - contentPadding * 2 - knobSize; // slide across inner width

  const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [value]);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor]
  });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, translateMax] });

  return (
    <Pressable onPress={() => onValueChange(!value)} style={{ width, height, borderRadius: radius, padding: contentPadding }}>
      <Animated.View
        style={{
          flex: 1,
          borderRadius: radius,
          backgroundColor: bg,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Animated.View
          style={{
            width: knobSize,
            height: knobSize,
            borderRadius: knobSize / 2,
            backgroundColor: '#fff',
            transform: [{ translateX }],
            position: 'absolute',
            left: 0,
            top: 0,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 2,
            elevation: 2
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
