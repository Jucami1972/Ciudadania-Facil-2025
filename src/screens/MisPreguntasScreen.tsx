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
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Mis Preguntas</Text>
              <Text style={styles.headerSubtitle}>Marcadas e incorrectas</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'marked' && styles.tabActive]}
          onPress={() => setActiveTab('marked')}
        >
          <MaterialCommunityIcons
            name="bookmark"
            size={18}
            color={activeTab === 'marked' ? '#1E40AF' : '#94A3B8'}
          />
          <Text style={[styles.tabText, activeTab === 'marked' && styles.tabTextActive]}>
            Marcadas ({markedQuestions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incorrect' && styles.tabActive]}
          onPress={() => setActiveTab('incorrect')}
        >
          <MaterialCommunityIcons
            name="alert-circle"
            size={18}
            color={activeTab === 'incorrect' ? '#EF4444' : '#94A3B8'}
          />
          <Text style={[styles.tabText, activeTab === 'incorrect' && styles.tabTextActive]}>
            Incorrectas ({incorrectQuestions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderQuestion}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    backgroundColor: '#1E3A8A',
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  // ─── TABS ──────────────
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#1E40AF',
  },
  // ─── LIST ──────────────
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  questionId: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 4,
  },
  questionTextEn: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    lineHeight: 18,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  // ─── EMPTY ──────────────
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  // ─── LOADING ──────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MisPreguntasScreen;
