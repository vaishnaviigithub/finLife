import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, FONT } from '../ui/theme';

type Props = {
  from: number;
  to: number;
  years: number;
  width?: number;
  height?: number;
};

// Animated step "bar chart" — pixel friendly, no Skia dependency.
export default function CompoundGraph({ from, to, years, width = 320, height = 90 }: Props) {
  const points = useMemo(() => {
    const arr: number[] = [];
    const safeFrom = Math.max(1, from);
    const factor = Math.pow(Math.max(0.5, to / safeFrom), 1 / years);
    let v = safeFrom;
    arr.push(v);
    for (let i = 0; i < years; i++) {
      v = v * factor;
      arr.push(v);
    }
    return arr;
  }, [from, to, years]);

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);

  const [reveal, setReveal] = useState(0);
  useEffect(() => {
    let i = 0;
    const total = points.length;
    const step = setInterval(() => {
      i += 1;
      setReveal(i);
      if (i >= total) clearInterval(step);
    }, Math.max(40, Math.min(160, 1800 / Math.max(1, total))));
    return () => clearInterval(step);
  }, [points.length]);

  const barWidth = (width - 20) / points.length;

  return (
    <View style={[s.wrap, { width, height: height + 28 }]} testID="compound-graph">
      <View style={[s.chart, { width, height }]}>
        {/* Gridlines */}
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={[s.gridLine, { top: (i + 1) * (height / 5) }]} />
        ))}
        {points.map((p, i) => {
          const visible = i < reveal;
          const h = ((p - min) / (max - min || 1)) * (height - 8);
          const isLast = i === points.length - 1 && visible;
          const isUp = to >= from;
          const color = isLast ? C.yellow : isUp ? C.green : C.red;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 10 + i * barWidth,
                bottom: 0,
                width: Math.max(3, barWidth - 2),
                height: visible ? Math.max(3, h) : 0,
                backgroundColor: color,
                borderTopWidth: 2,
                borderTopColor: '#000',
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderLeftColor: '#000',
                borderRightColor: '#000',
              }}
            />
          );
        })}
      </View>
      <Text style={s.cap}>
        Rs {Math.round(from).toLocaleString('en-IN')} → Rs {Math.round(to).toLocaleString('en-IN')} over {years} yr
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginVertical: 4 },
  chart: {
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: C.yellow,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cap: {
    fontFamily: FONT.body,
    color: C.white,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
