import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  opacity?: number;
  testID?: string;
};

export default function ArtifactImage({
  source,
  size,
  width,
  height,
  style,
  containerStyle,
  opacity = 1,
  testID,
}: Props) {
  const w = width ?? size ?? 48;
  const h = height ?? size ?? 48;

  return (
    <View style={[styles.wrap, { width: w, height: h, opacity }, containerStyle]} testID={testID}>
      <Image source={source} style={[styles.image, { width: w, height: h }, style]} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
