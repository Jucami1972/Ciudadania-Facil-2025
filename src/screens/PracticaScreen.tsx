// src/screens/PracticaScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../constants/colors';
import { spacing, radius, shadow } from '../constants/spacing';
import { fontSize, fontWeight } from '../constants/typography';

type RootStackParamList = {
  Home: undefined;
  CategoryPractice: undefined;
  RandomPractice: undefined;
  IncorrectPractice: undefined;
  MarkedPractice: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PracticaScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();

  const practiceOptions = [
    {
      title: 'Práctica por Categoría',
      description: 'Selecciona una categoría específica para practicar',
      icon: 'folder-outline',
      gradient: ['#4A00E0', '#8E2DE2'] as const,
      onPress: () => navigation.navigate('CategoryPractice'),
    },
    {
      title: 'Práctica Aleatoria',
      description: '10 preguntas aleatorias de todas las categorías',
      icon: 'shuffle-variant',
      gradient: ['#8E2DE2', '#4A00E0'] as const,
      onPress: () => navigation.navigate('RandomPractice'),
    },
    {
      title: 'Preguntas Incorrectas',
      description: 'Practica las preguntas que has fallado',
      icon: 'alert-circle-outline',
      gradient: ['#E44D26', '#F16529'] as const,
      onPress: () => navigation.navigate('IncorrectPractice'),
    },
    {
      title: 'Preguntas Marcadas',
      description: 'Practica las preguntas que has marcado',
      icon: 'bookmark-outline',
      gradient: ['#11998e', '#38ef7d'] as const,
      onPress: () => navigation.navigate('MarkedPractice'),
    },
  ];

  const stats = [
    { label: 'Completadas', value: '45', icon: 'check-circle-outline' },
    { label: 'Correctas', value: '38', icon: 'thumb-up-outline' },
    { label: 'Precisión', value: '84%', icon: 'chart-line' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver atrás"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prueba Práctica</Text>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Home')}
            accessibilityLabel="Ir al inicio"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="home" size={24} color={colors.text.dark} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <MaterialCommunityIcons 
                name={stat.icon as any} 
                size={24} 
                color={colors.primary.main} 
              />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Practice Options */}
        <Text style={styles.sectionTitle}>Modos de Práctica</Text>
        {practiceOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionCard}
            onPress={option.onPress}
            accessibilityLabel={option.title}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={option.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientCard}
            >
              <MaterialCommunityIcons 
                name={option.icon as any} 
                size={32} 
                color="white" 
              />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <MaterialCommunityIcons 
                name="chevron-right" 
                size={24} 
                color="white" 
              />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#F5F5F5',
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.neutral.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadow.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginVertical: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text.light,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginBottom: spacing.lg,
  },
  optionCard: {
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.md,
  },
  gradientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  optionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: 'white',
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default PracticaScreen;
