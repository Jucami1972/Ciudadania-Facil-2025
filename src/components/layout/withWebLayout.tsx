import React from 'react';
import { Platform } from 'react-native';
import WebLayout from './WebLayout';

interface WithWebLayoutOptions {
  headerTitle?: string;
  showNotifications?: boolean;
}

export const withWebLayout = <P extends object>(
  Component: React.ComponentType<P>,
  options?: WithWebLayoutOptions
) => {
  const WrappedComponent = (props: P) => {
    if (Platform.OS === 'web') {
      return (
        <WebLayout 
          headerTitle={options?.headerTitle}
          showNotifications={options?.showNotifications}
        >
          <Component {...props} />
        </WebLayout>
      );
    }
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withWebLayout(${Component.displayName || Component.name})`;
  return WrappedComponent;
};



