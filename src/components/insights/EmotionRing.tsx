import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { EmotionTag, JournalEntry } from '@/types';

type Props = {
  entries: JournalEntry[];
  size?: number;
};

const EMOTION_COLORS: Record<EmotionTag, string> = {
  grateful: colors.palette.peach,
  inspired: colors.palette.amber,
  hopeful: colors.palette.sky,
  loved: colors.palette.rose,
  focused: colors.palette.lavender,
  proud: colors.palette.amber,
  curious: colors.palette.sky,
  creative: colors.palette.lavenderSoft,
  restless: colors.palette.peach,
  lonely: colors.palette.clay,
  angry: colors.palette.rose,
  jealous: colors.palette.clay,
  guilty: colors.palette.clay,
  embarrassed: colors.palette.rose,
  numb: colors.palette.mist300,
  sensitive: colors.palette.lavenderSoft,
};

/**
 * Donut showing emotion distribution. Centered count + top-3 legend below.
 * No labels on the ring itself — keeps it clean.
 */
export const EmotionRing: React.FC<Props> = ({ entries, size = 180 }) => {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;

  const counts = useMemo(() => {
    const map = new Map<EmotionTag, number>();
    for (const e of entries) {
      for (const t of e.emotions) {
        map.set(t, (map.get(t) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const total = counts.reduce((acc, [, n]) => acc + n, 0);

  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={c}
            cy={c}
            r={r}
            stroke={colors.divider}
            strokeWidth={stroke}
            fill="none"
          />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text variant="caption" color={colors.textFaint}>
            NO TAGS YET
          </Text>
        </View>
      </View>
    );
  }

  let acc = 0;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${c}, ${c}`}>
            {/* base ring */}
            <Circle
              cx={c}
              cy={c}
              r={r}
              stroke={colors.divider}
              strokeWidth={stroke}
              fill="none"
            />
            {counts.map(([tag, n]) => {
              const length = (n / total) * circumference;
              const dasharray = `${length} ${circumference - length}`;
              const dashoffset = -acc;
              acc += length;
              return (
                <Circle
                  key={tag}
                  cx={c}
                  cy={c}
                  r={r}
                  stroke={EMOTION_COLORS[tag]}
                  strokeWidth={stroke}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="butt"
                  fill="none"
                />
              );
            })}
          </G>
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text variant="display" color={colors.text}>
            {total}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            FEELINGS NOTED
          </Text>
        </View>
      </View>

      <View style={{ marginTop: spacing.lg, gap: 6, width: size + 60 }}>
        {counts.slice(0, 3).map(([tag, n]) => (
          <View
            key={tag}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: EMOTION_COLORS[tag],
                  marginRight: 8,
                }}
              />
              <Text variant="bodyMedium" color={colors.text}>
                {tag}
              </Text>
            </View>
            <Text variant="caption" color={colors.textMuted}>
              {Math.round((n / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
