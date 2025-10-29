// src/screens/EducacionCivicaScreen.tsx
import React from 'react';
import StudyCardsScreen from './StudyCardsScreen';
import { StudyCardsRouteProp } from '../types/navigation';

const EducacionCivicaScreen: React.FC = () => {
  const route: StudyCardsRouteProp = {
    key: 'educacion-civica',
    name: 'StudyCards',
    params: {
      category: 'symbols_holidays',
      title: 'Educación Cívica',
      subtitle: 'A: Geografía',
      questionRange: '88-95',
    }
  };

  return (
    <StudyCardsScreen
      route={route}
    />
  );
};

export default EducacionCivicaScreen;
