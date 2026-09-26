import { Alert, Platform } from 'react-native';

export function confirmDelete(title: string, detail: string, onConfirm: () => void) {
  // Alert has no buttons on web
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${detail}`)) onConfirm();
    return;
  }
  Alert.alert(title, detail, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}
