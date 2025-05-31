/**
 * @file components/RatingDistributionChart.tsx
 * @description Componente per visualizzare la distribuzione delle valutazioni
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Typography } from '@/constants/styles';
import RatingStars from './RatingStars';

interface RatingDistributionProps {
  ratingsDistribution: { [key: number]: number };
  totalRatings: number;
}

const RatingDistributionChart: React.FC<RatingDistributionProps> = ({ 
  ratingsDistribution, 
  totalRatings 
}) => {
  if (totalRatings === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Nessuna valutazione disponibile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distribuzione valutazioni</Text>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = ratingsDistribution[rating] || 0;
        const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
        
        return (
          <View key={rating} style={styles.row}>
            <View style={styles.ratingContainer}>
              <RatingStars rating={rating} size={16} />
            </View>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${percentage}%`,
                    backgroundColor: rating >= 4 ? Colors.accent : 
                                   rating >= 3 ? Colors.warning : Colors.error
                  }
                ]} 
              />
            </View>
            <Text style={styles.count}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 16,
    color: Colors.textPrimary,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    width: 100,
    alignItems: 'flex-start',
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.borderLight,
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 10,
    minWidth: 2,
  },
  count: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    width: 30,
    textAlign: 'right',
  },
});

export default RatingDistributionChart;
