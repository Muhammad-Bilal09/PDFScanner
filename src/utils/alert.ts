import { AlertButton, AlertOptions } from 'react-native';

export interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

type AlertListener = (state: AlertState) => void;

let currentAlertState: AlertState = {
  visible: false,
  title: '',
};

const listeners = new Set<AlertListener>();

export function subscribeAlert(listener: AlertListener): () => void {
  listeners.add(listener);
  // Send current state on subscribe
  listener(currentAlertState);
  return () => {
    listeners.delete(listener);
  };
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) {
  currentAlertState = {
    visible: true,
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default' }],
    options,
  };
  listeners.forEach((listener) => listener(currentAlertState));
}

export function hideAlert() {
  currentAlertState = {
    ...currentAlertState,
    visible: false,
  };
  listeners.forEach((listener) => listener(currentAlertState));
}

export const CustomAlert = {
  alert: showAlert,
  dismiss: hideAlert,
};

export default CustomAlert;
