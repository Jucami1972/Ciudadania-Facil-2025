import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface CategoryCardProps {
  title: string;
  subtitle?: string;
  questions?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  gradient: [string, string];
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  subtitle,
  questions,
  icon,
  gradient,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={gradient}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <MaterialCommunityIcons name={icon} size={Platform.OS === 'web' ? 20 : 32} color="white" />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            {questions && <Text style={styles.questions}>{questions}</Text>}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%' as const,
    marginBottom: Platform.select({ web: spacing.sm, default: spacing.md }) as number,
  },
  card: {
    borderRadius: Platform.select({ web: 10, default: 12 }) as number,
    padding: Platform.select({ web: spacing.sm, default: spacing.md }) as number,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.select({ web: 4, default: spacing.sm }) as number,
  },
  textContainer: {
    marginLeft: Platform.select({ web: spacing.sm, default: spacing.md }) as number,
    flex: 1,
  },
  title: {
    fontSize: Platform.select({ web: 14, default: 18 }) as number,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: Platform.select({ web: 2, default: spacing.xs }) as number,
  },
  subtitle: {
    fontSize: Platform.select({ web: 12, default: 14 }) as number,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Platform.select({ web: 2, default: spacing.xs }) as number,
  },
  questions: {
    fontSize: Platform.select({ web: 11, default: 12 }) as number,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default CategoryCard;
