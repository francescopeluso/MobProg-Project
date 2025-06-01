import { Colors, Spacing, Typography } from '@/constants/styles';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface MonthlyReadingChartProps {
  data: { value: number; label: string; frontColor?: string }[];
}

const MonthlyReadingChart: React.FC<MonthlyReadingChartProps> = ({ data }) => {
  // Filtra i dati per rimuovere i mesi con 0 libri letti
  const filteredData = data.filter(item => item.value > 0);
  
  // Layout calculations
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = 32; // SectionCard padding in parent
  const chartPadding = 32; // Local horizontal padding
  const availableContainerWidth = screenWidth - containerPadding - chartPadding;

  const barWidth = 35;
  const spacing = 15;
  const yAxisWidth = 45;
  const endPadding = 10;

  const totalBars = filteredData.length;
  const totalSpacing = (totalBars - 1) * spacing;
  const barsWidth = totalBars * barWidth;
  const chartContentWidth = barsWidth + totalSpacing + endPadding;
  const totalChartWidth = chartContentWidth + yAxisWidth;

  const needsScroll = totalChartWidth > availableContainerWidth;
  const finalWidth = needsScroll ? totalChartWidth : availableContainerWidth;

  // Scroll management – keep the **current month** (last bar) visible
  const scrollViewRef = React.useRef<ScrollView>(null);

  // When the ScrollView finishes measuring its content we scroll to the end
  const handleContentSizeChange = () => {
    if (needsScroll && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  };

  // Prepare data: usa i dati filtrati
  const processed = filteredData.map((item) => ({
    ...item,
    frontColor: item.frontColor || Colors.secondary,
    topLabelComponent: () => <Text style={styles.topLabel}>{item.value}</Text>,
  }));

  const Chart = (
    <BarChart
      data={processed}
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
      maxValue={Math.max(...filteredData.map((d) => d.value), 1)}
      isAnimated
      animationDuration={800}
      disablePress={true}
    />
  );


  // Render – Scroll only when needed, always start from the rightmost month
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Libri letti per mese</Text>
      {needsScroll && (
        <Text style={styles.scrollHint}>← Scorri per vedere i mesi precedenti →</Text>
      )}

      {needsScroll ? (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={handleContentSizeChange}
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, { paddingRight: endPadding }]}
        >
          {Chart}
        </ScrollView>
      ) : (
        <View style={styles.chartWrapper}>{Chart}</View>
      )}
    </View>
  );
};

// ────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────
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
  tooltipBox: {
    backgroundColor: Colors.background,
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  tooltipText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  topLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MonthlyReadingChart;