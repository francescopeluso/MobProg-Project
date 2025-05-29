import { Colors, Spacing, Typography } from '@/constants/styles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface ReadingProgressChartProps {
  data: { value: number; dataPointText?: string; label?: string }[];
  title?: string;
}

const ReadingProgressChart: React.FC<ReadingProgressChartProps> = ({ 
  data,
  title = "Progressione settimanale" 
}) => {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <LineChart
        data={data}
        color={Colors.secondary}
        thickness={3}
        maxValue={12}
        noOfSections={4}
        yAxisTextStyle={{ color: Colors.textTertiary }}
        xAxisLabelTextStyle={{ color: Colors.textTertiary, fontSize: 11 }}
        hideDataPoints={false}
        dataPointsColor={Colors.secondary}
        startFillColor={Colors.secondary}
        startOpacity={0.2}
        endOpacity={0.0}
        initialSpacing={20}
        endSpacing={20}
        curved
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
  },
  chartTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default ReadingProgressChart;
