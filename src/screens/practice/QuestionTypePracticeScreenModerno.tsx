// src/screens/practice/QuestionTypePracticeScreenModerno.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProps } from '../../types/navigation';
import { getQuestionTypeStats, QuestionType } from '../../services/questionTypesService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columnas con padding

const QuestionTypePracticeScreenModerno = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);

  useEffect(() => {
    // Cargar estadísticas de tipos de preguntas
    const stats = getQuestionTypeStats();
    setQuestionTypes(stats);
  }, []);

  const handleTypePress = (type: QuestionType) => {
    // Navega a la pantalla de estudio con tarjetas flip para este tipo de pregunta
    navigation.navigate('StudyCardsByType', {
      questionType: type.id,
      typeName: type.name,
      typeNameEn: type.nameEn,
    });
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
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
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Estudio por Tipo</Text>
                <Text style={styles.headerSubtitle}>Clasifica y domina</Text>
                <Text style={styles.headerSubtitle}>cada tipo de pregunta</Text>
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
        {/* Grid de Tipos de Preguntas */}
        <View style={styles.grid}>
          {questionTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeCard, { width: CARD_WIDTH }]}
              onPress={() => handleTypePress(type)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${type.color}15` }]}>
                <MaterialCommunityIcons name={type.icon as any} size={24} color={type.color} />
              </View>
              <Text style={styles.typeName}>{type.name}</Text>
              <Text style={styles.typeNameEn}>{type.nameEn}</Text>
              <View style={styles.countContainer}>
                <MaterialCommunityIcons name="help-circle" size={12} color={type.color} />
                <Text style={[styles.countText, { color: type.color }]}>
                  {type.questionCount} preguntas
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
    textAlign: 'center',
  },
  typeNameEn: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default QuestionTypePracticeScreenModerno;
