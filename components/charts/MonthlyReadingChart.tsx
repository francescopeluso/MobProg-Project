import { Colors, Spacing, Typography } from '@/constants/styles';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface MonthlyReadingChartProps {
  data: { value: number; label: string; frontColor?: string }[];
}

const MonthlyReadingChart: React.FC<MonthlyReadingChartProps> = ({ data }) => {
  /* 1.  Se non ci sono dati, mostriamo un messaggio elegante e usciamo */
  if (!data?.length) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Libri letti per mese</Text>
        <Text style={styles.emptyMsg}>Nessuna lettura registrata negli ultimi mesi</Text>
      </View>
    );
  }

  /* 2.  NON filtriamo più i mesi con valore 0: il grafico resta uniforme.
        Se vuoi ancora nasconderli, cambia `sourceData` in `data.filter(...)`. */
  const sourceData = data;

  /* 3.  Layout dinamico ---------------------------------------------------- */
  const screenWidth            = Dimensions.get('window').width;
  const outerPadding           = 32;  // padding del container SectionCard
  const innerPadding           = 32;  // padding orizzontale locale
  const availableWidth         = screenWidth - outerPadding - innerPadding;

  const barWidth               = 35;
  const spacing                = 15;
  const yAxisWidth             = 45;
  const endPadding             = 10;

  const totalBars              = sourceData.length;
  const totalSpacing           = Math.max((totalBars - 1) * spacing, 0);
  const barsWidth              = totalBars * barWidth;
  const chartContentWidth      = barsWidth + totalSpacing + endPadding;
  const calcWidth              = chartContentWidth + yAxisWidth;

  const needsScroll            = calcWidth > availableWidth;
  const finalWidth             = needsScroll ? calcWidth : availableWidth;

  /* 4.  Scroll automatico verso la fine per mostrare sempre il mese più recente */
  const scrollViewRef = React.useRef<ScrollView>(null);
  const scrollToEnd   = () => {
    if (needsScroll && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  };

  /* 5.  Pre-processing dei dati per il BarChart --------------------------- */
  const processed = sourceData.map(item => ({
    ...item,
    frontColor       : item.frontColor ?? Colors.secondary,
    topLabelComponent: () => (
      <Text style={styles.topLabel}>{item.value}</Text>
    ),
  }));

  const maxValue = Math.max(...processed.map(p => p.value), 1);

  /* 6.  Render ------------------------------------------------------------- */
  const Chart = (
    <BarChart
      data                 = {processed}
      width                = {finalWidth}
      barWidth             = {barWidth}
      spacing              = {spacing}
      roundedTop
      hideRules
      xAxisThickness       = {1}
      yAxisThickness       = {0}
      yAxisTextStyle       = {styles.axisText}
      xAxisLabelTextStyle  = {styles.axisText}
      noOfSections         = {4}
      maxValue             = {maxValue}
      isAnimated
      animationDuration    = {800}
      disablePress         = {true}
    />
  );

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Libri letti per mese</Text>
      {needsScroll && (
        <Text style={styles.scrollHint}>
          ← Scorri per i mesi precedenti →
        </Text>
      )}

      {needsScroll ? (
        <ScrollView
          ref                   = {scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator = {false}
          onContentSizeChange   = {scrollToEnd}
          style                 = {styles.scrollContainer}
          contentContainerStyle = {[styles.scrollContent, { paddingRight: endPadding }]}
        >
          {Chart}
        </ScrollView>
      ) : (
        <View style={styles.chartWrapper}>{Chart}</View>
      )}
    </View>
  );
};

/* ─────────── Styles ─────────── */
const styles = StyleSheet.create({
  chartContainer: { alignItems: 'center', marginTop: Spacing.sm },
  chartWrapper  : { alignItems: 'center', width: '100%' },
  scrollContainer: { width: '100%' },
  scrollContent : { alignItems: 'center', paddingHorizontal: Spacing.xs },
  chartTitle    : {
    fontSize : Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.lg,
    color    : Colors.textSecondary,
    textAlign: 'center',
  },
  scrollHint: {
    fontSize : Typography.fontSize.sm,
    color    : Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  axisText: { color: Colors.textTertiary, fontSize: 11 },
  topLabel: {
    color    : Colors.textSecondary,
    fontSize : 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyMsg: {
    fontSize: Typography.fontSize.md,
    color   : Colors.textTertiary,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
});

export default MonthlyReadingChart;
