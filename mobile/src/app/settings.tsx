import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { THEME, useAppTheme, useThemeMode, ThemeMode } from '@/utils/theme';
import { useAuth } from '@/context/AuthContext';
import { useGroup } from '@/context/GroupContext';
import { usePricesQuery } from '@/hooks/usePricesQuery';
import { useSavePrices } from '@/hooks/useSavePrices';
import { getPrevMonth, getNextMonth, formatMonth } from '@/utils/dateHelpers';

export default function SettingsScreen() {
  const colors = useAppTheme();
  const { mode, setMode } = useThemeMode();
  const { user, logout } = useAuth();
  const { groups, currentGroup, switchGroup, isAdmin } = useGroup();

  const { data: pricesData } = usePricesQuery(currentGroup?.id);
  const savePricesMutation = useSavePrices(currentGroup?.id);

  const latestPrices = React.useMemo(() => {
    const latest = { morning: '0', afternoon: '0', night: '0' };
    if (!pricesData) return latest;
    for (const p of pricesData) {
      if (latest[p.meal_type] === '0' || latest[p.meal_type] === '') {
        latest[p.meal_type] = String(p.price);
      }
    }
    return latest;
  }, [pricesData]);

  const [morningInput, setMorningInput] = React.useState<string | null>(null);
  const [afternoonInput, setAfternoonInput] = React.useState<string | null>(null);
  const [nightInput, setNightInput] = React.useState<string | null>(null);
  const [isEditingPrices, setIsEditingPrices] = React.useState(false);

  const morningValue = morningInput !== null ? morningInput : latestPrices.morning;
  const afternoonValue = afternoonInput !== null ? afternoonInput : latestPrices.afternoon;
  const nightValue = nightInput !== null ? nightInput : latestPrices.night;

  const [exportMonth, setExportMonth] = React.useState(format(new Date(), 'yyyy-MM'));
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);

  const handleExportPdf = async () => {
    if (!currentGroup) return;
    setIsExportingPdf(true);
    try {
      const { exportToPdf } = await import('@/utils/exportPdf');
      await exportToPdf(currentGroup.id, exportMonth, { morning: Number(morningValue), afternoon: Number(afternoonValue), night: Number(nightValue) });
    } catch (error) {
      Alert.alert('Export Failed', 'There was an error exporting the PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (!currentGroup) return;
    setIsExportingExcel(true);
    try {
      const { exportToExcel } = await import('@/utils/exportExcel');
      await exportToExcel(currentGroup.id, exportMonth, { morning: Number(morningValue), afternoon: Number(afternoonValue), night: Number(nightValue) });
    } catch (error) {
      Alert.alert('Export Failed', 'There was an error exporting the Excel file.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleSavePrices = () => {
    if (!currentGroup) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    savePricesMutation.mutate(
      {
        morningPrice: Number(morningValue),
        afternoonPrice: Number(afternoonValue),
        nightPrice: Number(nightValue),
        effectiveFrom: today,
      },
      {
        onSuccess: () => {
          setMorningInput(null);
          setAfternoonInput(null);
          setNightInput(null);
          setIsEditingPrices(false);
          Alert.alert('Success', 'Meal prices updated successfully.');
        },
        onError: (err) => {
          Alert.alert('Error', 'Failed to save prices. Please try again.');
        },
      }
    );
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of MealMate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : '?';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: colors.text }]}>Settings & Account</Text>

      {/* Account Profile Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ACCOUNT</Text>
        <View style={styles.accountRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryDark }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.accountDetails}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.full_name || 'User'}</Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || 'N/A'}</Text>
            {user?.id && (
              <Text style={[styles.userId, { color: colors.primary }]}>User ID: #{user.id}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Active Group Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ACTIVE GROUP</Text>
        {currentGroup ? (
          <View style={styles.groupInfo}>
            <View style={styles.groupHeaderRow}>
              <Text style={[styles.groupName, { color: colors.text }]}>{currentGroup.name}</Text>
              {currentGroup.role && (
                <View style={[styles.roleBadge, { borderColor: colors.primary }]}>
                  <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                    {currentGroup.role.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {currentGroup.invite_code && (
              <View style={styles.infoRow}>
                <Ionicons name="key-outline" size={16} color={colors.textDim} />
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  Invite Code: <Text style={{ color: colors.text, fontWeight: '700' }}>{currentGroup.invite_code}</Text>
                </Text>
              </View>
            )}

            {/* Group Switcher if user is in multiple groups */}
            {groups.length > 1 && (
              <View style={styles.groupSwitcherBox}>
                <Text style={[styles.switcherLabel, { color: colors.textDim }]}>Switch Group:</Text>
                <View style={styles.groupChips}>
                  {groups.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => switchGroup(g.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: g.id === currentGroup.id ? colors.primary : colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: g.id === currentGroup.id ? '#FFFFFF' : colors.textMuted },
                        ]}
                      >
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ color: colors.textMuted }}>No active group selected.</Text>
        )}
      </View>

      {/* Theme Preferences */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APPEARANCE</Text>
        <View style={styles.themeRow}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.themeOption,
                {
                  backgroundColor: mode === m ? colors.primary : colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={
                  m === 'system'
                    ? 'desktop-outline'
                    : m === 'light'
                    ? 'sunny-outline'
                    : 'moon-outline'
                }
                size={18}
                color={mode === m ? '#FFFFFF' : colors.textMuted}
              />
              <Text
                style={[
                  styles.themeText,
                  { color: mode === m ? '#FFFFFF' : colors.textMuted },
                ]}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Meal Prices (Admin only) */}
      {isAdmin && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>MEAL PRICES</Text>
            <TouchableOpacity onPress={() => setIsEditingPrices(!isEditingPrices)}>
              <Ionicons 
                name={isEditingPrices ? "close-outline" : "pencil-outline"} 
                size={20} 
                color={isEditingPrices ? colors.danger : colors.primary} 
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.infoText, { color: colors.textMuted, marginBottom: THEME.spacing.sm }]}>
            Changes take effect from today onwards. Past calculations stay unchanged.
          </Text>
          
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.morning || '#F59E0B' }]}>☀️ Morning</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isEditingPrices ? colors.background : colors.card, borderColor: colors.border, opacity: isEditingPrices ? 1 : 0.6 }]}>
              <Text style={{ color: colors.textDim, paddingLeft: 12 }}>₹</Text>
              <TextInput
                style={[styles.priceInput, { color: colors.text }]}
                keyboardType="numeric"
                value={morningValue}
                onChangeText={setMorningInput}
                editable={isEditingPrices}
              />
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.afternoon || '#F97316' }]}>🌤️ Afternoon</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isEditingPrices ? colors.background : colors.card, borderColor: colors.border, opacity: isEditingPrices ? 1 : 0.6 }]}>
              <Text style={{ color: colors.textDim, paddingLeft: 12 }}>₹</Text>
              <TextInput
                style={[styles.priceInput, { color: colors.text }]}
                keyboardType="numeric"
                value={afternoonValue}
                onChangeText={setAfternoonInput}
                editable={isEditingPrices}
              />
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.night || '#6366F1' }]}>🌙 Night</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isEditingPrices ? colors.background : colors.card, borderColor: colors.border, opacity: isEditingPrices ? 1 : 0.6 }]}>
              <Text style={{ color: colors.textDim, paddingLeft: 12 }}>₹</Text>
              <TextInput
                style={[styles.priceInput, { color: colors.text }]}
                keyboardType="numeric"
                value={nightValue}
                onChangeText={setNightInput}
                editable={isEditingPrices}
              />
            </View>
          </View>

          {isEditingPrices && (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSavePrices}
              disabled={savePricesMutation.isPending}
            >
              {savePricesMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.saveBtnText}>Save Prices</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Export Reports */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>EXPORT REPORTS</Text>
        
        <View style={styles.exportMonthNav}>
          <TouchableOpacity onPress={() => setExportMonth(getPrevMonth(exportMonth))} style={styles.exportNavBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.exportMonthText, { color: colors.text }]}>{formatMonth(exportMonth)}</Text>
          <TouchableOpacity onPress={() => setExportMonth(getNextMonth(exportMonth))} style={styles.exportNavBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.exportActions}>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleExportPdf}
            disabled={isExportingPdf || isExportingExcel}
          >
            {isExportingPdf ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <>
                <Ionicons name="document-text" size={24} color={colors.danger} />
                <Text style={[styles.exportBtnText, { color: colors.text }]}>Export PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleExportExcel}
            disabled={isExportingPdf || isExportingExcel}
          >
            {isExportingExcel ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="stats-chart" size={24} color={colors.primary} />
                <Text style={[styles.exportBtnText, { color: colors.text }]}>Export Excel</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Action */}
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: colors.dangerLight + '20', borderColor: colors.danger }]}
        onPress={handleLogoutPress}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={[styles.logoutBtnText, { color: colors.danger }]}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: THEME.spacing.lg, gap: THEME.spacing.lg },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  card: {
    padding: THEME.spacing.lg,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    gap: THEME.spacing.md,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 20 },
  accountDetails: { flex: 1, gap: 2 },
  userName: { fontSize: 18, fontWeight: '700' },
  userEmail: { fontSize: 13 },
  userId: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  groupInfo: { gap: THEME.spacing.sm },
  groupHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupName: { fontSize: 18, fontWeight: '700' },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13 },
  groupSwitcherBox: { marginTop: THEME.spacing.sm, gap: 6 },
  switcherLabel: { fontSize: 12, fontWeight: '600' },
  groupChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, fontWeight: '600', width: 100 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', flex: 1, borderWidth: 1, borderRadius: THEME.radius.md, height: 40 },
  priceInput: { flex: 1, height: 40, paddingHorizontal: 8, fontSize: 16 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: THEME.radius.md, gap: 8, marginTop: THEME.spacing.sm },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  themeRow: { flexDirection: 'row', gap: THEME.spacing.sm },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    gap: 6,
  },
  themeText: { fontSize: 13, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    gap: 8,
    marginTop: THEME.spacing.md,
  },
  logoutBtnText: { fontSize: 15, fontWeight: '700' },
  exportMonthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: THEME.spacing.sm, gap: THEME.spacing.xl },
  exportNavBtn: { padding: THEME.spacing.sm },
  exportMonthText: { fontSize: 16, fontWeight: '700', minWidth: 140, textAlign: 'center' },
  exportActions: { flexDirection: 'row', gap: THEME.spacing.md, marginTop: THEME.spacing.xs },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: THEME.radius.md, borderWidth: 1 },
  exportBtnText: { fontSize: 14, fontWeight: '600' },
});
