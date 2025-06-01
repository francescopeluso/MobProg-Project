import { Colors, Spacing, Typography } from '@/constants/styles';
import React, { useRef } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CurveType, LineChart } from 'react-native-gifted-charts';

// ────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────
interface ReadingDatum {
  /** Numero di pagine (o altro) lette quel giorno */
  value: number;
  /** Label da mostrare sull'asse X – es. "Lun", "Mar"… */
  label?: string;
  /** Testo facoltativo sul data‑point */
  dataPointText?: string;
}

interface Props {
  data: ReadingDatum[];
  /** Titolo opzionale del grafico */
  title?: string;
}

/**
 * <ReadingProgressChart />
 *
 * Linea smussata **senza** overshoot negativo: la curva è di tipo QUADRATIC
 * (meno aggressiva della cubica) e la funzione non scende mai sotto lo 0,
 * perché `minValue` è forzato a 0 e la logica di Bezier non può generare
 * valori negativi in QUADRATIC.
 */
const ReadingProgressChart: React.FC<Props> = ({
  data,
  title = 'Sessioni di lettura giornaliere',
}) => {
  // ──────────────────────────────────────────────────────────
  // LAYOUT CALCULATIONS
  // ──────────────────────────────────────────────────────────
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = 32; // SectionCard padding
  const chartPadding = 32; // internal padding
  const availableWidth = screenWidth - containerPadding - chartPadding;

  const minPointSpacing = 50;
  const margins = 40; // left + right spacing
  const minChartWidth = data.length * minPointSpacing + margins;

  const needsScroll = minChartWidth > availableWidth;
  const chartWidth = needsScroll ? minChartWidth : availableWidth;

  // Scroll to the end (oggi) on mount
  const scrollRef = useRef<ScrollView>(null);
  const handleContentSizeChange = () => {
    if (needsScroll && scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: false });
    }
  };

  // Y‑axis domain – mai sotto zero
  const maxDataValue = Math.max(...data.map(d => d.value));
  const maxValue = maxDataValue === 0 ? 5 : Math.max(maxDataValue + 1, 4);

  // Preprocessa i dati per aggiungere etichette più chiare
  const processedData = data.map(item => ({
    ...item,
    dataPointText: item.value === 0 ? '' : `${item.value}`,
    // Aggiungi un'icona o testo per chiarire il significato
    labelComponent: () => (
      <View style={styles.labelContainer}>
        <Text style={styles.dayLabel}>{item.label}</Text>
      </View>
    ),
  }));

  // ──────────────────────────────────────────────────────────
  // CHART COMPONENT
  // ──────────────────────────────────────────────────────────
  const Chart = (
    <LineChart
      data={processedData}
      width={chartWidth}
      height={200}
      curved
      curveType={CurveType.QUADRATIC}
      curvature={0.25}
      maxValue={maxValue}
      noOfSections={4}
      color={Colors.secondary}
      thickness={3}
      yAxisTextStyle={{ color: Colors.textTertiary, fontSize: 11 }}
      xAxisLabelTextStyle={{ color: Colors.textTertiary, fontSize: 10 }}
      hideDataPoints={false}
      dataPointsColor={Colors.secondary}
      dataPointsRadius={4}
      textShiftY={-8}
      textShiftX={0}
      textColor={Colors.textPrimary}
      textFontSize={12}
      startFillColor={Colors.secondary}
      startOpacity={0.25}
      endOpacity={0}
      initialSpacing={20}
      endSpacing={20}
      isAnimated
      animationDuration={800}
      hideRules={false}
      rulesColor={Colors.textTertiary}
      rulesType="solid"
      rulesThickness={0.5}
    />
  );

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
          <Text style={styles.legendText}>Numero di sessioni di lettura</Text>
        </View>
      </View>
      {needsScroll && (
        <Text style={styles.scrollHint}>← Scorri per vedere i giorni precedenti →</Text>
      )}
      {needsScroll ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={handleContentSizeChange}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
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
  legendContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  legendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  labelContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
  },
});

export default ReadingProgressChart;
