import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import ArtifactImage from './ArtifactImage';
import { ARTIFACTS } from '../game/artifacts';

type Props = {
  age?: number;
  pixelSize?: number;
  size?: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/** Player character — uses the boy artifact instead of pixel art. */
export default function PixelAvatar({ pixelSize, size, testID, style }: Props) {
  const s = size ?? (pixelSize ? pixelSize * 8 : 56);
  return (
    <ArtifactImage
      source={ARTIFACTS.boy}
      width={s}
      height={s}
      testID={testID}
      containerStyle={style}
    />
  );
}
