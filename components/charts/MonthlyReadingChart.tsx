import { Colors, Spacing, Typography } from '@/constants/styles';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface MonthlyReadingChartProps {
  data: { value: number; label: string; frontColor?: string }[];
}

const MonthlyReadingChart: React.FC<MonthlyReadingChartProps> = ({ data }) => {
  // Calcola dimensioni ottimali per garantire leggibilità
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = 32; // Padding del SectionCard  
  const chartPadding = 32; // Padding del chart container
  const availableContainerWidth = screenWidth - containerPadding - chartPadding;
  
  // Dimensioni fisse per garantire leggibilità
  const barWidth = 35; // Larghezza fissa per buona leggibilità
  const spacing = 15; // Spaziatura fissa tra le barre
  const yAxisWidth = 45; // Spazio per le etichette Y
  
  const totalBars = data.length;
  const totalSpacing = (totalBars - 1) * spacing;
  const barsWidth = totalBars * barWidth;
  const chartContentWidth = barsWidth + totalSpacing;
  const totalChartWidth = chartContentWidth + yAxisWidth;
  
  // Se il grafico è più largo del container, permettiamo lo scroll
  const needsScroll = totalChartWidth > availableContainerWidth;
  const finalWidth = needsScroll ? totalChartWidth : availableContainerWidth;

  const ChartComponent = (
    <BarChart
      data={data.map(item => ({ 
        ...item,
        frontColor: item.frontColor || Colors.secondary 
      }))}
      width={finalWidth}
      barWidth={barWidth}
      spacing={spacing}
      roundedTop
      hideRules
      xAxisThickness={1}
      yAxisThickness={0}
      yAxisTextStyle={{ color: Colors.textTertiary, fontSize: 11 }}
      xAxisLabelTextStyle={{ color: Colors.textTertiary, fontSize: 10 }}
      noOfSections={4}
      maxValue={Math.max(...data.map(item => item.value), 1)}
      isAnimated
      animationDuration={800}
    />
  );

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Libri letti per mese</Text>
      {needsScroll && (
        <Text style={styles.scrollHint}>← Scorri per vedere tutti i mesi →</Text>
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

export default MonthlyReadingChart;
