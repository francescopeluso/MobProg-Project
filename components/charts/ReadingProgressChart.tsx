import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

interface ReadingProgressChartProps {
  data: { value: number; dataPointText?: string; label?: string }[];
  title?: string;
}

const ReadingProgressChart: React.FC<ReadingProgressChartProps> = ({ 
  data,
  title = "Progressione settimanale" 
}) => {
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <LineChart
        data={data}
        color="#f4511e"
        thickness={3}
        maxValue={12}
        noOfSections={4}
        yAxisTextStyle={{ color: '#888' }}
        xAxisLabelTextStyle={{ color: '#888', fontSize: 11 }}
        hideDataPoints={false}
        dataPointsColor="#f4511e"
        startFillColor="#f4511e"
        startOpacity={0.2}
        endOpacity={0.0}
        initialSpacing={20}
        endSpacing={20}
        curved
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    color: '#555',
    textAlign: 'center',
  },
});

export default ReadingProgressChart;
