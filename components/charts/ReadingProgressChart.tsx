import { Colors, Spacing, Typography } from '@/constants/styles';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface ReadingProgressChartProps {
  data: { value: number; dataPointText?: string; label?: string }[];
  title?: string;
}

const ReadingProgressChart: React.FC<ReadingProgressChartProps> = ({ 
  data,
  title = "Progressione settimanale" 
}) => {
  // Calcola dimensioni ottimali
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = 32; // Padding del SectionCard
  const chartPadding = 32; // Padding del chart container
  const availableContainerWidth = screenWidth - containerPadding - chartPadding;
  
  // Calcola larghezza minima necessaria per il grafico
  const minPointSpacing = 50; // Spaziatura minima tra i punti
  const margins = 40; // Margini iniziali e finali
  const minChartWidth = (data.length * minPointSpacing) + margins;
  
  // Determina se serve scroll orizzontale
  const needsScroll = minChartWidth > availableContainerWidth;
  const chartWidth = needsScroll ? minChartWidth : availableContainerWidth;

  const ChartComponent = (
    <LineChart
      data={data}
      width={chartWidth}
      color={Colors.secondary}
      thickness={3}
      maxValue={Math.max(...data.map(item => item.value), 1)}
      noOfSections={4}
      yAxisTextStyle={{ color: Colors.textTertiary, fontSize: 11 }}
      xAxisLabelTextStyle={{ color: Colors.textTertiary, fontSize: 10 }}
      hideDataPoints={false}
      dataPointsColor={Colors.secondary}
      startFillColor={Colors.secondary}
      startOpacity={0.2}
      endOpacity={0.0}
      initialSpacing={20}
      endSpacing={20}
      curved
      isAnimated
      animationDuration={800}
    />
  );

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      {needsScroll && (
        <Text style={styles.scrollHint}>← Scorri per vedere tutte le settimane →</Text>
      )}
      {needsScroll ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {ChartComponent}
        </ScrollView>
      ) : (
        <View style={styles.chartWrapper}>
          {ChartComponent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  chartWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  scrollContainer: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  chartTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scrollHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
});

export default ReadingProgressChart;
