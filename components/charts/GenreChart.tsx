import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

interface GenreChartProps {
  data: { value: number; color: string; text: string; label: string }[];
}

const GenreChart: React.FC<GenreChartProps> = ({ data }) => {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Generi più letti</Text>
      <View style={styles.pieChartRow}>
        <PieChart
          data={data}
          donut
          showGradient={false}
          sectionAutoFocus
          radius={80}
          innerRadius={50}
          innerCircleColor={'#fff'}
        />
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
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    color: '#555',
    textAlign: 'center',
  },
  pieChartRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  legendContainer: {
    marginLeft: 24,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 14,
    color: '#444',
    minWidth: 80,
  },
  legendPerc: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
});

export default GenreChart;
