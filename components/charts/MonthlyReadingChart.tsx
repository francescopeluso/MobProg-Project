import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface MonthlyReadingChartProps {
  data: { value: number; label: string; frontColor?: string }[];
}

const MonthlyReadingChart: React.FC<MonthlyReadingChartProps> = ({ data }) => {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Libri letti per mese</Text>
      <BarChart
        data={data.map(item => ({ 
          ...item,
          frontColor: item.frontColor || '#f4511e' 
        }))}
        barWidth={22}
        spacing={18}
        roundedTop
        hideRules
        xAxisThickness={1}
        yAxisThickness={0}
        yAxisTextStyle={{ color: '#888' }}
        xAxisLabelTextStyle={{ color: '#888', fontSize: 11 }}
        noOfSections={4}
        maxValue={12}
      />
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
});

export default MonthlyReadingChart;
