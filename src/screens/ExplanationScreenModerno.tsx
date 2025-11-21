// src/screens/ExplanationScreenModerno.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExplanationRouteProp, NavigationProps } from '../types/navigation';

const ExplanationScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<ExplanationRouteProp>();
  const { explanationEs, explanationEn, questionTitle } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Explicación Detallada</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionCard}>
          <MaterialCommunityIcons name="comment-question-outline" size={24} color="#1E40AF" />
          <Text style={styles.questionText}>{questionTitle}</Text>
        </View>

        <View style={styles.explanationCard}>
          <View style={styles.explanationHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={24} color="#10b981" />
            <Text style={styles.explanationTitle}>La Respuesta Detallada</Text>
          </View>
          
          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>Español:</Text>
            <Text style={styles.explanationText}>{explanationEs}</Text>
          </View>

          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>English:</Text>
            <Text style={[styles.explanationText, styles.englishText]}>{explanationEn}</Text>
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <MaterialCommunityIcons name="star-circle" size={24} color="#f59e0b" />
            <Text style={styles.tipTitle}>Consejo de Memoria</Text>
          </View>
          <Text style={styles.tipText}>
            Asocia esta explicación con una imagen mental para recordarla fácilmente durante el examen.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 24,
  },
  explanationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginLeft: 8,
  },
  languageSection: {
    marginBottom: 16,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    textAlign: 'justify',
  },
  englishText: {
    fontStyle: 'italic',
    color: '#666',
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ExplanationScreenModerno;

