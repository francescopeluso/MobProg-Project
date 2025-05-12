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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    marginBottom: 2,
  },
  bookComment: {
    fontSize: 14,
    color: '#555', 
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 18
  },
});

export default BookRatingCard;
