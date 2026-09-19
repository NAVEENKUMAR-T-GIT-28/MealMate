import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme, type ThemeColors } from '@/utils/theme';

export type MemberMonthlySummary = {
  member_id?: number;
  user_id?: number;
  member_name?: string;
  full_name?: string;
  name?: string;
  total_morning?: number;
  morning_count?: number;
  total_afternoon?: number;
  afternoon_count?: number;
  total_night?: number;
  night_count?: number;
  total_cost?: number;
  is_active?: number;
};

interface SummaryTableProps {
  members: MemberMonthlySummary[];
  grandTotal: number;
  onMemberPress?: (memberId: number) => void;
}

export function SummaryTable({ members = [], grandTotal = 0, onMemberPress }: SummaryTableProps) {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const safeMembers = Array.isArray(members) ? members : [];
  const safeGrandTotal = typeof grandTotal === 'number' ? grandTotal : 0;

  return (
    <View style={[styles.tableContainer, { borderColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.tableInner}>
          {/* Header */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.nameCell, styles.headerText]}>Member</Text>
            <Text style={[styles.cell, styles.numCell, styles.headerText, { color: colors.morning }]}>☀️ M</Text>
            <Text style={[styles.cell, styles.numCell, styles.headerText, { color: colors.afternoon }]}>🌤️ A</Text>
            <Text style={[styles.cell, styles.numCell, styles.headerText, { color: colors.night }]}>🌙 N</Text>
            <Text style={[styles.cell, styles.totalCell, styles.headerText, { color: colors.primary }]}>Total ₹</Text>
            <View style={styles.chevronCol} />
          </View>

          {/* Member rows */}
          {safeMembers.map((m, i) => (
            <Pressable
              key={m.user_id || (m as any).member_id || i}
              onPress={() => onMemberPress?.(m.user_id || (m as any).member_id)}
              style={({ pressed }: { pressed: boolean }) => [
                styles.row,
                i % 2 === 0 ? styles.evenRow : styles.oddRow,
                pressed && styles.pressedRow,
              ]}
            >
              <Text style={[styles.cell, styles.nameCell, styles.bodyText, { color: colors.text }]} numberOfLines={1}>
                {m.full_name || (m as any).member_name || (m as any).name || 'Member'}
              </Text>
              <Text style={[styles.cell, styles.numCell, styles.bodyText]}>{(m as any).morning_count ?? m.total_morning ?? 0}</Text>
              <Text style={[styles.cell, styles.numCell, styles.bodyText]}>{(m as any).afternoon_count ?? m.total_afternoon ?? 0}</Text>
              <Text style={[styles.cell, styles.numCell, styles.bodyText]}>{(m as any).night_count ?? m.total_night ?? 0}</Text>
              <Text style={[styles.cell, styles.totalCell, styles.bodyText, styles.totalValue]}>
                ₹{(m.total_cost ?? 0).toLocaleString()}
              </Text>
              <View style={styles.chevronCol}>
                <Ionicons name="chevron-forward" size={14} color={colors.textDim} />
              </View>
            </Pressable>
          ))}

          {/* Grand total */}
          <View style={[styles.row, styles.grandTotalRow]}>
            <Text style={[styles.cell, styles.nameCell, styles.grandTotalText]}>Grand Total</Text>
            <Text style={[styles.cell, styles.numCell]}> </Text>
            <Text style={[styles.cell, styles.numCell]}> </Text>
            <Text style={[styles.cell, styles.numCell]}> </Text>
            <Text style={[styles.cell, styles.totalCell, styles.grandTotalText]}>
              ₹{safeGrandTotal.toLocaleString()}
            </Text>
            <View style={styles.chevronCol} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  tableContainer: {
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    minWidth: '100%',
  },
  tableInner: {
    minWidth: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  evenRow: {
    backgroundColor: colors.card,
  },
  oddRow: {
    backgroundColor: colors.background,
  },
  grandTotalRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderBottomWidth: 0,
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  nameCell: {
    flex: 1,
    minWidth: 100,
  },
  numCell: {
    width: 44,
    textAlign: 'center',
  },
  totalCell: {
    width: 75,
    textAlign: 'right',
  },
  headerText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  totalValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  chevronCol: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedRow: {
    opacity: 0.7,
  },
  grandTotalText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
