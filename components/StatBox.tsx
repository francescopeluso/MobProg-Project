import { BorderRadius, Colors, Spacing, Typography } from '@/constants/styles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatBoxProps {
  value: string | number;
  label: string;
}

const StatBox: React.FC<StatBoxProps> = ({ value, label }) => {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statBox: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.secondary,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

export default StatBox;
