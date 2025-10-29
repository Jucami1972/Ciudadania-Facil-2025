import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface ProgressModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  onRestart: () => void;
  onViewAll: () => void;
  sectionName: string;
  currentQuestion: number;
  totalQuestions: number;
}

const ProgressModal: React.FC<ProgressModalProps> = ({
  visible,
  onClose,
  onContinue,
  onRestart,
  onViewAll,
  sectionName,
  currentQuestion,
  totalQuestions,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header con icono */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📚</Text>
            </View>
            <Text style={styles.title}>Continuar Estudio</Text>
          </View>

          {/* Contenido */}
          <View style={styles.content}>
            <Text style={styles.message}>
              Tienes progreso guardado en:
            </Text>
            <Text style={styles.sectionName}>"{sectionName}"</Text>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Pregunta {currentQuestion} de {totalQuestions}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(currentQuestion / totalQuestions) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={onContinue}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonIcon}>▶️</Text>
                <Text style={styles.buttonText}>Continuar desde aquí</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.restartButton]}
              onPress={onRestart}
            >
              <Text style={styles.buttonIcon}>🔄</Text>
              <Text style={styles.buttonText}>Empezar desde el inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.viewAllButton]}
              onPress={onViewAll}
            >
              <Text style={styles.buttonIcon}>📋</Text>
              <Text style={styles.buttonText}>Ver todas las preguntas</Text>
            </TouchableOpacity>
          </View>

          {/* Botón cerrar */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: Platform.OS === 'web' ? Math.min(width * 0.9, 400) : width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressInfo: {
    alignItems: 'center',
    width: '100%',
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
  },
  continueButton: {
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
  },
  restartButton: {
    borderColor: '#FF9800',
  },
  viewAllButton: {
    borderColor: '#2196F3',
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
});

export default ProgressModal;
