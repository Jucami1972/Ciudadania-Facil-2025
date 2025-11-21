import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SectionProgress {
  currentIndex: number;
  lastSavedIndex: number;
  sectionId: string;
}

export const useSectionProgress = (sectionId: string, totalQuestions: number) => {
  const [progress, setProgress] = useState<SectionProgress>({
    currentIndex: 0,
    lastSavedIndex: 0,
    sectionId,
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Clave para AsyncStorage
  const progressKey = `@section_progress_${sectionId}`;

  // Cargar progreso guardado al inicializar o cuando cambia el sectionId
  useEffect(() => {
    if (sectionId && sectionId !== 'practice_default' && totalQuestions > 0) {
      console.log('🔄 sectionId o totalQuestions cambió, cargando progreso para:', sectionId, 'totalQuestions:', totalQuestions);
      loadProgress();
    } else {
      // Si no hay sectionId válido o totalQuestions es 0, no cargar progreso
      console.log('ℹ️ No cargando progreso - sectionId:', sectionId, 'totalQuestions:', totalQuestions);
      setIsLoading(false);
      setShowProgressModal(false);
    }
  }, [sectionId, totalQuestions]);

  // Guardar progreso automáticamente cada vez que cambia el índice
  // Esto asegura que el progreso se guarde incluso si el usuario sale de la app
  useEffect(() => {
    if (progress.currentIndex > 0) {
      saveProgress(progress.currentIndex);
    }
  }, [progress.currentIndex]);

  const loadProgress = async () => {
    try {
      setIsLoading(true);
      setShowProgressModal(false); // Resetear modal antes de cargar
      console.log('📂 Cargando progreso para sección:', sectionId, 'clave:', progressKey, 'totalQuestions:', totalQuestions);
      const savedProgress = await AsyncStorage.getItem(progressKey);
      
      if (savedProgress) {
        const savedIndex = parseInt(savedProgress, 10);
        console.log('💾 Progreso guardado encontrado:', savedIndex, 'de', totalQuestions);
        // Permitir savedIndex >= 0 (incluyendo 0) y < totalQuestions
        if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < totalQuestions && totalQuestions > 0) {
          setProgress(prev => ({
            ...prev,
            lastSavedIndex: savedIndex,
          }));
          
          // Mostrar modal solo si hay progreso guardado y es válido
          // Incluso si savedIndex es 0, mostramos el modal para dar opción al usuario
          console.log('✅ Mostrando modal de progreso para pregunta:', savedIndex + 1);
          // Usar setTimeout para asegurar que el estado se actualice correctamente
          setTimeout(() => {
            setShowProgressModal(true);
          }, 100);
        } else {
          console.log('⚠️ Progreso guardado no es válido (fuera de rango o inválido):', savedIndex, 'totalQuestions:', totalQuestions);
        }
      } else {
        console.log('ℹ️ No hay progreso guardado para esta sección');
      }
    } catch (error) {
      console.error('❌ Error loading section progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (index: number) => {
    try {
      console.log('💾 Guardando progreso:', index, 'para sección:', sectionId, 'clave:', progressKey);
      await AsyncStorage.setItem(progressKey, index.toString());
      setProgress(prev => ({
        ...prev,
        lastSavedIndex: index,
      }));
      console.log('✅ Progreso guardado exitosamente');
    } catch (error) {
      console.error('❌ Error saving section progress:', error);
    }
  };

  const updateCurrentIndex = (index: number) => {
    setProgress(prev => ({
      ...prev,
      currentIndex: index,
    }));
  };

  const continueFromSaved = () => {
    setProgress(prev => ({
      ...prev,
      currentIndex: prev.lastSavedIndex,
    }));
    setShowProgressModal(false);
  };

  const restartFromBeginning = () => {
    setProgress(prev => ({
      ...prev,
      currentIndex: 0,
      lastSavedIndex: 0,
    }));
    setShowProgressModal(false);
    // Limpiar progreso guardado
    AsyncStorage.removeItem(progressKey);
  };

  const viewAllQuestions = () => {
    setShowProgressModal(false);
    // El usuario puede navegar libremente
  };

  const closeProgressModal = () => {
    setShowProgressModal(false);
    // Mantener el índice actual (no cambiar nada)
  };

  const clearProgress = async () => {
    try {
      await AsyncStorage.removeItem(progressKey);
      setProgress(prev => ({
        ...prev,
        lastSavedIndex: 0,
      }));
    } catch (error) {
      console.error('Error clearing section progress:', error);
    }
  };

  return {
    currentIndex: progress.currentIndex,
    lastSavedIndex: progress.lastSavedIndex,
    showProgressModal,
    isLoading,
    updateCurrentIndex,
    continueFromSaved,
    restartFromBeginning,
    viewAllQuestions,
    closeProgressModal,
    saveProgress,
    clearProgress,
  };
};
