import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PixelAvatar from './PixelAvatar';
import ArtifactImage from './ArtifactImage';
import { getScenarioArtifact, ARTIFACTS } from '../game/artifacts';

type Props = {
  scene: 'home' | 'street' | 'school' | 'phone' | 'college' | 'hostel' | 'bank';
  age: number;
  scenarioId?: string;
};

const SKY: Record<Props['scene'], [string, string]> = {
  home: ['#FFE8C8', '#FFB36B'],
  street: ['#B8DCFF', '#7FBFFF'],
  school: ['#D4CCFF', '#A29BFE'],
  phone: ['#1A1A2E', '#16213E'],
  college: ['#FFD4C8', '#FAB1A0'],
  hostel: ['#FFF3C4', '#FFEAA7'],
  bank: ['#C8F5EF', '#81ECEC'],
};

const GROUND: Record<Props['scene'], string> = {
  home: '#8BC34A',
  street: '#78909C',
  school: '#5C6BC0',
  phone: '#0F1419',
  college: '#A1887F',
  hostel: '#BCAAA4',
  bank: '#66BB6A',
};

/** One backdrop artifact per scene type — keeps the frame readable. */
const SCENE_BACKDROP: Record<Props['scene'], keyof typeof ARTIFACTS> = {
  home: 'childhood',
  street: 'city',
  school: 'school',
  phone: 'wallet',
  college: 'college',
  hostel: 'student',
  bank: 'building',
};

export default function PixelScene({ scene, age, scenarioId }: Props) {
  const sky = SKY[scene];
  const ground = GROUND[scene];
  const backdropKey = SCENE_BACKDROP[scene];
  const featuredKey = scenarioId ? getScenarioArtifact(scenarioId) : null;

  return (
    <View style={s.wrap} testID="pixel-scene">
      <LinearGradient colors={sky} style={StyleSheet.absoluteFillObject} />

      {/* Soft scene backdrop */}
      <ArtifactImage
        source={ARTIFACTS[backdropKey]}
        width={220}
        height={140}
        opacity={0.18}
        containerStyle={s.backdrop}
      />

      {/* Horizon line */}
      <View style={s.horizon} />

      {/* Ground */}
      <View style={[s.ground, { backgroundColor: ground }]}>
        <View style={s.groundShade} />
      </View>

      {/* Featured scenario artifact — single focal prop */}
      {featuredKey ? (
        <View style={s.featuredWrap}>
          <View style={s.featuredPedestal}>
            <ArtifactImage source={ARTIFACTS[featuredKey]} width={72} height={72} />
          </View>
        </View>
      ) : null}

      {/* Player avatar */}
      <View style={s.avatarWrap}>
        <PixelAvatar size={52} testID="pixel-avatar" />
        <View style={s.avatarShadow} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 4,
    borderBottomColor: '#000',
  },
  backdrop: {
    position: 'absolute',
    alignSelf: 'center',
    top: 6,
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 108,
    height: 4,
    backgroundColor: '#000',
    opacity: 0.35,
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 108,
    borderTopWidth: 4,
    borderTopColor: '#000',
  },
  groundShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  featuredWrap: {
    position: 'absolute',
    right: 18,
    bottom: 72,
    alignItems: 'center',
  },
  featuredPedestal: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  avatarWrap: {
    position: 'absolute',
    left: 24,
    bottom: 68,
    alignItems: 'center',
    zIndex: 5,
  },
  avatarShadow: {
    width: 48,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 3,
    marginTop: 2,
  },
});
