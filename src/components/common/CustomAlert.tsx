import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AlertButton,
} from 'react-native';
import { useThemeContext } from '@/context/themeContext';
import { subscribeAlert, hideAlert, AlertState } from '@/utils/alert';
import Icon from '@/components/shared/Icon';

function getIconForAlert(title: string, message?: string, buttons?: AlertButton[]) {
  const text = `${title} ${message || ''}`.toLowerCase();
  const hasDestructive = buttons?.some((b) => b.style === 'destructive');

  if (text.includes('delete') || text.includes('remove') || text.includes('error') || text.includes('failed') || hasDestructive) {
    return { name: 'trash.fill', color: '#EF4444', bgColor: '#FEE2E2', darkBgColor: '#450A0A' };
  }
  if (text.includes('warning') || text.includes('permission') || text.includes('required') || text.includes('unavailable')) {
    return { name: 'info.circle', color: '#F97316', bgColor: '#FFEDD5', darkBgColor: '#431407' };
  }
  if (text.includes('success') || text.includes('cleared') || text.includes('exported') || text.includes('updated')) {
    return { name: 'checkmark.circle.fill', color: '#10B981', bgColor: '#D1FAE5', darkBgColor: '#064E3B' };
  }
  return { name: 'info.circle', color: '#3B82F6', bgColor: '#DBEAFE', darkBgColor: '#1E3A8A' };
}

export function CustomAlertModal() {
  const { theme, isDarkMode } = useThemeContext();
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
  });

  useEffect(() => {
    const unsubscribe = subscribeAlert((state) => {
      setAlertState(state);
    });
    return unsubscribe;
  }, []);

  if (!alertState.visible) {
    return null;
  }

  const { title, message, buttons = [], options } = alertState;
  const cancelable = options?.cancelable ?? true;
  const iconConfig = getIconForAlert(title, message, buttons);

  const handleBackdropPress = () => {
    if (cancelable) {
      hideAlert();
      options?.onDismiss?.();
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    hideAlert();
    if (button.onPress) {
      button.onPress();
    }
  };

  const isMultiOptions = buttons.length > 2;

  return (
    <Modal
      transparent
      visible={alertState.visible}
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <Pressable style={styles.overlay} onPress={handleBackdropPress}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon Header */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: isDarkMode ? iconConfig.darkBgColor : iconConfig.bgColor,
              },
            ]}
          >
            <Icon sf={iconConfig.name} size={28} color={iconConfig.color} />
          </View>

          {/* Content */}
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {!!message && (
            <Text style={[styles.message, { color: theme.textSecondary }]}>
              {message}
            </Text>
          )}

          {/* Action Buttons */}
          <View
            style={[
              styles.buttonsContainer,
              isMultiOptions ? styles.buttonsVertical : styles.buttonsHorizontal,
            ]}
          >
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';

              let btnBgColor = theme.primary;
              let btnTextColor = '#FFFFFF';

              if (isDestructive) {
                btnBgColor = theme.error;
                btnTextColor = '#FFFFFF';
              } else if (isCancel) {
                btnBgColor = isDarkMode ? '#27272A' : '#F4F4F5';
                btnTextColor = theme.text;
              } else if (!isMultiOptions && buttons.length === 2 && index === 0) {
                // Secondary button in side-by-side pair
                btnBgColor = isDarkMode ? '#27272A' : '#F4F4F5';
                btnTextColor = theme.text;
              }

              return (
                <TouchableOpacity
                  key={`${btn.text}-${index}`}
                  activeOpacity={0.7}
                  style={[
                    styles.button,
                    isMultiOptions ? styles.buttonFullWidth : styles.buttonFlex,
                    { backgroundColor: btnBgColor },
                  ]}
                  onPress={() => handleButtonPress(btn)}
                >
                  <Text style={[styles.buttonText, { color: btnTextColor }]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonsContainer: {
    width: '100%',
  },
  buttonsHorizontal: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonsVertical: {
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CustomAlertModal;
