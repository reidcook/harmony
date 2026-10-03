import { Alert, Platform } from 'react-native';

// Cancel / destructive-action prompt; `actionLabel` names the destructive button
export function confirmAction(
  title: string,
  detail: string,
  actionLabel: string,
  onConfirm: () => void
) {
  // Alert has no buttons on web
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${detail}`)) onConfirm();
    return;
  }
  Alert.alert(title, detail, [
    { text: 'Cancel', style: 'cancel' },
    { text: actionLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function confirmDelete(title: string, detail: string, onConfirm: () => void) {
  confirmAction(title, detail, 'Delete', onConfirm);
}
