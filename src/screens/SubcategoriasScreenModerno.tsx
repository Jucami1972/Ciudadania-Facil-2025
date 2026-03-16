// src/screens/SubcategoriasScreenModerno.tsx

import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProps, SubcategoriasScreenRouteProp, SubCategory } from '../types/navigation';
import { questions } from '../data/questions';

const SubcategoriasScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<SubcategoriasScreenRouteProp>();
  const { mainCategory, categories } = route.params;
  const [progressData, setProgressData] = useState<Record<string, number>>({});
  const [selectedBlockCategory, setSelectedBlockCategory] = useState<(SubCategory & { questionCount: number }) | null>(null);
  const [isBlockModalVisible, setIsBlockModalVisible] = useState(false);

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
    // Si la categoría tiene más de 20 preguntas (ej. Sección B tiene 47), mostrar selector de bloques
    if (subcategory.questionCount > 20) {
      setSelectedBlockCategory(subcategory);
      setIsBlockModalVisible(true);
      return;
    }

    navigation.navigate('StudyCards', {
      category: subcategory.category,
      questionRange: subcategory.questionRange,
      title: subcategory.category,
      subtitle: subcategory.subtitle,
    });
  };

  const handleBlockSelect = (range: [number, number] | null, title: string) => {
    if (!selectedBlockCategory) return;
    setIsBlockModalVisible(false);
    
    // El timeout es necesario para permitir que la animación del modal cierre fluidamente en iOS
    setTimeout(() => {
      navigation.navigate('StudyCards', {
        category: selectedBlockCategory.category,
        questionRange: selectedBlockCategory.questionRange,
        title: selectedBlockCategory.category,
        subtitle: selectedBlockCategory.subtitle,
        blockRange: range,
        blockTitle: title,
      } as any);
    }, 150);
  };

  const renderSubcategoryCard = ({ item }: { item: SubCategory & { questionCount: number; progress: number } }) => (
    <TouchableOpacity
      style={styles.subcategoryCard}
      onPress={() => handleSubcategoryPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="folder-open" size={20} color="#4F46E5" />
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
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#3730A3', '#4F46E5', '#6366F1'] as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {mainCategory}
              </Text>
              <Text style={styles.headerSubtitle}>Subcategorías</Text>
            </View>
            <View style={{ width: 40 }} />
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
            <MaterialCommunityIcons name="book-open-variant" size={24} color="#4F46E5" />
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

      {/* MODAL DE BLOQUES DE ESTUDIO */}
      {selectedBlockCategory && (
        <Modal
          visible={isBlockModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsBlockModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBgDimmer} 
              activeOpacity={1} 
              onPress={() => setIsBlockModalVisible(false)} 
            />
            
            <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
              <View style={styles.dragHandle} />
              
              <Text style={styles.sheetTitle}>Sesión Larga Detectada</Text>
              <Text style={styles.sheetSubtitle}>
                Esta sección es bastante extensa ({selectedBlockCategory.questionCount} preguntas). ¿Cómo prefieres estudiarla hoy?
              </Text>
              
              {/* Opciones de bloques dinámicas */}
              {(() => {
                const total = selectedBlockCategory.questionCount;
                const blockSize = 16;
                const numBlocks = Math.ceil(total / blockSize);
                const blocks = [];
                
                for (let i = 0; i < numBlocks; i++) {
                  // User requested a 16-16-15 split for 47
                  const start = i * blockSize;
                  const end = Math.min((i + 1) * blockSize, total);
                  const count = end - start;
                  
                  blocks.push(
                    <TouchableOpacity
                      key={`block-${i}`}
                      style={styles.blockOption}
                      onPress={() => handleBlockSelect([start, end], `Bloque ${i + 1} (${start + 1}-${end})`)}
                    >
                      <View style={styles.blockIconCont}>
                        <MaterialCommunityIcons name="layers-outline" size={24} color="#4F46E5" />
                      </View>
                      <View style={styles.blockTextCont}>
                        <Text style={styles.blockTitle}>Bloque {i + 1}</Text>
                        <Text style={styles.blockSub}>{count} preguntas (De la {start + 1} a la {end})</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                }
                return blocks;
              })()}

              <View style={styles.divider} />
              
              <TouchableOpacity
                style={styles.blockOptionAll}
                onPress={() => handleBlockSelect(null, 'Sección Completa')}
              >
                <View style={[styles.blockIconCont, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={24} color="#DC2626" />
                </View>
                <View style={styles.blockTextCont}>
                  <Text style={[styles.blockTitle, { color: '#991B1B' }]}>Estudiar Sección Completa</Text>
                  <Text style={styles.blockSub}>Todas las {selectedBlockCategory.questionCount} preguntas. ¡Nivel experto!</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: '#3730A3',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
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
  
  // =============== MODAL DE BLOQUES ===============
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBgDimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  blockOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  blockOptionAll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  blockIconCont: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  blockTextCont: {
    flex: 1,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  blockSub: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
});

export default SubcategoriasScreenModerno;
