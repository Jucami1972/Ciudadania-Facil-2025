import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProps, SubcategoriasScreenRouteProp, SubCategory } from '../types/navigation';

const SubcategoriasScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<SubcategoriasScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { mainCategory, categories } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          <Text style={styles.backButtonText}>Regresar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mainCategory}</Text>
      </View>

      <ScrollView style={styles.content}>
        {categories.map((cat: SubCategory, i: number) => (
          <TouchableOpacity
            key={i}
            style={styles.card}
            onPress={() =>
              navigation.navigate('StudyCards', {
                category: cat.category,
                questionRange: cat.questionRange,
                title: mainCategory,
                subtitle: cat.subtitle,
              })
            }
          >
            <Text style={styles.cardTitle}>{cat.subtitle}</Text>
            <Text style={styles.cardRange}>Preguntas {cat.questionRange}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#6200ee' },
  header: {
    backgroundColor: '#6200ee',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backButtonText: { color: 'white', marginLeft: 8, fontSize: 16 },
  headerTitle: {
    flex: 1,
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 40,
  },
  content: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardRange: { fontSize: 14, color: '#666' },
});

export default SubcategoriasScreen;
