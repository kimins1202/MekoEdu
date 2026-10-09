import React from 'react';
import { View, Text, StyleSheet, ViewStyle, ColorValue } from 'react-native';
import COLORS from '../../constants/colors';

interface AppProgressBarProps {
  progress: number;
  showPercent?: boolean;
  style?: ViewStyle;
  height?: number;
  color?: ColorValue;
  trackColor?: ColorValue;
}

export default function AppProgressBar({
  progress,
  showPercent = false,
  style,
  height = 6,
  color = COLORS.primary,
  trackColor = COLORS.border,
}: AppProgressBarProps) {
  const percent = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { height, backgroundColor: trackColor }]}>
        <View
          style={[
            styles.fill,
            { width: `${percent}%`, backgroundColor: color },
          ]}
        />
      </View>
      {showPercent && (
        <Text style={[styles.percentText, { color }]}>{Math.round(percent)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  track: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
});
