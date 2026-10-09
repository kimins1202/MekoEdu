import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import COLORS from '../../constants/colors';

interface AppCardProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export default function AppCard({ style, children, ...rest }: AppCardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
