import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Path,
  Circle,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '@/theme';
import { Mood, MOOD_VALUE } from '@/types';
import { JournalEntry } from '@/types';
import { dayOfWeekShort, startOfWeek } from '@/utils/date';

type Props = {
  entries: JournalEntry[];
  width: number;
  height?: number;
  /** Days back from today; 7 = last week, 30 = month. */
  days?: number;
};

/**
 * Mood ribbon chart — Apple Health meets Spotify Wrapped.
 *
 * - One soft gradient line + filled area below
 * - Subtle baseline grid (3 horizontal hairlines)
 * - Day labels along the X axis
 * - Each entry is a small dot tinted by its mood color
 *
 * Smoothing: cardinal-ish curve via cubic Beziers between day averages.
 */
export const MoodChart: React.FC<Props> = ({
  entries,
  width,
  height = 200,
  days = 7,
}) => {
  const padX = 12;
  const padTop = 16;
  const padBottom = 28;

  const data = useMemo(() => {
    const start = startOfWeek(new Date());
    if (days !== 7) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (days - 1));
      start.setTime(d.getTime());
    }

    const buckets: { date: Date; values: number[]; moods: Mood[] }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      buckets.push({ date: d, values: [], moods: [] });
    }

    for (const e of entries) {
      if (!e.mood) continue;
      const d = new Date(e.created_at);
      const bucket = buckets.find(
        (b) =>
          b.date.getFullYear() === d.getFullYear() &&
          b.date.getMonth() === d.getMonth() &&
          b.date.getDate() === d.getDate(),
      );
      if (bucket) {
        bucket.values.push(MOOD_VALUE[e.mood]);
        bucket.moods.push(e.mood);
      }
    }

    return buckets.map((b) => ({
      date: b.date,
      avg: b.values.length ? b.values.reduce((a, c) => a + c, 0) / b.values.length : null,
      moods: b.moods,
    }));
  }, [entries, days]);

  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const yFor = (v: number) => padTop + (1 - (v - 1) / 4) * innerH;

  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: d.avg == null ? null : yFor(d.avg),
    moods: d.moods,
    date: d.date,
  }));

  // Build smooth path (quadratic-bezier blend) over points that have a value.
  const present = points.filter((p) => p.y != null) as Array<typeof points[0] & { y: number }>;

  let linePath = '';
  let areaPath = '';
  if (present.length > 0) {
    linePath = `M ${present[0].x},${present[0].y}`;
    for (let i = 1; i < present.length; i++) {
      const prev = present[i - 1];
      const curr = present[i];
      const cx = (prev.x + curr.x) / 2;
      linePath += ` Q ${cx},${prev.y} ${cx},${(prev.y + curr.y) / 2}`;
      linePath += ` T ${curr.x},${curr.y}`;
    }
    const baseY = padTop + innerH;
    areaPath = `${linePath} L ${present[present.length - 1].x},${baseY} L ${present[0].x},${baseY} Z`;
  }

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="moodLine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.palette.lavender} />
            <Stop offset="1" stopColor={colors.palette.peach} />
          </SvgGradient>
          <SvgGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.palette.lavender} stopOpacity={0.35} />
            <Stop offset="1" stopColor={colors.palette.lavender} stopOpacity={0} />
          </SvgGradient>
        </Defs>

        {/* baseline grid */}
        {[0.25, 0.5, 0.75].map((p) => (
          <Line
            key={p}
            x1={padX}
            x2={width - padX}
            y1={padTop + innerH * p}
            y2={padTop + innerH * p}
            stroke={colors.divider}
            strokeWidth={1}
          />
        ))}

        {!!areaPath && <Path d={areaPath} fill="url(#moodFill)" />}
        {!!linePath && (
          <Path
            d={linePath}
            stroke="url(#moodLine)"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Mood dots */}
        {points.map((p, i) =>
          p.y == null ? null : (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={colors.mood[p.moods[0]]}
              stroke={colors.bg}
              strokeWidth={2}
            />
          ),
        )}

        {/* Day labels */}
        {points.map((p, i) => (
          <SvgText
            key={`l${i}`}
            x={p.x}
            y={height - 8}
            fontSize="10"
            fill={colors.textFaint}
            textAnchor="middle"
          >
            {dayOfWeekShort(p.date)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};
