import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT } from '@/src/ui/theme';
import { FL_GREEN } from '@/src/finlabs/storage';

type Props = {
  customerLine: string;
  itemLabel: string;
  itemCost: number;
  paid: number;
};

export default function StallScene({ customerLine, itemLabel, itemCost, paid }: Props) {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#FF8C42', '#FFB36B', '#FFE8C8']} style={styles.sky} />
      <View style={styles.stallBanner}>
        <Text style={styles.stallName}>🥟 AUNTY&apos;S SAMOSA STALL</Text>
        <Text style={styles.stallSub}>SUMMER VACATION · Rs 50 / HOUR</Text>
      </View>
      <View style={styles.counter}>
        <View style={styles.stallFront}>
          <View style={styles.menuChip}>
            <Text style={styles.menuEmoji}>🥟</Text>
            <Text style={styles.menuText}>{itemLabel}</Text>
            <Text style={styles.menuPrice}>Rs {itemCost}</Text>
          </View>
          <View style={styles.steam}>
            <Text style={styles.steamText}>~ ~ ~</Text>
          </View>
        </View>
        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerEmoji}>👤</Text>
          </View>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{customerLine}</Text>
          </View>
        </View>
        <View style={styles.priceRow}>
          <View style={styles.pricePill}>
            <Text style={styles.priceLabel}>ORDER</Text>
            <Text style={styles.priceVal}>Rs {itemCost}</Text>
          </View>
          <Text style={styles.priceArrow}>←</Text>
          <View style={styles.pricePillPaid}>
            <Text style={styles.priceLabel}>PAID</Text>
            <Text style={styles.priceValPaid}>Rs {paid}</Text>
          </View>
        </View>
      </View>
      <View style={styles.ground} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 200,
    borderBottomWidth: 3,
    borderBottomColor: '#5D4037',
    overflow: 'hidden',
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  stallBanner: {
    backgroundColor: '#5D4037',
    borderBottomWidth: 3,
    borderBottomColor: '#3E2723',
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  stallName: {
    fontFamily: FONT.display,
    color: '#FFE082',
    fontSize: 10,
    letterSpacing: 1,
  },
  stallSub: {
    fontFamily: FONT.body,
    color: '#BCAAA4',
    fontSize: 13,
    marginTop: 2,
  },
  counter: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  stallFront: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  menuChip: {
    backgroundColor: '#FFF8E1',
    borderWidth: 3,
    borderColor: '#5D4037',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 90,
  },
  menuEmoji: { fontSize: 22 },
  menuText: {
    fontFamily: FONT.display,
    color: '#5D4037',
    fontSize: 7,
    marginTop: 2,
  },
  menuPrice: {
    fontFamily: FONT.display,
    color: '#E65100',
    fontSize: 11,
  },
  steam: {
    opacity: 0.6,
  },
  steamText: {
    fontFamily: FONT.body,
    color: '#888',
    fontSize: 18,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    backgroundColor: '#37474F',
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerEmoji: { fontSize: 18 },
  speechBubble: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
    padding: 8,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  speechText: {
    fontFamily: FONT.body,
    color: '#000',
    fontSize: 16,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pricePill: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#444',
    paddingHorizontal: 14,
    paddingVertical: 4,
    alignItems: 'center',
  },
  pricePillPaid: {
    backgroundColor: '#1B4332',
    borderWidth: 2,
    borderColor: FL_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 4,
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 7,
    letterSpacing: 1,
  },
  priceVal: {
    fontFamily: FONT.display,
    color: C.white,
    fontSize: 14,
  },
  priceValPaid: {
    fontFamily: FONT.display,
    color: FL_GREEN,
    fontSize: 14,
  },
  priceArrow: {
    fontFamily: FONT.display,
    color: '#888',
    fontSize: 12,
  },
  ground: {
    height: 8,
    backgroundColor: '#8D6E63',
    borderTopWidth: 2,
    borderTopColor: '#5D4037',
  },
});
