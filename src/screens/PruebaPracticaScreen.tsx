// src/screens/PruebaPracticaScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProps, PracticeMode } from '../types/navigation';
import { PracticeOption } from '../types/practice';

const practiceOptions: PracticeOption[] = [
  {
    id: 'category',
    title: 'Práctica por Categoría',
    description: 'Practica preguntas específicas por tema',
    icon: 'book-open-variant',
    gradient: ['#270483', '#8146cc'],
    mode: 'category'
  },
  {
    id: 'random',
    title: 'Práctica Aleatoria',
    description: '10 preguntas aleatorias de todas las categorías',
    icon: 'shuffle-variant',
    gradient: ['#470a56', '#ce32b1'],
    mode: 'random'
  },
  {
    id: 'incorrect',
    title: 'Preguntas Incorrectas',
    description: 'Repasa las preguntas que has fallado',
    icon: 'alert-circle',
    gradient: ['#C62828', '#EF5350'],
    mode: 'incorrect'
  },
  {
    id: 'marked',
    title: 'Preguntas Marcadas',
    description: 'Repasa las preguntas que has guardado',
    icon: 'bookmark',
    gradient: ['#1565C0', '#42A5F5'],
    mode: 'marked'
  }
];

const PruebaPracticaScreen = () => {
  const navigation = useNavigation<NavigationProps>();

  const handleOptionPress = (option: PracticeOption) => {
    if (option.mode === 'category') {
      navigation.navigate('CategoryPractice');
    } else if (option.mode === 'random') {
      navigation.navigate('RandomPractice');
    } else if (option.mode === 'incorrect') {
      navigation.navigate('IncorrectPractice');
    } else if (option.mode === 'marked') {
      navigation.navigate('MarkedPractice');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Volver atrás"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Modo de Práctica</Text>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Home')}
              accessibilityLabel="Ir al inicio"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="home" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
        >
          {practiceOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionContainer}
              onPress={() => handleOptionPress(option)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={option.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.optionGradient}
              >
                <MaterialCommunityIcons 
                  name={option.icon} 
                  size={32} 
                  color="white" 
                />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
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
  scrollContent: {
    padding: 16,
  },
  optionContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default PruebaPracticaScreen;
