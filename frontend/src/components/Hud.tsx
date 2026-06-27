import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, FONT } from '../ui/theme';
import ArtifactImage from './ArtifactImage';
import { ARTIFACTS } from '../game/artifacts';
import LearnTermsButton from './LearnTermsButton';

type Props = {
  age: number;
  cash: number;
  savings: number;
  debt: number;
  happiness: number;
  financialHealth?: number;
};

function fmt(n: number) {
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `Rs ${(n / 1000).toFixed(1)}K`;
  return `Rs ${Math.round(n)}`;
}

export default function Hud({ age, cash, savings, debt, happiness, financialHealth }: Props) {
  return (
    <View style={styles.wrap} testID="game-hud">
      <View style={styles.row}>
        <Stat icon="cake-variant" color={C.yellow} label="AGE" value={`${age}`} testID="hud-age" />
        <LearnTermsButton compact />
        <Stat icon="cash" color={C.green} label="CASH" value={fmt(cash)} testID="hud-cash" />
        <Stat
          icon="piggy-bank"
          color={C.blue}
          label="SAVE"
          value={fmt(savings)}
          testID="hud-savings"
          artifact={ARTIFACTS.piggyBank}
        />
      </View>
      <View style={[styles.row, { marginTop: 6 }]}>
        <Stat
          icon="credit-card-minus"
          color={C.red}
          label="DEBT"
          value={fmt(debt)}
          testID="hud-debt"
        />
        <HappinessBar value={happiness} />
      </View>
    </View>
  );
}

function Stat({
  icon,
  color,
  label,
  value,
  testID,
  artifact,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  label: string;
  value: string;
  testID?: string;
  artifact?: (typeof ARTIFACTS)[keyof typeof ARTIFACTS];
}) {
  return (
    <View style={styles.stat} testID={testID}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        {artifact ? (
          <ArtifactImage source={artifact} size={16} />
        ) : (
          <MaterialCommunityIcons name={icon} size={16} color={C.black} />
        )}
      </View>
      <View style={styles.statTextWrap}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function HappinessBar({ value }: { value: number }) {
  const cells = Array.from({ length: 10 });
  const filled = Math.round(value / 10);
  return (
    <View style={styles.stat} testID="hud-happiness">
      <View style={[styles.statIcon, { backgroundColor: C.orange }]}>
        <MaterialCommunityIcons name="emoticon-happy-outline" size={16} color={C.black} />
      </View>
      <View style={styles.statTextWrap}>
        <Text style={styles.statLabel}>MOOD</Text>
        <View style={styles.bar}>
          {cells.map((_, i) => (
            <View
              key={i}
              style={[
                styles.barCell,
                { backgroundColor: i < filled ? C.orange : '#000' },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function HealthBar({ value }: { value: number }) {
  const cells = Array.from({ length: 10 });
  const filled = Math.round(value / 10);
  const color = value >= 70 ? C.green : value >= 40 ? C.yellow : C.red;
  return (
    <View style={styles.stat} testID="hud-financial-health">
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name="heart-pulse" size={16} color={C.black} />
      </View>
      <View style={styles.statTextWrap}>
        <Text style={styles.statLabel}>HEALTH</Text>
        <View style={styles.bar}>
          {cells.map((_, i) => (
            <View
              key={i}
              style={[
                styles.barCell,
                { backgroundColor: i < filled ? color : '#000' },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#000',
    borderBottomWidth: 4,
    borderBottomColor: C.yellow,
    padding: 8,
    paddingTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#222',
    padding: 4,
    gap: 6,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: {
    flex: 1,
  },
  statLabel: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 8,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 11,
    marginTop: 1,
  },
  bar: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 3,
  },
  barCell: {
    width: 5,
    height: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
});
