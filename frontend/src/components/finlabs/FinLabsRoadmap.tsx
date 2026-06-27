import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import LabHeader from '@/src/components/finlabs/LabHeader';
import { LabToast } from '@/src/components/finlabs/LabShared';
import { getFinLabsChapter, FinLabsChapter, LabNode } from '@/src/finlabs/chapters';
import { finLabsLabHref } from '@/src/finlabs/routes';
import { FL_BG, FL_GREEN, isLabFlagDone } from '@/src/finlabs/storage';
import { C, FONT } from '@/src/ui/theme';
import { play } from '@/src/game/audio';
import { ARTIFACTS, getChapterBackground } from '@/src/game/artifacts';

const NODE_SIZE = 48;

function getNodePositions(count: number) {
  const top = 0.12;
  const bottom = 0.88;
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    return {
      x: i % 2 === 0 ? 0.24 : 0.76,
      y: top + t * (bottom - top),
    };
  });
}

function makeTrail(
  p0: { x: number; y: number },
  p2: { x: number; y: number },
  curvature = 0.12,
) {
  const mid = { x: (p0.x + p2.x) / 2, y: (p0.y + p2.y) / 2 };
  const dx = p2.x - p0.x;
  const dy = p2.y - p0.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / (len || 1);
  const ny = dx / (len || 1);
  const c = { x: mid.x + nx * curvature, y: mid.y + ny * curvature };
  const out: { x: number; y: number }[] = [];
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const u = 1 - t;
    out.push({
      x: u * u * p0.x + 2 * u * t * c.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * c.y + t * t * p2.y,
    });
  }
  return out;
}

type Props = {
  chapterId: string;
};

export default function FinLabsRoadmap({ chapterId }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const canvasW = Math.min(width - 28, 400);
  const config = getFinLabsChapter(chapterId);
  const canvasH = config ? Math.max(280, config.labs.length * 52 + 80) : 220;

  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState(false);

  const refresh = React.useCallback(async () => {
    if (!config) return;
    const map: Record<string, boolean> = {};
    for (const lab of config.labs) {
      map[lab.doneKey] = await isLabFlagDone(lab.doneKey);
    }
    setDoneMap(map);
  }, [config]);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const showLockedToast = () => {
    setToast(true);
    play('bad');
    setTimeout(() => setToast(false), 2200);
  };

  if (!config) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LabHeader title="FIN LABS" onBack={() => router.replace('/')} />
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonEmoji}>🧪</Text>
          <Text style={styles.comingSoonTitle}>LABS COMING SOON</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="finlabs-roadmap">
      <StatusBar barStyle="light-content" />
      <LabToast message="Complete the previous lab first" visible={toast} />
      <LabHeader
        title={`${config.title} · FIN LABS`}
        subtitle={config.subtitle}
        onBack={() => router.replace('/')}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.roadmapTitle}>PRACTICE ROADMAP</Text>

        <LabsCanvas
          config={config}
          canvasW={canvasW}
          canvasH={canvasH}
          doneMap={doneMap}
          onLabPress={(lab) => {
            const unlocked =
              !lab.requiresDoneKey || doneMap[lab.requiresDoneKey];
            if (!unlocked) {
              showLockedToast();
              return;
            }
            play('coin');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            router.push(finLabsLabHref(chapterId, lab.route));
          }}
        />
      </ScrollView>
    </View>
  );
}

function LabsCanvas({
  config,
  canvasW,
  canvasH,
  doneMap,
  onLabPress,
}: {
  config: FinLabsChapter;
  canvasW: number;
  canvasH: number;
  doneMap: Record<string, boolean>;
  onLabPress: (lab: LabNode) => void;
}) {
  const positions = useMemo(() => getNodePositions(config.labs.length), [config.labs.length]);
  const bgKey = getChapterBackground(config.chapterId);

  const trailDots = useMemo(() => {
    const dots: { x: number; y: number }[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      dots.push(...makeTrail(positions[i], positions[i + 1], i % 2 === 0 ? 0.1 : -0.1));
    }
    return dots;
  }, [positions]);

  return (
    <View style={[styles.canvas, { width: canvasW, height: canvasH }]}>
      <ImageBackground
        source={ARTIFACTS[bgKey]}
        style={StyleSheet.absoluteFillObject}
        imageStyle={styles.canvasImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      {trailDots.map((p, i) => (
        <View
          key={i}
          style={[
            styles.trailDot,
            { left: p.x * canvasW - 3, top: p.y * canvasH - 3 },
          ]}
        />
      ))}

      {config.labs.map((lab, i) => {
        const pos = positions[i];
        const left = pos.x * canvasW - NODE_SIZE / 2;
        const top = pos.y * canvasH - NODE_SIZE / 2;
        const unlocked = !lab.requiresDoneKey || doneMap[lab.requiresDoneKey];
        const done = doneMap[lab.doneKey];

        return (
          <View key={lab.id} style={{ position: 'absolute', left, top, alignItems: 'center' }}>
            <Pressable
              onPress={() => onLabPress(lab)}
              style={({ pressed }) => [
                styles.node,
                done && styles.nodeDone,
                !unlocked && styles.nodeLocked,
                unlocked && !done && styles.nodeActive,
                pressed && unlocked && { transform: [{ scale: 0.94 }] },
              ]}
              testID={`finlab-node-${lab.id}`}
            >
              {!unlocked ? (
                <MaterialCommunityIcons name="lock" size={16} color="#666" />
              ) : lab.icon ? (
                <MaterialCommunityIcons
                  name={lab.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={25}
                  color="#0D0D0D"
                />
              ) : (
                <Text style={styles.nodeEmoji}>{lab.emoji}</Text>
              )}
              {done ? (
                <View style={styles.nodeCheck}>
                  <MaterialCommunityIcons name="check-bold" size={10} color="#000" />
                </View>
              ) : null}
            </Pressable>
            <View
              style={[
                styles.nodeLabel,
                pos.x < 0.5 ? { left: NODE_SIZE + 6 } : { right: NODE_SIZE + 6 },
                pos.x < 0.5 ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' },
              ]}
            >
              <Text style={styles.nodeNum}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.nodeTitle}>{lab.title}</Text>
              <Text style={styles.nodeSub}>{lab.subtitle}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: FL_BG },
  scroll: { padding: 14, paddingBottom: 30 },
  roadmapTitle: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 11,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 14,
  },
  canvas: {
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: FL_GREEN,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  canvasImage: { opacity: 0.9 },
  trailDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 2,
    borderColor: FL_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActive: { borderWidth: 3, backgroundColor: '#FFF' },
  nodeDone: { borderColor: C.green },
  nodeLocked: {
    backgroundColor: 'rgba(40,40,40,0.85)',
    borderColor: '#555',
  },
  nodeEmoji: { fontSize: 20 },
  nodeCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: FL_GREEN,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeLabel: {
    position: 'absolute',
    top: NODE_SIZE / 2 - 14,
    maxWidth: 130,
  },
  nodeNum: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 7,
    letterSpacing: 1,
  },
  nodeTitle: {
    fontFamily: FONT.display,
    color: '#FFF',
    fontSize: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  nodeSub: {
    fontFamily: FONT.body,
    color: '#aaa',
    fontSize: 10,
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  comingSoonEmoji: { fontSize: 48, marginBottom: 12 },
  comingSoonTitle: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 14,
    letterSpacing: 2,
  },
});
