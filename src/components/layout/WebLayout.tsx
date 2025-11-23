import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebSidebar from './WebSidebar';
import WebHeader from './WebHeader';
import { colors } from '../../constants/colors';
import { useIsWebDesktop } from '../../hooks/useIsWebDesktop';

interface WebLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  showNotifications?: boolean;
}

const WebLayout: React.FC<WebLayoutProps> = ({ 
  children, 
  headerTitle,
  showNotifications = false 
}) => {
  const isWebDesktop = useIsWebDesktop();

  // Si no es web o es web móvil, retornar solo los children (sin sidebar/header)
  if (Platform.OS !== 'web' || !isWebDesktop) {
    return <>{children}</>;
  }

  // Solo mostrar sidebar y header en web de escritorio
  return (
    <View style={styles.wrapper}>
      <WebSidebar />
      <View style={styles.mainContainer}>
        <WebHeader title={headerTitle} showNotifications={showNotifications} />
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    ...Platform.select({
      web: {
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      },
    }),
  },
  mainContainer: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    ...Platform.select({
      web: {
        marginLeft: 280,
        flex: 1,
      },
    }),
  },
  content: {
    flex: 1,
    backgroundColor: colors.neutral.background,
    ...Platform.select({
      web: {
        marginTop: 64,
        padding: 32,
        maxWidth: 1600,
        alignSelf: 'center',
        width: '100%',
        minHeight: 'calc(100vh - 64px)' as any,
      },
    }),
  },
});

export default WebLayout;

