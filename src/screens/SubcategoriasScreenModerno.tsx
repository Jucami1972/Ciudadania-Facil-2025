// src/screens/SubcategoriasScreenModerno.tsx

import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProps, SubcategoriasScreenRouteProp, SubCategory } from '../types/navigation';
import { questions } from '../data/questions';

const SubcategoriasScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<SubcategoriasScreenRouteProp>();
  const { mainCategory, categories } = route.params;
  const [progressData, setProgressData] = useState<Record<string, number>>({});

  // Calcular progreso real desde AsyncStorage
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const viewedData = await AsyncStorage.getItem('@study:viewed');
        if (viewedData) {
          const viewedIds = new Set<number>(JSON.parse(viewedData));
          
          const newProgress: Record<string, number> = {};
          
          categories.forEach((cat: SubCategory) => {
            const categoryQuestions = questions.filter(
              (q) => q.category === cat.category && q.subcategory === cat.subtitle
            );
            const viewedCount = categoryQuestions.filter(q => viewedIds.has(q.id)).length;
            const progress = categoryQuestions.length > 0 
              ? Math.round((viewedCount / categoryQuestions.length) * 100)
              : 0;
            newProgress[cat.subtitle] = progress;
          });
          
          setProgressData(newProgress);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };
    loadProgress();
  }, [categories]);

  // Calcular el número de preguntas y progreso para cada subcategoría
  const subcategoriesWithStats = useMemo(() => {
    return categories.map((cat: SubCategory) => {
      // Filtrar preguntas por categoría y subcategoría
      const categoryQuestions = questions.filter(
        (q) => q.category === cat.category && q.subcategory === cat.subtitle
      );

      const questionCount = categoryQuestions.length;
      const progress = progressData[cat.subtitle] || 0;

      return {
        ...cat,
        questionCount,
        progress,
      };
    });
  }, [categories, progressData]);

  const handleSubcategoryPress = (subcategory: SubCategory & { questionCount: number }) => {
    navigation.navigate('StudyCards', {
      category: subcategory.category,
      questionRange: subcategory.questionRange,
      title: mainCategory,
      subtitle: subcategory.subtitle,
    });
  };

  const renderSubcategoryCard = ({ item }: { item: SubCategory & { questionCount: number; progress: number } }) => (
    <TouchableOpacity
      style={styles.subcategoryCard}
      onPress={() => handleSubcategoryPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="folder-open" size={20} color="#1E40AF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.subcategoryName} numberOfLines={2}>{item.subtitle}</Text>
          <Text style={styles.questionRange}>Preguntas {item.questionRange}</Text>
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.questionCount}>{item.questionCount}</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${item.progress}%`,
                  backgroundColor: item.progress > 0 ? '#1E40AF' : '#e5e7eb',
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: item.progress > 0 ? '#1E40AF' : '#9ca3af' }]}>
            {item.progress}%
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{mainCategory}</Text>
            <Text style={styles.headerSubtitle}>Subcategorías</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <View style={styles.introIconContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color="#1E40AF" />
          </View>
          <Text style={styles.introTitle}>Elige un Tema de Estudio</Text>
          <Text style={styles.introSubtitle}>
            Selecciona una subcategoría para comenzar a estudiar con tarjetas interactivas
          </Text>
        </View>

        <FlatList
          data={subcategoriesWithStats}
          renderItem={renderSubcategoryCard}
          keyExtractor={(item, index) => `${item.subtitle}-${index}`}
          scrollEnabled={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
        />
      </ScrollView>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
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
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
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
});

export default SubcategoriasScreenModerno;
