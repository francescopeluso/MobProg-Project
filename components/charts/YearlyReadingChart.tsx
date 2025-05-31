/**
 * @file components/charts/YearlyReadingChart.tsx
 * @description Componente per il grafico delle letture annuali
 */

import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { Colors, Spacing, Typography } from '@/constants/styles';

interface YearlyData {
  value: number;
  label: string;
  frontColor: string;
}

interface YearlyReadingChartProps {
  data: YearlyData[];
}

const YearlyReadingChart: React.FC<YearlyReadingChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessun dato disponibile per gli anni</Text>
      </View>
    );
  }

  // Usa colori diversi dal grafico mensile
  const dataWithColors = data.map(item => ({
    ...item,
    frontColor: '#9F7AEA' // Viola/porpora per distinguere dal blu del grafico mensile
  }));

  const maxValue = Math.max(...data.map(d => d.value), 4); // Minimo 4 per le sezioni

  // Calcola la larghezza del contenitore e delle barre
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = 40; // Padding laterale del contenitore
  const chartWidth = screenWidth - containerPadding;
  
  // Calcola larghezza barra e spaziatura per occupare tutta la larghezza
  const totalBars = data.length;
  const totalSpacing = totalBars > 1 ? (totalBars - 1) : 0;
  const availableWidth = chartWidth - 60; // Spazio per etichette asse Y
  const barWidth = Math.floor((availableWidth - (totalSpacing * 10)) / totalBars);
  const spacing = totalBars > 1 ? Math.floor((availableWidth - (totalBars * barWidth)) / totalSpacing) : 0;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Libri letti per anno</Text>
      <BarChart
        data={dataWithColors}
        width={chartWidth}
        barWidth={Math.max(barWidth, 15)} // Minimo 15px per leggibilità
        spacing={Math.max(spacing, 8)} // Minimo 8px di spaziatura
        roundedTop
        hideRules
        xAxisThickness={1}
        yAxisThickness={0}
        yAxisTextStyle={{ color: Colors.textTertiary }}
        xAxisLabelTextStyle={{ color: Colors.textTertiary, fontSize: 11 }}
        noOfSections={4}
        maxValue={maxValue}
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default YearlyReadingChart;
