import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { formatMinutes, fromDateKey, minutesByMonth, MONTHS } from '@/lib/study-sessions';

const CHART_HEIGHT = 150;
const PAD = { top: 10, right: 10, bottom: 22, left: 30 };
const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200];

// Round hour ticks from 0 up past the busiest month, at most 4 steps
function hourTicks(maxHours: number) {
  const step = STEPS.find((s) => s * 4 >= maxHours) ?? Math.ceil(maxHours / 4);
  const top = Math.max(step, Math.ceil(maxHours / step) * step);
  const ticks = [];
  for (let t = 0; t <= top; t += step) ticks.push(t);
  return ticks;
}

type Props = {
  today: string | null;
  totals: Map<string, number>;
};

// Hours studied each month from January through the current month
export function MonthlyHoursChart({ today, totals }: Props) {
  const [width, setWidth] = useState(0);
  // null follows the current month
  const [selected, setSelected] = useState<number | null>(null);

  const now = today ? fromDateKey(today) : null;
  const monthCount = now ? now.getMonth() + 1 : 0;
  const minutes = now ? minutesByMonth(totals, now.getFullYear()).slice(0, monthCount) : [];
  const hours = minutes.map((m) => m / 60);
  const active = selected ?? monthCount - 1;

  const ticks = hourTicks(Math.max(...hours, 0));
  const top = ticks[ticks.length - 1];
  const plotW = width - PAD.left - PAD.right;
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;
  // Half a slot of air at each end so January and the latest month aren't on the edges
  const slot = monthCount > 0 ? plotW / monthCount : 0;
  const x = (i: number) => PAD.left + slot * (i + 0.5);
  const y = (h: number) => PAD.top + plotH * (1 - h / top);

  const linePath = hours.map((h, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(h)}`).join(' ');
  const baseline = y(0);
  const areaPath =
    hours.length > 1
      ? `${linePath} L${x(hours.length - 1)},${baseline} L${x(0)},${baseline} Z`
      : '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Hours by month</Text>
        {now && (
          <Text style={styles.readout}>
            {MONTHS[active]} · <Text style={styles.readoutValue}>{formatMinutes(minutes[active])}</Text>
          </Text>
        )}
      </View>

      <View style={styles.chart} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {/* Needs today's date and a measured width, neither of which the static web render has */}
        {now && width > 0 && (
          <>
            <Svg width={width} height={CHART_HEIGHT}>
              {ticks.map((t) => (
                <Line
                  key={`grid-${t}`}
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={Colors.track}
                  strokeWidth={1}
                />
              ))}
              {ticks.map((t) => (
                <SvgText
                  key={`tick-${t}`}
                  x={PAD.left - 8}
                  y={y(t) + 4}
                  fontSize={11}
                  fill={Colors.textMuted}
                  textAnchor="end">
                  {`${t}h`}
                </SvgText>
              ))}
              {hours.map((_, i) => (
                <SvgText
                  key={`month-${i}`}
                  x={x(i)}
                  y={CHART_HEIGHT - 6}
                  fontSize={11}
                  fontWeight={i === active ? '800' : '400'}
                  fill={i === active ? Colors.text : Colors.textMuted}
                  textAnchor="middle">
                  {MONTHS[i][0]}
                </SvgText>
              ))}

              {areaPath !== '' && <Path d={areaPath} fill={Colors.accentDeep} opacity={0.1} />}
              {hours.length > 1 && (
                <Path
                  d={linePath}
                  fill="none"
                  stroke={Colors.accentDeep}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {hours.map((h, i) => (
                <Circle
                  key={`dot-${i}`}
                  cx={x(i)}
                  cy={y(h)}
                  r={i === active ? 6 : 4}
                  fill={Colors.accentDeep}
                  stroke={Colors.card}
                  strokeWidth={2}
                />
              ))}
            </Svg>

            {/* Full-height tap columns, much bigger than the dots */}
            {hours.map((h, i) => (
              <Pressable
                key={`hit-${i}`}
                onPress={() => setSelected(i)}
                style={[styles.hit, { left: PAD.left + slot * i, width: slot }]}
                accessibilityRole="button"
                accessibilityLabel={`${MONTHS[i]}: ${formatMinutes(minutes[i])}`}
              />
            ))}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  readout: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  readoutValue: {
    fontWeight: '800',
    color: Colors.text,
  },
  chart: {
    height: CHART_HEIGHT,
  },
  hit: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
