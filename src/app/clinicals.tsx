import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClinicalRow } from '@/components/clinical-row';
import { Colors } from '@/constants/theme';
import { useClinicalLocations, useClinicals } from '@/hooks/use-clinicals';
import { useToday } from '@/hooks/use-study-sessions';
import { nextClinicals, pastClinicals } from '@/lib/clinicals';
import { formatMinutes } from '@/lib/study-sessions';

export default function Clinicals() {
  const today = useToday();
  const clinicals = useClinicals();
  const locations = useClinicalLocations();

  const comingUp = today ? nextClinicals(clinicals, today) : [];
  const past = today ? pastClinicals(clinicals, today) : [];
  const pastMinutes = past.reduce((sum, c) => sum + (c.minutes ?? 0), 0);

  const row = (clinical: (typeof clinicals)[number]) =>
    today && (
      <ClinicalRow
        key={clinical.id}
        clinical={clinical}
        location={locations.find((l) => l.id === clinical.locationId)}
        today={today}
      />
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.link}>Done</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/add-clinical')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Add a clinical">
            <Text style={styles.link}>+ New</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Clinicals</Text>

        {/* Past vs. coming up depends on today's date, which the static web render doesn't know */}
        {today && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Coming up</Text>
              {comingUp.length === 0 ? (
                <Text style={styles.empty}>No clinicals scheduled.</Text>
              ) : (
                comingUp.map(row)
              )}
            </View>

            {past.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Past · {past.length} {past.length === 1 ? 'clinical' : 'clinicals'}
                  {pastMinutes > 0 && ` · ${formatMinutes(pastMinutes)}`}
                </Text>
                {past.map(row)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  empty: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
