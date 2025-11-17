// src/screens/StudyScreenModerno.tsx

import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList, SubCategory } from '../types/navigation';
import { questions } from '../data/questions';
import WebLayout from '../components/layout/WebLayout';

const isWeb = Platform.OS === 'web';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MainCategoryKey = 'GobiernoAmericano' | 'HistoriaAmericana' | 'EducacionCivica';

interface Category {
  id: MainCategoryKey;
  name: string;
  icon: string;
  color: string;
  questionCount: number;
  progress: number;
  sections: SubCategory[];
}

const categoryTitles = {
  GobiernoAmericano: 'Gobierno Americano',
  HistoriaAmericana: 'Historia Americana',
  EducacionCivica: 'Educación Cívica',
} as const;

const sections: Record<MainCategoryKey, SubCategory[]> = {
  GobiernoAmericano: [
    { 
      title: 'Gobierno Americano', 
      subtitle: 'A: Principles of American Government', 
      questionRange: '1-15', 
      category: 'government' 
    },
    { 
      title: 'Gobierno Americano', 
      subtitle: 'B: System of Government', 
      questionRange: '16-62', 
      category: 'government' 
    },
    { 
      title: 'Gobierno Americano', 
      subtitle: 'C: Rights and Responsibilities', 
      questionRange: '63-72', 
      category: 'government' 
    },
  ],
  HistoriaAmericana: [
    { 
      title: 'Historia Americana', 
      subtitle: 'A: Colonial Period and Independence', 
      questionRange: '73-89', 
      category: 'history' 
    },
    { 
      title: 'Historia Americana', 
      subtitle: 'B: 1800s', 
      questionRange: '90-99', 
      category: 'history' 
    },
    { 
      title: 'Historia Americana', 
      subtitle: 'C: Recent American History and Other Important Historical Information', 
      questionRange: '100-118', 
      category: 'history' 
    },
  ],
  EducacionCivica: [
    { 
      title: 'Símbolos y Días Festivos', 
      subtitle: 'A: Symbols', 
      questionRange: '119-124', 
      category: 'symbols_holidays' 
    },
    { 
      title: 'Símbolos y Días Festivos', 
      subtitle: 'B: Holidays', 
      questionRange: '125-128', 
      category: 'symbols_holidays' 
    },
  ],
};

const categoryConfig = {
  GobiernoAmericano: {
    icon: 'bank',
    color: '#7c3aed',
  },
  HistoriaAmericana: {
    icon: 'book-open-variant',
    color: '#ec4899',
  },
  EducacionCivica: {
    icon: 'school',
    color: '#10b981',
  },
} as const;

const StudyScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [progressData, setProgressData] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<MainCategoryKey>('GobiernoAmericano');
  const [subcategoryProgress, setSubcategoryProgress] = useState<Record<string, number>>({});

  // Calcular progreso real desde AsyncStorage
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const viewedData = await AsyncStorage.getItem('@study:viewed');
        if (viewedData) {
          const viewedIds = new Set<number>(JSON.parse(viewedData));
          
          const categoryMap = {
            GobiernoAmericano: 'government',
            HistoriaAmericana: 'history',
            EducacionCivica: 'symbols_holidays',
          } as const;

          const newProgress: Record<string, number> = {};
          const newSubcategoryProgress: Record<string, number> = {};
          
          (Object.keys(sections) as MainCategoryKey[]).forEach((key) => {
            const categoryType = categoryMap[key];
            const categoryQuestions = questions.filter(
              (q) => q.category === categoryType
            );
            const viewedCount = categoryQuestions.filter(q => viewedIds.has(q.id)).length;
            const progress = categoryQuestions.length > 0 
              ? Math.round((viewedCount / categoryQuestions.length) * 100)
              : 0;
            newProgress[key] = progress;

            // Calcular progreso por subcategoría
            sections[key].forEach((subcat) => {
              const subcatQuestions = questions.filter(
                (q) => q.category === categoryType && q.subcategory === subcat.subtitle
              );
              const subcatViewedCount = subcatQuestions.filter(q => viewedIds.has(q.id)).length;
              const subcatProgress = subcatQuestions.length > 0
                ? Math.round((subcatViewedCount / subcatQuestions.length) * 100)
                : 0;
              newSubcategoryProgress[subcat.subtitle] = subcatProgress;
            });
          });
          
          setProgressData(newProgress);
          setSubcategoryProgress(newSubcategoryProgress);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };
    loadProgress();
  }, []);

  // Calcular el número de preguntas por categoría
  const categories: Category[] = useMemo(() => {
    return (Object.keys(sections) as MainCategoryKey[]).map((key) => {
      const categorySections = sections[key];
      const categoryMap = {
        GobiernoAmericano: 'government',
        HistoriaAmericana: 'history',
        EducacionCivica: 'symbols_holidays',
      } as const;

      const categoryType = categoryMap[key];
      const questionCount = questions.filter(
        (q) => q.category === categoryType
      ).length;

      const progress = progressData[key] || 0;

      return {
        id: key,
        name: categoryTitles[key],
        icon: categoryConfig[key].icon,
        color: categoryConfig[key].color,
        questionCount,
        progress,
        sections: categorySections,
      };
    });
  }, [progressData]);

  const handleSubcategoryPress = (subcategory: SubCategory) => {
    const selectedCat = categories.find(c => c.id === selectedCategory);
    navigation.navigate('StudyCards', {
      category: subcategory.category,
      questionRange: subcategory.questionRange,
      title: selectedCat?.name || '',
      subtitle: subcategory.subtitle,
    });
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const selectedSubcategories = selectedCategoryData?.sections || [];

  const renderSubcategoryCard = (subcategory: SubCategory & { questionCount: number; progress: number }) => {
    const questionCount = questions.filter(
      (q) => q.category === subcategory.category && q.subcategory === subcategory.subtitle
    ).length;
    const progress = subcategoryProgress[subcategory.subtitle] || 0;

    return (
      <TouchableOpacity
        style={styles.subcategoryCard}
        onPress={() => handleSubcategoryPress(subcategory)}
        activeOpacity={0.85}
      >
        <View style={styles.cardContent}>
          <View style={[styles.iconWrapper, { backgroundColor: `${selectedCategoryData?.color || '#7c3aed'}15` }]}>
            <MaterialCommunityIcons name="folder-open" size={20} color={selectedCategoryData?.color || '#7c3aed'} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.subcategoryName} numberOfLines={2}>{subcategory.subtitle}</Text>
            <Text style={styles.questionRange}>Preguntas {subcategory.questionRange}</Text>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.questionCount}>{questionCount}</Text>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: progress > 0 ? (selectedCategoryData?.color || '#7c3aed') : '#e5e7eb',
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: progress > 0 ? (selectedCategoryData?.color || '#7c3aed') : '#9ca3af' }]}>
              {progress}%
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#d1d5db" />
        </View>
      </TouchableOpacity>
    );
  };

  const content = (
    <>
      {!isWeb && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ width: 36 }} />
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Estudio</Text>
              <Text style={styles.headerSubtitle}>Por Categoría</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
        </View>
      )}

      {/* Tabs de Categorías */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsContent}>
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            // Dividir el nombre en palabras para mostrar en dos líneas
            const words = category.name.split(' ');
            const firstWord = words[0] || '';
            const secondWord = words.slice(1).join(' ') || '';
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.tab,
                  isSelected && { backgroundColor: category.color },
                  !isSelected && { backgroundColor: '#f3f4f6' },
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons 
                  name={category.icon as any} 
                  size={18} 
                  color={isSelected ? '#FFFFFF' : category.color} 
                />
                <View style={styles.tabTextContainer}>
                  <Text
                    style={[
                      styles.tabText,
                      isSelected && { color: '#FFFFFF' },
                      !isSelected && { color: '#6b7280' },
                    ]}
                    numberOfLines={1}
                  >
                    {firstWord}
                  </Text>
                  {secondWord ? (
                    <Text
                      style={[
                        styles.tabText,
                        isSelected && { color: '#FFFFFF' },
                        !isSelected && { color: '#6b7280' },
                      ]}
                      numberOfLines={1}
                    >
                      {secondWord}
                    </Text>
                  ) : null}
                </View>
                {isSelected && (
                  <View style={[styles.tabIndicator, { backgroundColor: category.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Información de la categoría seleccionada */}
        {selectedCategoryData && (
          <View style={styles.categoryInfoCard}>
            <View style={[styles.categoryInfoIcon, { backgroundColor: `${selectedCategoryData.color}15` }]}>
              <MaterialCommunityIcons name={selectedCategoryData.icon as any} size={24} color={selectedCategoryData.color} />
            </View>
            <View style={styles.categoryInfoContent}>
              <Text style={styles.categoryInfoTitle}>{selectedCategoryData.name}</Text>
              <Text style={styles.categoryInfoSubtitle}>{selectedCategoryData.questionCount} preguntas</Text>
            </View>
            <View style={styles.categoryInfoProgress}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${selectedCategoryData.progress}%`,
                      backgroundColor: selectedCategoryData.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: selectedCategoryData.color }]}>
                {selectedCategoryData.progress}%
              </Text>
            </View>
          </View>
        )}

        {/* Subcategorías */}
        <View style={styles.subcategoriesSection}>
          <Text style={styles.sectionTitle}>Temas de Estudio</Text>
          {selectedSubcategories.map((subcat, index) => {
            const questionCount = questions.filter(
              (q) => q.category === subcat.category && q.subcategory === subcat.subtitle
            ).length;
            const progress = subcategoryProgress[subcat.subtitle] || 0;
            return (
              <View key={`${subcat.subtitle}-${index}`}>
                {renderSubcategoryCard({ ...subcat, questionCount, progress })}
              </View>
            );
          })}
        </View>

        <View style={styles.studyTipsCard}>
          <View style={styles.tipsHeader}>
            <MaterialCommunityIcons name="lightbulb" size={18} color="#f59e0b" />
            <Text style={styles.tipsTitle}>Consejos de Estudio</Text>
          </View>
          <Text style={styles.tipsText}>
            • Estudia una categoría a la vez para mejor retención
          </Text>
          <Text style={styles.tipsText}>
            • Dedica 15-20 minutos a cada categoría
          </Text>
          <Text style={styles.tipsText}>
            • Repite las categorías con menor progreso
          </Text>
          <Text style={styles.tipsText}>
            • Marca las preguntas difíciles para revisarlas
          </Text>
        </View>
      </ScrollView>
    </>
  );

  if (isWeb) {
    return (
      <WebLayout headerTitle="Estudio por Categoría">
        {content}
      </WebLayout>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 1,
    letterSpacing: 0.1,
  },
  container: {
    flex: 1,
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  tabsContent: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
    minHeight: 70,
    justifyContent: 'center',
  },
  tabTextContainer: {
    alignItems: 'center',
    gap: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -9,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  categoryInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  categoryInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfoContent: {
    flex: 1,
  },
  categoryInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  categoryInfoSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryInfoProgress: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  subcategoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subcategoryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  subcategoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
    lineHeight: 18,
  },
  questionRange: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
    minWidth: 50,
  },
  questionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  progressBarBackground: {
    width: 50,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
  },
  studyTipsCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350f',
  },
  tipsText: {
    fontSize: 11,
    color: '#78350f',
    marginBottom: 6,
    lineHeight: 16,
    fontWeight: '500',
  },
});

export default StudyScreenModerno;
