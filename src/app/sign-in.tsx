import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { sendCode, verifyCode } from '@/lib/auth';
import { finishLogin, prepareLogin } from '@/lib/sync';

const RESEND_SECONDS = 60;
const MIN_CODE_LENGTH = 6;

const looksLikeEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

function describeError(error: unknown) {
  const { message = '', code = '' } = (error ?? {}) as { message?: string; code?: string };
  if (code === 'otp_expired' || /token|otp/i.test(message)) {
    return 'That code is wrong or has expired. Try again or send a new one.';
  }
  if (/network|fetch/i.test(message)) return 'Couldn’t connect. Check your internet and try again.';
  return message || 'Something went wrong. Please try again.';
}

// Logs in with an emailed code. Opened with ?welcome=1 on first launch, where it can be skipped.
export default function SignIn() {
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const isWelcome = welcome === '1';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const trimmedEmail = email.trim().toLowerCase();
  const canSend = looksLikeEmail(trimmedEmail) && !busy;
  const canVerify = code.length >= MIN_CODE_LENGTH && !busy;

  const send = async () => {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    try {
      await sendCode(trimmedEmail);
      setStep('code');
      setCode('');
      setResendIn(RESEND_SECONDS);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!canVerify) return;
    setBusy(true);
    setError(null);
    try {
      // Queue this phone's data first so the first sync can't drop it
      prepareLogin();
      await verifyCode(trimmedEmail, code);
      await finishLogin();
      router.back();
    } catch (e) {
      setError(describeError(e));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            {!isWelcome && (
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <Text style={styles.link}>Cancel</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.hero}>
            <Image
              source={require('@/assets/harmony/heartprogress.png')}
              style={styles.mascot}
              contentFit="contain"
              accessibilityLabel="Harmony, a pink heart wearing a nurse's cap"
            />
            <Text style={styles.title}>
              {step === 'email' ? 'Back up your study progress' : 'Check your email'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email'
                ? 'Log in with your email to keep your sessions, streak, and upcomings safe, even if you switch phones.'
                : `We sent a code to ${trimmedEmail}. Enter it below to log in.`}
            </Text>
          </View>

          <View style={styles.card}>
            {step === 'email' ? (
              <>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={send}
                  placeholder="you@school.edu"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  style={styles.input}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Login code</Text>
                <TextInput
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                  onSubmitEditing={verify}
                  placeholder="123456"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={10}
                  autoFocus
                  style={[styles.input, styles.codeInput]}
                />
              </>
            )}
            {error && <Text style={styles.error}>{error}</Text>}
          </View>

          <Pressable
            onPress={step === 'email' ? send : verify}
            disabled={step === 'email' ? !canSend : !canVerify}
            style={({ pressed }) => [
              styles.primary,
              (step === 'email' ? !canSend : !canVerify) && styles.primaryDisabled,
              pressed && styles.pressed,
            ]}>
            {busy ? (
              <ActivityIndicator color={Colors.card} />
            ) : (
              <Text style={styles.primaryText}>{step === 'email' ? 'Send code' : 'Log in'}</Text>
            )}
          </Pressable>

          {step === 'code' && (
            <View style={styles.secondaryRow}>
              <Pressable
                onPress={() => {
                  setStep('email');
                  setError(null);
                }}
                hitSlop={8}>
                <Text style={styles.link}>Use a different email</Text>
              </Pressable>
              <Pressable onPress={send} disabled={resendIn > 0 || busy} hitSlop={8}>
                <Text style={[styles.link, resendIn > 0 && styles.linkDisabled]}>
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </Text>
              </Pressable>
            </View>
          )}

          {isWelcome && step === 'email' && (
            <Pressable onPress={() => router.back()} style={styles.skip} hitSlop={8}>
              <Text style={styles.skipText}>Skip for now</Text>
              <Text style={styles.skipHint}>
                Your progress stays on this phone. You can log in later from the profile icon.
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    minHeight: 20,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  linkDisabled: {
    color: Colors.textMuted,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  mascot: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    color: Colors.textMuted,
  },
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.track,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: Colors.danger,
  },
  primary: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.accentDeep,
  },
  primaryDisabled: {
    backgroundColor: Colors.accent,
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
  primaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.card,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skip: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accentDeep,
  },
  skipHint: {
    fontSize: 12,
    textAlign: 'center',
    color: Colors.textMuted,
  },
});
