// src/screens/SubscriptionScreen.tsx
// Pantalla de suscripción premium con planes interactivos usando RevenueCat
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { getAvailableProducts, purchaseProduct, restorePurchases, arePaymentsAvailable } from '../services/paymentService';
import WebLayout from '../components/layout/WebLayout';
import { useIsWebDesktop } from '../hooks/useIsWebDesktop';

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isPremium, refreshPremiumStatus, simulatePremiumActivation } = usePremium();
  const isWebDesktop = useIsWebDesktop();
  const isWeb = Platform.OS === 'web';

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!arePaymentsAvailable()) {
      setLoading(false);
      return;
    }
    try {
      const availablePackages = await getAvailableProducts();
      // RevenueCat returns packages
      setPackages(availablePackages);
    } catch (error) {
      console.error('Error cargando planes:', error);
      Alert.alert('Error', 'No se pudieron cargar los planes.');
    } finally {
      setLoading(false);
    }
  };

  const isExpoGo = () => {
    try {
      const Constants = require('expo-constants').default;
      return Constants.executionEnvironment === 'storeClient';
    } catch {
      return false;
    }
  };

  const handlePurchase = async (pkg: any) => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para realizar una compra.');
      navigation.navigate('AuthStack' as never);
      return;
    }
    if (!arePaymentsAvailable()) {
      Alert.alert('No disponible', 'Las compras no están disponibles en esta plataforma.');
      return;
    }

    setPurchasing(pkg.product.identifier);
    try {
      await purchaseProduct(pkg);
      
      // Checar si es Expo Go para forzar la actualización simulada del contexto
      if (isExpoGo()) {
         simulatePremiumActivation();
      } else {
         await refreshPremiumStatus();
      }

      Alert.alert(
        '¡Compra exitosa!',
        `¡Bienvenido a Premium! Ya tienes acceso a todas las funciones.`,
        [{ text: 'Continuar', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      if (error.code !== 'E_USER_CANCELLED' && !error.userCancelled) {
        Alert.alert('Error en la compra', error.message || 'No se pudo completar la compra.');
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para restaurar compras.');
      return;
    }
    setRestoring(true);
    try {
      await restorePurchases();
      
      if (isExpoGo()) {
         simulatePremiumActivation();
         Alert.alert('Compras restauradas', 'Tus compras simuladas se han restaurado con éxito.');
      } else {
         await refreshPremiumStatus();
         Alert.alert('Restauración completa', 'Se han verificado tus compras anteriores con la tienda.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron restaurar las compras.');
    } finally {
      setRestoring(false);
    }
  };

  const renderPackage = (pkg: any) => {
    const isPurchasing = purchasing === pkg.product.identifier;
    const isPopular = pkg.packageType === 'ANNUAL';

    const isMonthly = pkg.packageType === 'MONTHLY';
    const features = isMonthly ? [
        'Acceso completo a todas las 100 preguntas',
        'Exámenes de 20 preguntas ilimitados',
        'Sin anuncios en la aplicación'
    ] : [
        'Todo lo del plan mensual Premium',
        'Entrevista AI personalizada ilimitada',
        'Soporte prioritario',
        'Ahorro significativo (Recomendado)'
    ];

    return (
      <View key={pkg.identifier} style={[styles.planCard, isPopular && styles.planCardPopular, isWeb && styles.planCardWeb]}>
        {isPopular && (
          <View style={styles.popularBadge}>
             <Text style={styles.popularBadgeText}>RECOMENDADO</Text>
          </View>
        )}
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{pkg.product.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
          </View>
          <Text style={styles.planDescription}>{pkg.product.description}</Text>
        </View>
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
             <View key={index} style={styles.featureRow}>
               <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
               <Text style={styles.featureText}>{feature}</Text>
             </View>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.purchaseButton, isPopular && styles.purchaseButtonPopular, isPurchasing && styles.purchaseButtonDisabled]}
          onPress={() => handlePurchase(pkg)}
          disabled={isPurchasing || isPremium}
        >
          {isPurchasing ? <ActivityIndicator color="#FFFFFF" /> : isPremium ? <Text style={styles.purchaseButtonText}>¡Ya eres Premium!</Text> : <Text style={styles.purchaseButtonText}>Seleccionar Plan</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  const content = (
    <>
      {!isWeb && (
        <View style={styles.headerBarContainer}>
          <LinearGradient
            colors={['#3730A3', '#4F46E5', '#6366F1'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerBar, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerBarContent}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerBarTitle}>Suscripción Premium</Text>
              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>
        </View>
      )}
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons name="crown" size={48} color="#F59E0B" />
            <Text style={styles.headerTitle}>Desbloquea Premium</Text>
            <Text style={styles.headerSubtitle}>Las primeras 20 preguntas son gratis. Actualízate para ver las 100 preguntas y asegurar tu ciudadanía.</Text>
          </View>
        </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Cargando planes seguros...</Text>
        </View>
      ) : (
        <View style={styles.plansContainer}>
           {packages.length > 0 ? packages.map(renderPackage) : <Text style={styles.loadingText}>No hay planes disponibles en este momento.</Text>}
        </View>
      )}
      
      <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={restoring}>
        {restoring ? <ActivityIndicator color="#1E40AF" /> : (<><MaterialCommunityIcons name="refresh" size={20} color="#1E40AF" /><Text style={styles.restoreButtonText}>Ya tengo una cuenta, Restaurar compras</Text></>)}
      </TouchableOpacity>
      
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
          Las suscripciones se renuevan automáticamente a través de la tienda de aplicaciones.
        </Text>
      </View>
    </ScrollView>
    </>
  );

  if (isWeb && isWebDesktop) {
    return <WebLayout headerTitle="Suscripción Premium">{content}</WebLayout>;
  }

  return (
    <View style={[styles.safeArea]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  headerBarContainer: { backgroundColor: '#3730A3' },
  headerBar: { paddingHorizontal: 20, paddingBottom: 14 },
  headerBarContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBarTitle: { fontSize: 18, fontWeight: '700', color: 'white' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { paddingBottom: 40, ...Platform.select({ web: { paddingHorizontal: 48, paddingTop: 40, maxWidth: 1200, alignSelf: 'center', width: '100%' } }) },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, alignItems: 'center', ...Platform.select({ web: { paddingHorizontal: 0, paddingTop: 0 } }) },
  headerContent: { alignItems: 'center', marginTop: 20 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#111827', marginTop: 16, textAlign: 'center' },
  headerSubtitle: { fontSize: 16, color: '#6B7280', marginTop: 8, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  plansContainer: { paddingHorizontal: 20, gap: 20, ...Platform.select({ web: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 0, gap: 24 } }) },
  planCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 2, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, ...Platform.select({ web: { flex: 1, maxWidth: 350, marginBottom: 0, cursor: 'default' as any } }) },
  planCardWeb: { minHeight: 450 },
  planCardPopular: { borderColor: '#1E40AF', borderWidth: 3, transform: [{ scale: 1.05 }], ...Platform.select({ web: { transform: [{ scale: 1.08 }] } }) },
  popularBadge: { position: 'absolute', top: -12, left: '50%', transform: [{ translateX: -60 }], backgroundColor: '#1E40AF', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, zIndex: 1 },
  popularBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  planHeader: { alignItems: 'center', marginBottom: 24 },
  planTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  planPrice: { fontSize: 36, fontWeight: '700', color: '#1E40AF' },
  planDescription: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  featuresContainer: { marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  featureText: { fontSize: 15, color: '#374151', marginLeft: 12, flex: 1, lineHeight: 22 },
  purchaseButton: { backgroundColor: '#1E40AF', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  purchaseButtonPopular: { backgroundColor: '#1E40AF' },
  purchaseButtonDisabled: { opacity: 0.6 },
  purchaseButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  restoreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginHorizontal: 20, marginTop: 8, gap: 8 },
  restoreButtonText: { color: '#1E40AF', fontSize: 15, fontWeight: '600' },
  termsContainer: { paddingHorizontal: 20, marginTop: 24, ...Platform.select({ web: { paddingHorizontal: 0, maxWidth: 800, alignSelf: 'center' } }) },
  termsText: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
});

export default SubscriptionScreen;
