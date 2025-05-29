import { Colors } from '@/constants/styles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RatingStarsProps {
  rating: number;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
}

const RatingStars: React.FC<RatingStarsProps> = ({ 
  rating, 
  size = 18, 
  activeColor = Colors.secondary, 
  inactiveColor = Colors.borderLight
}) => {
  return (
    <View style={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text 
          key={star} 
          style={{ 
            fontSize: size, 
            color: star <= rating ? activeColor : inactiveColor 
          }}
        >
          ★
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
});

export default RatingStars;
