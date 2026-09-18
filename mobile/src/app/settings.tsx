import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  Modal
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme, useThemeMode, type ThemeColors, type ThemeMode } from '@/utils/theme';
import { getCurrentPrices, updatePrices, type CurrentPrices } from '@/db/prices.repo';
import { getMonthsWithData } from '@/db/summary.repo';
import { format, parseISO } from 'date-fns';
import { exportToExcel } from '@/utils/exportExcel';
import { exportToPdf } from '@/utils/exportPdf';

export default function SettingsScreen() {
  const colors = useAppTheme();
  const { mode, setMode } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [prices, setPrices] = useState<CurrentPrices>({ morning: 0, afternoon: 0, night: 0 });
  const [morningInput, setMorningInput] = useState('');
  const [afternoonInput, setAfternoonInput] = useState('');
  const [nightInput, setNightInput] = useState('');
  const [saving, setSaving] = useState(false);

  const [months, setMonths] = useState<{month: string}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isMonthPickerVisible, setMonthPickerVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadPrices = useCallback(async () => {
    const p = await getCurrentPrices();
    setPrices(p);
    setMorningInput(String(p.morning));
    setAfternoonInput(String(p.afternoon));
    setNightInput(String(p.night));
  }, []);

  const loadMonths = useCallback(async () => {
    const data = await getMonthsWithData();
    if (data && data.length > 0) {
      setMonths(data);
      if (!selectedMonth) {
        setSelectedMonth(data[0].month);
      }
    } else {
      const current = format(new Date(), 'yyyy-MM');
      setMonths([{ month: current }]);
      setSelectedMonth(current);
    }
  }, [selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      loadPrices();
      loadMonths();
    }, [loadPrices, loadMonths])
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

  const handleExportExcel = async () => {
    if (!selectedMonth) return;
    setExporting(true);
    try {
      await exportToExcel(selectedMonth);
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedMonth) return;
    setExporting(true);
    try {
      await exportToPdf(selectedMonth);
    } catch (e: any) {
      Alert.alert('Export Failed', e.message || 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const renderThemeOption = (themeMode: ThemeMode, icon: keyof typeof Ionicons.glyphMap, label: string) => {
    const isActive = mode === themeMode;
    return (
      <Pressable
        style={[styles.themeOption, isActive && styles.themeOptionActive]}
        onPress={() => setMode(themeMode)}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? '#FFFFFF' : colors.textDim}
        />
        <Text style={[styles.themeOptionText, isActive && styles.themeOptionTextActive]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const getMonthDisplay = (m: string) => {
    if (!m) return 'Select Month';
    return format(parseISO(`${m}-01`), 'MMMM yyyy');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Appearance Settings */}
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionSubtitle}>Choose your UI theme preference.</Text>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(50)} style={styles.themeSelector}>
          {renderThemeOption('light', 'sunny-outline', 'Light')}
          {renderThemeOption('dark', 'moon-outline', 'Dark')}
          {renderThemeOption('system', 'phone-portrait-outline', 'System')}
        </Animated.View>

        {/* Current Prices */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.sectionTitle, { marginTop: THEME.spacing.xl }]}>Meal Prices</Text>
          <Text style={styles.sectionSubtitle}>
            Changes take effect from today onwards. Past calculations stay unchanged.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)} style={styles.priceCard}>
          {/* Morning */}
          <View style={styles.priceRow}>
            <View style={[styles.priceLabel, { backgroundColor: colors.morningBg }]}>
              <Text style={{ color: colors.morning, fontWeight: '600' }}>☀️ Morning</Text>
            </View>
            <TextInput
              style={styles.priceInput}
              value={morningInput}
              onChangeText={setMorningInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textDim}
            />
          </View>

          {/* Afternoon */}
          <View style={styles.priceRow}>
            <View style={[styles.priceLabel, { backgroundColor: colors.afternoonBg }]}>
              <Text style={{ color: colors.afternoon, fontWeight: '600' }}>🌤️ Afternoon</Text>
            </View>
            <TextInput
              style={styles.priceInput}
              value={afternoonInput}
              onChangeText={setAfternoonInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textDim}
            />
          </View>

          {/* Night */}
          <View style={styles.priceRow}>
            <View style={[styles.priceLabel, { backgroundColor: colors.nightBg }]}>
              <Text style={{ color: colors.night, fontWeight: '600' }}>🌙 Night</Text>
            </View>
            <TextInput
              style={styles.priceInput}
              value={nightInput}
              onChangeText={setNightInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textDim}
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

        {/* Reports & Export */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionTitle, { marginTop: THEME.spacing.xxl }]}>
            Reports
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={styles.reportsCard}>
            <Text style={styles.label}>Select Month</Text>
            <Pressable 
              style={styles.monthPickerBtn} 
              onPress={() => setMonthPickerVisible(true)}
            >
              <Text style={styles.monthPickerText}>{getMonthDisplay(selectedMonth)}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textDim} />
            </Pressable>

            <View style={styles.exportRow}>
              <Pressable 
                style={[styles.exportBtn, { backgroundColor: '#107c41' }, exporting && { opacity: 0.6 }]} 
                onPress={handleExportExcel}
                disabled={exporting}
              >
                <Ionicons name="document-text-outline" size={20} color="#FFF" />
                <Text style={styles.exportBtnText}>Export Excel (.xlsx)</Text>
              </Pressable>

              <Pressable 
                style={[styles.exportBtn, { backgroundColor: '#d32f2f' }, exporting && { opacity: 0.6 }]} 
                onPress={handleExportPdf}
                disabled={exporting}
              >
                <Ionicons name="document-outline" size={20} color="#FFF" />
                <Text style={styles.exportBtnText}>Export PDF (.pdf)</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.infoCard}>
          <Text style={styles.infoTitle}>MealMate</Text>
          <Text style={styles.infoVersion}>v1.0.0 — 100% Offline</Text>
          <Text style={styles.infoDesc}>
            All data is stored locally on your device. No internet required.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Custom Month Picker Modal */}
      <Modal
        visible={isMonthPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMonthPickerVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setMonthPickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {months.map((m) => (
                <Pressable
                  key={m.month}
                  style={[
                    styles.modalOption,
                    selectedMonth === m.month && { backgroundColor: colors.primary + '15' }
                  ]}
                  onPress={() => {
                    setSelectedMonth(m.month);
                    setMonthPickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedMonth === m.month && { color: colors.primary, fontWeight: '700' }
                  ]}>
                    {getMonthDisplay(m.month)}
                  </Text>
                  {selectedMonth === m.month && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: THEME.spacing.xs,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: THEME.spacing.lg,
  },
  themeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: THEME.radius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: THEME.spacing.md,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    gap: 6,
  },
  themeOptionActive: {
    backgroundColor: colors.primary,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDim,
  },
  themeOptionTextActive: {
    color: '#FFFFFF',
  },
  priceCard: {
    backgroundColor: colors.card,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.background,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: THEME.radius.lg,
    paddingVertical: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  reportsCard: {
    backgroundColor: colors.card,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: THEME.spacing.md,
  },
  label: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
  },
  monthPickerText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  exportRow: {
    flexDirection: 'column',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.spacing.sm,
    borderRadius: THEME.radius.lg,
    paddingVertical: THEME.spacing.md,
  },
  exportBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  infoCard: {
    alignItems: 'center',
    padding: THEME.spacing.xxl,
    marginTop: THEME.spacing.xxxl,
  },
  infoTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  infoVersion: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  infoDesc: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
    maxWidth: 250,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: THEME.spacing.md,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    color: colors.text,
    fontSize: 16,
  }
});
