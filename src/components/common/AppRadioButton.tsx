import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';
import COLORS from '../../constants/colors';

interface AppRadioButtonProps {
  selected: boolean;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export default function AppRadioButton({
  selected,
  label,
  onPress,
  disabled = false,
  style,
}: AppRadioButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.containerSelected,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.radioOuter,
          selected && styles.radioOuterSelected,
        ]}
      >
        {selected && <View style={styles.radioInner} />}
      </View>

      <Text
        style={[
          styles.labelText,
          selected && styles.labelTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
  },
  containerSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF8F2',
  },
  radioOuter: {
    width: 22,
    height: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#AAB6B0',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  labelText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  labelTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
});
