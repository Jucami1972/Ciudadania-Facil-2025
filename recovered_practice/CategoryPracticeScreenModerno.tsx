// src/screens/practice/CategoryPracticeScreenModerno.tsx

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProps } from '../../types/navigation';
import { designSystem, withOpacity } from '../../config/designSystem';
import { questions } from '../../data/questions';
import { CATEGORY_LABELS } from '../../constants/categories';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  questionCount: number;
}

const CategoryPracticeScreenModerno = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();

  const categories: Category[] = useMemo(() => {
    return [
      {
        id: 'government',
        name: CATEGORY_LABELS.government,
        icon: 'bank',
        color: '#1E40AF', // Azul profesional
        questionCount: questions.filter(q => q.category === 'government').length,
      },
      {
        id: 'history',
        name: CATEGORY_LABELS.history,
        icon: 'book-open-variant',
        color: '#ec4899',
        questionCount: questions.filter(q => q.category === 'history').length,
      },
      {
        id: 'civics',
        name: CATEGORY_LABELS.civics,
        icon: 'school',
        color: '#10b981',
        questionCount: questions.filter(q => q.category === 'civics').length,
      },
    ];
  }, []);

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryPractice', { 
      questionType: category.id 
    });
  };

  const renderCategoryCard = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.85}
    >
      <View style={[styles.iconWrapper, { backgroundColor: `${item.color}15` }]}>
        <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.questionCount}>{item.questionCount} preguntas</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={designSystem.colors.neutral[300]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Práctica</Text>
                <Text style={styles.headerSubtitle}>Por Categoría</Text>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </LinearGradient>
        </View>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.introCard}>
          <View style={styles.introIconContainer}>
            <MaterialCommunityIcons name="target" size={24} color={designSystem.colors.brand.primary} />
          </View>
          <Text style={styles.introTitle}>Domina por Tema</Text>
          <Text style={styles.introSubtitle}>
            Selecciona una categoría para practicar solo las preguntas de esa sección
          </Text>
        </View>

        <FlatList
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {},
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background.secondary,
  },
  scrollContent: {
    paddingHorizontal: designSystem.spacing.md,
    paddingTop: designSystem.spacing.md,
    paddingBottom: designSystem.spacing.lg,
  },
  introCard: {
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    alignItems: 'center',
    marginBottom: 20,
    ...designSystem.shadows.sm,
    borderWidth: 0.5,
    borderColor: designSystem.colors.border.light,
  },
  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: withOpacity(designSystem.colors.brand.secondary, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: designSystem.typography.bodyBold.fontSize,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: designSystem.typography.small.fontSize,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  categoryCard: {
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...designSystem.shadows.sm,
    borderWidth: 0.5,
    borderColor: designSystem.colors.border.light,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: designSystem.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: designSystem.typography.caption.fontSize,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
    marginBottom: 3,
  },
  questionCount: {
    fontSize: 11,
    color: designSystem.colors.text.secondary,
    fontWeight: '500',
  },
});

export default CategoryPracticeScreenModerno;
