// src/screens/practice/QuestionTypePracticeScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProps } from '../../types/navigation';
import { questionCategories, getCategoryCount } from '../../data/questionCategories';
import { colors } from '../../constants/colors';

const QuestionTypePracticeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();

  const handleCategoryPress = (categoryId: string) => {
    // Navegar a la pantalla específica para este tipo de pregunta
    navigation.navigate('SpecificTypePractice' as any, {
      questionType: categoryId,
    });
  };

  // Separar categorías padre de las hijas
  const parentCategories = questionCategories.filter(c => 
    c.id === 'by_question_type' || c.id === 'by_answer_type'
  );
  const questionTypeCategories = questionCategories.filter(c => 
    c.questionType && c.id !== 'by_question_type'
  );
  const answerTypeCategories = questionCategories.filter(c => 
    c.answerType && c.id !== 'by_answer_type'
  );

  const renderCategoryItem = ({ item }: { item: typeof questionCategories[0] }) => {
    if (item.id === 'by_question_type' || item.id === 'by_answer_type') {
      return (
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
          <Text style={[styles.sectionTitle, { color: item.color }]}>{item.title}</Text>
          <Text style={styles.sectionDescription}>{item.description}</Text>
        </View>
      );
    }

    const count = getCategoryCount(item.id);

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item.id)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[item.color, `${item.color}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.categoryGradient}
        >
          <View style={styles.categoryContent}>
            <View style={styles.categoryIconContainer}>
              <MaterialCommunityIcons name={item.icon as any} size={32} color="white" />
            </View>
            <View style={styles.categoryTextContainer}>
              <Text style={styles.categoryTitle}>{item.title}</Text>
              <Text style={styles.categoryDescription}>{item.description}</Text>
              <Text style={styles.categoryCount}>{count} preguntas</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="white" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const allCategories = [
    ...parentCategories.filter(c => c.id === 'by_question_type'),
    ...questionTypeCategories,
    ...parentCategories.filter(c => c.id === 'by_answer_type'),
    ...answerTypeCategories,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Práctica por Tipo</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={allCategories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.dark,
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.light,
  },
  categoryCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryGradient: {
    padding: 16,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
});

export default QuestionTypePracticeScreen;

