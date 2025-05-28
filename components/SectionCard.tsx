import { CommonStyles } from '@/constants/styles';
import React from 'react';
import { Text, View } from 'react-native';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => {
  return (
    <View style={CommonStyles.card}>
      <Text style={CommonStyles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
};

export default SectionCard;
