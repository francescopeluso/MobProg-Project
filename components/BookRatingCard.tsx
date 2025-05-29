import { BorderRadius, Colors, Spacing, Typography } from '@/constants/styles';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import RatingStars from './RatingStars';

interface BookRatingCardProps {
  title: string;
  author: string;
  rating: number;
  comment?: string;
}

const BookRatingCard: React.FC<BookRatingCardProps> = ({ title, author, rating, comment }) => {
  return (
    <View style={styles.ratingCard}>
      <Text style={styles.bookTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>{author}</Text>
      <RatingStars rating={rating} />
      {comment && <Text style={styles.bookComment} numberOfLines={2}>{comment}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  ratingCard: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: 10,
  },
  bookTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  bookAuthor: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 2,
  },
  bookComment: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary, 
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 18
  },
});

export default BookRatingCard;
