// src/utils/shareUtils.ts
// Utilidades para compartir contenido en redes sociales
import { Platform, Share, Linking } from 'react-native';
import * as Sharing from 'expo-sharing';
import { trackEvent, AnalyticsEvent } from './analytics';

interface ShareOptions {
  title?: string;
  message: string;
  url?: string;
  subject?: string;
}

/**
 * Compartir texto genérico
 */
export const shareText = async (options: ShareOptions): Promise<boolean> => {
  try {
    const result = await Share.share(
      {
        message: options.message,
        title: options.title,
        url: options.url,
        subject: options.subject,
      },
      {
        dialogTitle: options.title || 'Compartir',
        ...Platform.select({
          ios: {
            excludedActivityTypes: [],
          },
          android: {
            subject: options.subject,
          },
        }),
      }
    );

    if (result.action === Share.sharedAction) {
      trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
        feature: 'share',
        action: 'shared',
        platform: Platform.OS,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error compartiendo:', error);
    return false;
  }
};

/**
 * Compartir progreso de estudio
 */
export const shareProgress = async (
  progress: number,
  totalQuestions: number,
  streak: number
): Promise<boolean> => {
  const percentage = Math.round((progress / totalQuestions) * 100);
  
  let message = '';
  if (percentage === 100) {
    message = `🎉 ¡He completado todas las ${totalQuestions} preguntas del examen de ciudadanía! `;
  } else {
    message = `📚 He completado ${progress} de ${totalQuestions} preguntas (${percentage}%) estudiando para el examen de ciudadanía. `;
  }

  if (streak > 0) {
    message += `🔥 Racha de ${streak} días consecutivos. `;
  }

  message += `\n\nDescarga Ciudadanía Fácil y prepárate para tu examen: `;
  message += Platform.select({
    ios: 'https://apps.apple.com/app/ciudadania-facil',
    android: 'https://play.google.com/store/apps/details?id=com.ciudadaniafacil.app',
    default: 'https://ciudadania-facil-2025.vercel.app',
  });

  return await shareText({
    title: 'Mi Progreso - Ciudadanía Fácil',
    message,
  });
};

/**
 * Compartir logro
 */
export const shareAchievement = async (
  achievementTitle: string,
  achievementDescription: string
): Promise<boolean> => {
  const message = `🏆 ${achievementTitle}\n\n${achievementDescription}\n\n¡Descarga Ciudadanía Fácil y prepárate para tu examen! ${Platform.select({
    ios: 'https://apps.apple.com/app/ciudadania-facil',
    android: 'https://play.google.com/store/apps/details?id=com.ciudadaniafacil.app',
    default: 'https://ciudadania-facil-2025.vercel.app',
  })}`;

  return await shareText({
    title: achievementTitle,
    message,
  });
};

/**
 * Compartir resultado de práctica
 */
export const sharePracticeResult = async (
  correct: number,
  total: number,
  mode: string
): Promise<boolean> => {
  const percentage = Math.round((correct / total) * 100);
  const emoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪';

  const message = `${emoji} Acabo de completar una práctica de ${mode} en Ciudadanía Fácil:\n\n✅ ${correct}/${total} correctas (${percentage}%)\n\n¡Sigue estudiando para tu examen de ciudadanía! ${Platform.select({
    ios: 'https://apps.apple.com/app/ciudadania-facil',
    android: 'https://play.google.com/store/apps/details?id=com.ciudadaniafacil.app',
    default: 'https://ciudadania-facil-2025.vercel.app',
  })}`;

  return await shareText({
    title: 'Mi Resultado de Práctica',
    message,
  });
};

/**
 * Compartir en WhatsApp (solo Android/iOS)
 */
export const shareToWhatsApp = async (message: string): Promise<boolean> => {
  try {
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
        feature: 'share',
        action: 'whatsapp',
        platform: Platform.OS,
      });
      return true;
    } else {
      // Si WhatsApp no está instalado, usar share genérico
      return await shareText({ message });
    }
  } catch (error) {
    console.error('Error compartiendo en WhatsApp:', error);
    return await shareText({ message });
  }
};

/**
 * Compartir en Facebook
 */
export const shareToFacebook = async (message: string, url?: string): Promise<boolean> => {
  try {
    const shareUrl = url || 'https://ciudadania-facil-2025.vercel.app';
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(message)}`;
    
    const canOpen = await Linking.canOpenURL(facebookUrl);
    if (canOpen) {
      await Linking.openURL(facebookUrl);
      trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
        feature: 'share',
        action: 'facebook',
        platform: Platform.OS,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error compartiendo en Facebook:', error);
    return false;
  }
};

/**
 * Compartir en Twitter/X
 */
export const shareToTwitter = async (message: string, url?: string): Promise<boolean> => {
  try {
    const shareUrl = url || 'https://ciudadania-facil-2025.vercel.app';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`;
    
    const canOpen = await Linking.canOpenURL(twitterUrl);
    if (canOpen) {
      await Linking.openURL(twitterUrl);
      trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
        feature: 'share',
        action: 'twitter',
        platform: Platform.OS,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error compartiendo en Twitter:', error);
    return false;
  }
};

/**
 * Compartir archivo (imagen, PDF, etc.)
 */
export const shareFile = async (uri: string, mimeType?: string): Promise<boolean> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      console.warn('Sharing no está disponible en esta plataforma');
      return false;
    }

    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: 'Compartir archivo',
    });

    trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
      feature: 'share',
      action: 'file',
      platform: Platform.OS,
    });

    return true;
  } catch (error) {
    console.error('Error compartiendo archivo:', error);
    return false;
  }
};

/**
 * Compartir link de la app
 */
export const shareAppLink = async (): Promise<boolean> => {
  const message = `📱 Descarga Ciudadanía Fácil - La mejor app para prepararte para el examen de ciudadanía estadounidense.\n\n✅ 128 preguntas oficiales\n✅ Entrevista AI\n✅ Práctica interactiva\n✅ Audio en inglés y español\n\n${Platform.select({
    ios: 'https://apps.apple.com/app/ciudadania-facil',
    android: 'https://play.google.com/store/apps/details?id=com.ciudadaniafacil.app',
    default: 'https://ciudadania-facil-2025.vercel.app',
  })}`;

  return await shareText({
    title: 'Ciudadanía Fácil',
    message,
  });
};

