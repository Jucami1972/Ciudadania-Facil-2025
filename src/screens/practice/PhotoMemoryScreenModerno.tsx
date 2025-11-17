// src/screens/practice/PhotoMemoryScreenModerno.tsx

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  FlatList,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavigationProps } from '../../types/navigation';

interface PhotoCard {
  id: number;
  question: string;
  answer: string;
  imagePath?: any; // Para require() de imágenes locales
  imageUrl?: string; // Para URLs (fallback)
  category: string;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const PhotoMemoryScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const [selectedCard, setSelectedCard] = useState<PhotoCard | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Mapa de imágenes: Agrega aquí las imágenes que tengas disponibles
  // Formato: require('../../assets/images/photo-memory/q{ID}.webp')
  // IMPORTANTE: Solo agrega las imágenes que realmente existen en la carpeta
  const imageMap: Record<number, any> = {
    1: require('../../assets/images/photo-memory/q001.webp'),
    // Agrega más imágenes aquí cuando las tengas:
    // 2: require('../../assets/images/photo-memory/q002.webp'),
    // 11: require('../../assets/images/photo-memory/q011.webp'),
    // 52: require('../../assets/images/photo-memory/q052.webp'),
    // 96: require('../../assets/images/photo-memory/q096.webp'),
    // 119: require('../../assets/images/photo-memory/q119.webp'),
    // 120: require('../../assets/images/photo-memory/q120.webp'),
    // 123: require('../../assets/images/photo-memory/q123.webp'),
  };

  const photoCards: PhotoCard[] = [
    {
      id: 1,
      question: '¿Cuál es la forma de gobierno de los Estados Unidos?',
      answer: 'República',
      imagePath: imageMap[1],
      category: 'Gobierno',
    },
    {
      id: 2,
      question: '¿Cuál es la ley suprema del país?',
      answer: 'La Constitución de EE. UU.',
      imagePath: imageMap[2],
      category: 'Gobierno',
    },
    {
      id: 11,
      question: 'Las palabras "Vida, Libertad y la búsqueda de la Felicidad" están en qué documento fundador?',
      answer: 'Declaración de Independencia',
      imagePath: imageMap[11],
      category: 'Gobierno',
    },
    {
      id: 52,
      question: '¿Cuál es la corte más alta de los Estados Unidos?',
      answer: 'La Corte Suprema',
      imagePath: imageMap[52],
      category: 'Gobierno',
    },
    {
      id: 96,
      question: '¿Qué guerra de EE. UU. puso fin a la esclavitud?',
      answer: 'La Guerra Civil',
      imagePath: imageMap[96],
      category: 'Historia',
    },
    {
      id: 119,
      question: '¿Cuál es la capital de los Estados Unidos?',
      answer: 'Washington, D.C.',
      imagePath: imageMap[119],
      category: 'Geografía',
    },
    {
      id: 120,
      question: '¿Dónde está la Estatua de la Libertad?',
      answer: 'Nueva York (Puerto de Nueva York) / Isla de la Libertad',
      imagePath: imageMap[120],
      category: 'Símbolos',
    },
    {
      id: 123,
      question: '¿Cuál es el nombre del himno nacional?',
      answer: 'The Star-Spangled Banner',
      imagePath: imageMap[123],
      category: 'Símbolos',
    },
  ].filter(card => card.imagePath !== undefined); // Solo mostrar tarjetas con imágenes disponibles

  const handleCardPress = (card: PhotoCard) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  const renderPhotoCard = ({ item }: { item: PhotoCard }) => (
    <TouchableOpacity
      style={[styles.photoCard, { width: cardWidth }]}
      onPress={() => handleCardPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {item.imagePath ? (
          <Image source={item.imagePath} style={styles.image} resizeMode="cover" />
        ) : item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e7eb' }]}>
            <MaterialCommunityIcons name="image-off" size={48} color="#9ca3af" />
          </View>
        )}
        <View style={styles.imageOverlay}>
          <MaterialCommunityIcons name="image" size={28} color="#fff" />
        </View>
      </View>
      <Text style={styles.cardQuestion} numberOfLines={2}>
        {item.question}
      </Text>
      <Text style={styles.cardCategory}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memoria Fotográfica</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introCard}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="image-multiple" size={48} color="#7c3aed" />
          </View>
          <Text style={styles.introTitle}>Aprende con Imágenes</Text>
          <Text style={styles.introSubtitle}>
            Asocia preguntas con imágenes para mejorar tu memoria visual y retención.
          </Text>
        </View>

        <FlatList
          data={photoCards}
          renderItem={renderPhotoCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        />

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <MaterialCommunityIcons name="lightbulb" size={24} color="#f59e0b" />
            <Text style={styles.tipsTitle}>Técnica de Memoria</Text>
          </View>
          <Text style={styles.tipsText}>🖼️ Asocia cada respuesta con una imagen mental.</Text>
          <Text style={styles.tipsText}>👁️ Visualiza los detalles mientras respondes.</Text>
          <Text style={styles.tipsText}>🧠 La memoria visual refuerza tu aprendizaje.</Text>
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {selectedCard && (
              <>
                {selectedCard.imagePath ? (
                  <Image source={selectedCard.imagePath} style={styles.modalImage} resizeMode="cover" />
                ) : selectedCard.imageUrl ? (
                  <Image source={{ uri: selectedCard.imageUrl }} style={styles.modalImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.modalImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e7eb' }]}>
                    <MaterialCommunityIcons name="image-off" size={64} color="#9ca3af" />
                  </View>
                )}
                <View style={styles.modalTextContainer}>
                  <Text style={styles.modalQuestion}>{selectedCard.question}</Text>
                  <View style={styles.answerCard}>
                    <MaterialCommunityIcons name="check-circle" size={22} color="#10b981" />
                    <Text style={styles.modalAnswer}>{selectedCard.answer}</Text>
                  </View>
                  <TouchableOpacity style={styles.modalButton} onPress={() => setShowModal(false)}>
                    <Text style={styles.modalButtonText}>Entendido</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: '#e5e7eb',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    paddingHorizontal: 12,
    paddingTop: 12,
    lineHeight: 20,
  },
  cardCategory: {
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  tipsCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#f59e0b',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350f',
    marginLeft: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#78350f',
    marginBottom: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#e5e7eb',
  },
  modalTextContainer: {
    padding: 20,
    gap: 16,
  },
  modalQuestion: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    lineHeight: 26,
  },
  answerCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    gap: 10,
  },
  modalAnswer: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PhotoMemoryScreenModerno;

