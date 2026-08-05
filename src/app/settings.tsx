import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { THEME } from '@/utils/theme';
import { getCurrentPrices, updatePrices, type CurrentPrices } from '@/db/prices.repo';
import { getDb } from '@/db/database';

export default function SettingsScreen() {
  const [prices, setPrices] = useState<CurrentPrices>({ morning: 0, afternoon: 0, night: 0 });
  const [morningInput, setMorningInput] = useState('');
  const [afternoonInput, setAfternoonInput] = useState('');
  const [nightInput, setNightInput] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPrices = useCallback(async () => {
    const p = await getCurrentPrices();
    setPrices(p);
    setMorningInput(String(p.morning));
    setAfternoonInput(String(p.afternoon));
    setNightInput(String(p.night));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPrices();
    }, [loadPrices])
  );

  const handleSavePrices = async () => {
    const m = parseFloat(morningInput);
    const a = parseFloat(afternoonInput);
    const n = parseFloat(nightInput);

    if (isNaN(m) || isNaN(a) || isNaN(n) || m < 0 || a < 0 || n < 0) {
      Alert.alert('Invalid Prices', 'Please enter valid positive numbers.');
      return;
    }

    setSaving(true);
    try {
      await updatePrices(m, a, n);
      Alert.alert('Saved', 'Meal prices updated from today onwards.');
      await loadPrices();
    } catch (e) {
      Alert.alert('Error', 'Failed to save prices.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const db = await getDb();

      const members = await db.getAllAsync('SELECT * FROM members');
      const entries = await db.getAllAsync('SELECT * FROM meal_entries');
      const mealPrices = await db.getAllAsync('SELECT * FROM meal_prices');
      const payments = await db.getAllAsync('SELECT * FROM payments');

      const backup = {
        exportedAt: new Date().toISOString(),
        version: 1,
        members,
        meal_entries: entries,
        meal_prices: mealPrices,
        payments,
      };

      const json = JSON.stringify(backup, null, 2);
      const fileUri = FileSystem.documentDirectory + 'pg_food_tracker_backup.json';
      await FileSystem.writeAsStringAsync(fileUri, json);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export PG Food Tracker Backup',
        });
      } else {
        Alert.alert('Export', 'Sharing is not available on this device. File saved to app storage.');
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Unknown error');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Current Prices */}
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.sectionTitle}>Meal Prices</Text>
          <Text style={styles.sectionSubtitle}>
            Changes take effect from today onwards. Past calculations stay unchanged.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100)} style={styles.priceCard}>
          {/* Morning */}
          <View style={styles.priceRow}>
            <View style={[styles.priceLabel, { backgroundColor: THEME.colors.morningBg }]}>
              <Text style={{ color: THEME.colors.morning, fontWeight: '600' }}>☀️ Morning</Text>
            </View>
            <TextInput
              style={styles.priceInput}
              value={morningInput}
              onChangeText={setMorningInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={THEME.colors.textDim}
            />
          </View>

          {/* Afternoon */}
          <View style={styles.priceRow}>
            <View style={[styles.priceLabel, { backgroundColor: THEME.colors.afternoonBg }]}>
              <Text style={{ color: THEME.colors.afternoon, fontWeight: '600' }}>🌤️ Afternoon</Text>
            </View>
            <TextInput
              style={styles.priceInput}
              value={afternoonInput}
              onChangeText={setAfternoonInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={THEME.colors.textDim}
            />
          </View>

          {/* Night */}
          <View style={styles.priceRow}>
            <View style={[styles.priceLabel, { backgroundColor: THEME.colors.nightBg }]}>
              <Text style={{ color: THEME.colors.night, fontWeight: '600' }}>🌙 Night</Text>
            </View>
            <TextInput
              style={styles.priceInput}
              value={nightInput}
              onChangeText={setNightInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={THEME.colors.textDim}
            />
          </View>

          <Pressable
            onPress={handleSavePrices}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            disabled={saving}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : 'Save Prices'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Data Management */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionTitle, { marginTop: THEME.spacing.xxl }]}>
            Data Management
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <Pressable onPress={handleExport} style={styles.actionCard}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="download-outline" size={24} color={THEME.colors.info} />
              </View>
              <View>
                <Text style={styles.actionTitle}>Export Backup</Text>
                <Text style={styles.actionSubtitle}>Save all data as JSON file</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={THEME.colors.textDim} />
          </Pressable>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.infoCard}>
          <Text style={styles.infoTitle}>PG Food Expense Tracker</Text>
          <Text style={styles.infoVersion}>v1.0.0 — 100% Offline</Text>
          <Text style={styles.infoDesc}>
            All data is stored locally on your device. No internet required.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl,
  },
  sectionTitle: {
    color: THEME.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: THEME.spacing.xs,
  },
  sectionSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    marginBottom: THEME.spacing.lg,
  },
  priceCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: THEME.spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.spacing.md,
  },
  priceLabel: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.radius.md,
  },
  priceInput: {
    width: 90,
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.lg,
    paddingVertical: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.sm,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  actionSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  infoCard: {
    alignItems: 'center',
    padding: THEME.spacing.xxl,
    marginTop: THEME.spacing.xxxl,
  },
  infoTitle: {
    color: THEME.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  infoVersion: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  infoDesc: {
    color: THEME.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
    maxWidth: 250,
  },
});
