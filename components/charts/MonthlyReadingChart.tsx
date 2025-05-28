import { Colors, Spacing, Typography } from '@/constants/styles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface MonthlyReadingChartProps {
  data: { value: number; label: string; frontColor?: string }[];
}

const MonthlyReadingChart: React.FC<MonthlyReadingChartProps> = ({ data }) => {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Libri letti per mese</Text>
      <BarChart
        data={data.map(item => ({ 
          ...item,
          frontColor: item.frontColor || Colors.secondary 
        }))}
        barWidth={22}
        spacing={18}
        roundedTop
        hideRules
        xAxisThickness={1}
        yAxisThickness={0}
        yAxisTextStyle={{ color: Colors.textTertiary }}
        xAxisLabelTextStyle={{ color: Colors.textTertiary, fontSize: 11 }}
        noOfSections={4}
        maxValue={12}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  chartTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default MonthlyReadingChart;
