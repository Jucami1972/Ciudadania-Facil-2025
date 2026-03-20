// src/screens/MisPreguntasScreen.tsx
// Pantalla "Mis Preguntas" — muestra preguntas marcadas e incorrectas del usuario

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProps } from '../types/navigation';
import { questions, Question } from '../data/questions';

type TabType = 'marked' | 'incorrect';

const MisPreguntasScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('marked');
  const [markedQuestions, setMarkedQuestions] = useState<Question[]>([]);
  const [incorrectQuestions, setIncorrectQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [markedData, incorrectData] = await Promise.all([
        AsyncStorage.getItem('@practice:marked'),
        AsyncStorage.getItem('@practice:incorrect'),
      ]);

      if (markedData) {
        const markedIds: number[] = JSON.parse(markedData);
        setMarkedQuestions(questions.filter((q) => markedIds.includes(q.id)));
      } else {
        setMarkedQuestions([]);
      }

      if (incorrectData) {
        const incorrectIds: number[] = JSON.parse(incorrectData);
        setIncorrectQuestions(questions.filter((q) => incorrectIds.includes(q.id)));
      } else {
        setIncorrectQuestions([]);
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading questions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRemoveMarked = async (id: number) => {
    try {
      const data = await AsyncStorage.getItem('@practice:marked');
      if (data) {
        const ids: number[] = JSON.parse(data);
        const updated = ids.filter((i) => i !== id);
        await AsyncStorage.setItem('@practice:marked', JSON.stringify(updated));
        setMarkedQuestions((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (error) {
      if (__DEV__) console.error('Error removing marked question:', error);
    }
  };

  const currentList = activeTab === 'marked' ? markedQuestions : incorrectQuestions;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'government':
        return 'Gobierno';
      case 'history':
        return 'Historia';
      case 'symbols_holidays':
        return 'Símbolos';
      default:
        return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'government':
        return '#1E40AF';
      case 'history':
        return '#9333EA';
      case 'symbols_holidays':
        return '#059669';
      default:
        return '#64748B';
    }
  };

  const renderQuestion = ({ item }: { item: Question }) => {
    const color = getCategoryColor(item.category);
    return (
      <View style={styles.questionCard}>
        <View style={styles.questionCardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.categoryBadgeText, { color }]}>
              {getCategoryLabel(item.category)}
            </Text>
          </View>
          <Text style={styles.questionId}>#{item.id}</Text>
        </View>
        <Text style={styles.questionText}>{item.questionEs}</Text>
        <Text style={styles.questionTextEn}>{item.questionEn}</Text>
        <Text style={styles.answerText}>
          ✅ {Array.isArray(item.answerEs) ? item.answerEs.join(' / ') : item.answerEs}
        </Text>
        {activeTab === 'marked' && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMarked(item.id)}
          >
            <MaterialCommunityIcons name="bookmark-remove" size={16} color="#EF4444" />
            <Text style={styles.removeButtonText}>Quitar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name={activeTab === 'marked' ? 'bookmark-outline' : 'check-circle-outline'}
        size={64}
        color="#CBD5E1"
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'marked' ? 'Sin preguntas marcadas' : 'Sin preguntas incorrectas'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'marked'
          ? 'Marca preguntas durante la práctica para revisarlas aquí'
          : '¡Excelente! No tienes preguntas incorrectas'}
      </Text>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
          start={{ x: 0, y: 0 }}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessibilityLabel="Volver atrás"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Mis Preguntas</Text>
                <Text style={styles.headerSubtitle}>Incorrectas y marcadas</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('Home')}
                style={styles.backButton}
                accessibilityLabel="Ir al inicio"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="home" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'incorrect' && styles.tabActiveIncorrect]}
            onPress={() => setActiveTab('incorrect')}
          >
            <MaterialCommunityIcons
              name="alert-circle"
              size={16}
              color={activeTab === 'incorrect' ? designSystem.colors.functional.error : designSystem.colors.text.tertiary}
            />
            <Text style={[styles.tabText, activeTab === 'incorrect' && styles.tabTextActiveIncorrect]}>
              Incorrectas ({incorrectQuestions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'marked' && styles.tabActiveMarked]}
            onPress={() => setActiveTab('marked')}
          >
            <MaterialCommunityIcons
              name="bookmark"
              size={16}
              color={activeTab === 'marked' ? designSystem.colors.functional.success : designSystem.colors.text.tertiary}
            />
            <Text style={[styles.tabText, activeTab === 'marked' && styles.tabTextActiveMarked]}>
              Marcadas ({markedQuestions.length})
            </Text>
          </TouchableOpacity>
        </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={designSystem.colors.brand.primary} />
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeQuestions.length > 0 && (
              <View style={styles.introCard}>
                <View style={[
                  styles.introIconContainer,
                  { backgroundColor: activeTab === 'incorrect' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }
                ]}>
                  <MaterialCommunityIcons
                    name={activeTab === 'incorrect' ? 'alert-circle' : 'bookmark'}
                    size={24}
                    color={activeTab === 'incorrect' ? designSystem.colors.functional.error : designSystem.colors.functional.success}
                  />
                </View>
                <Text style={styles.introTitle}>
                  {activeQuestions.length} {activeQuestions.length === 1 ? 'pregunta' : 'preguntas'}
                  {activeTab === 'incorrect' ? ' para repasar' : ' marcadas'}
                </Text>
                <Text style={styles.introSubtitle}>
                  {activeTab === 'incorrect'
                    ? 'Repasa estas preguntas para mejorar tu comprensión'
                    : 'Practica estas preguntas para reforzar tu conocimiento'}
                </Text>
              </View>
            )}

            <FlatList
              data={activeQuestions}
              renderItem={renderQuestion}
              keyExtractor={item => `${activeTab}-${item.id}`}
              scrollEnabled={false}
              ListEmptyComponent={ListEmptyComponent}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={10}
              updateCellsBatchingPeriod={50}
            />
          </ScrollView>

          {activeQuestions.length > 0 && (
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[
                  styles.startButton,
                  { backgroundColor: activeTab === 'incorrect' ? designSystem.colors.functional.error : designSystem.colors.functional.success }
                ]}
                onPress={startPractice}
              >
                <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>Comenzar Práctica</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
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
    backgroundColor: designSystem.colors.background.secondary,
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
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm + 4,
    gap: designSystem.spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: designSystem.colors.background.primary,
    gap: 6,
    ...designSystem.shadows.sm,
  },
  tabActiveIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: designSystem.colors.functional.error,
  },
  tabActiveMarked: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1.5,
    borderColor: designSystem.colors.functional.success,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: designSystem.colors.text.tertiary,
  },
  tabTextActiveIncorrect: {
    color: designSystem.colors.functional.error,
    fontWeight: '700',
  },
  tabTextActiveMarked: {
    color: designSystem.colors.functional.success,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: designSystem.spacing.md,
    paddingTop: designSystem.spacing.sm,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.lg,
  },
  loadingText: {
    marginTop: designSystem.spacing.md,
    fontSize: 14,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
  },
  introCard: {
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: designSystem.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designSystem.spacing.sm + 4,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 12,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  questionCard: {
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    marginBottom: designSystem.spacing.sm + 2,
    ...designSystem.shadows.sm,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.sm + 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: designSystem.borderRadius.md,
    gap: 5,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  attemptsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: designSystem.borderRadius.sm,
    gap: 4,
  },
  attemptsText: {
    fontSize: 11,
    fontWeight: '700',
    color: designSystem.colors.functional.warning,
  },
  bookmarkBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.sm + 2,
    lineHeight: 20,
  },
  answerPreview: {
    backgroundColor: designSystem.colors.background.secondary,
    padding: designSystem.spacing.sm + 2,
    borderRadius: designSystem.borderRadius.sm + 2,
    borderLeftWidth: 3,
  },
  answerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: designSystem.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  answerText: {
    fontSize: 12,
    color: designSystem.colors.text.primary,
    fontWeight: '500',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.xxl,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
    marginTop: designSystem.spacing.md,
    marginBottom: designSystem.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: designSystem.colors.background.primary,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.md,
    ...designSystem.shadows.lg,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: designSystem.borderRadius.md,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default MisPreguntasScreen;
