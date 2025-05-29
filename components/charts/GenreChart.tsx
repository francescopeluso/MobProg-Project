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
        <Text style={styles.chartTitle}>Generi più letti</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>Nessun dato disponibile</Text>
          <Text style={styles.noDataSubtext}>Inizia a leggere per vedere i tuoi generi preferiti</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Generi più letti</Text>
      
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
    marginTop: 10,
    paddingHorizontal: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    color: '#555',
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendLabel: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    fontWeight: '500',
  },
  legendPerc: {
    fontSize: 14,
    color: '#f4511e',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default GenreChart;
