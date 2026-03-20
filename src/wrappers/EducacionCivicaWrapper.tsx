// src/wrappers/EducacionCivicaWrapper.tsx
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../types/navigation';

const EducacionCivicaWrapper = () => {
  const navigation = useNavigation<NavigationProps>();

  useEffect(() => {
    navigation.replace('StudyCards', {
      category: 'civics',
      title: 'Educación Cívica',
      subtitle: 'A: Geografía',
      questionRange: '88-95',
    });
  }, []);

  return null;
};

export default EducacionCivicaWrapper;
