import { Colors, CommonStyles, Spacing, Typography } from '@/constants/styles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

interface GenreChartProps {
  data: { value: number; color: string; text: string; label: string }[];
}

const GenreChart: React.FC<GenreChartProps> = ({ data }) => {
  // Se non ci sono dati, mostra un messaggio
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Distribuzione generi libri</Text>
        <View style={CommonStyles.emptyState}>
          <Text style={CommonStyles.emptyText}>Nessun dato disponibile</Text>
          <Text style={CommonStyles.emptyText}>Inizia a leggere per vedere i tuoi generi preferiti</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Distribuzione generi libri</Text>
      
      {/* Grafico a torta centrato */}
      <View style={styles.pieChartContainer}>
        <PieChart
          data={data}
          donut
          showGradient={false}
          sectionAutoFocus
          radius={90}
          innerRadius={60}
          innerCircleColor={'#fff'}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={styles.centerLabelText}>Generi</Text>
            </View>
          )}
        />
      </View>
      
      {/* Legenda sotto il grafico */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
            <Text style={styles.legendPerc}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  chartTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xl,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  legendContainer: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  legendLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    flex: 1,
    fontWeight: Typography.fontWeight.medium,
  },
  legendPerc: {
    fontSize: Typography.fontSize.md,
    color: Colors.secondary,
    fontWeight: Typography.fontWeight.semibold,
    minWidth: 40,
    textAlign: 'right',
  },
});

export default GenreChart;
