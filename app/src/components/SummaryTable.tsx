import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme, type ThemeColors } from '@/utils/theme';
import type { MemberMonthlySummary } from '@/db/summary.repo';

interface SummaryTableProps {
  members: MemberMonthlySummary[];
  grandTotal: number;
  onMemberPress?: (memberId: number) => void;
}

export function SummaryTable({ members, grandTotal, onMemberPress }: SummaryTableProps) {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
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
        {members.map((m, i) => (
          <Pressable
            key={m.memberId}
            onPress={() => onMemberPress?.(m.memberId)}
            style={({ pressed }) => [
              styles.row,
              i % 2 === 0 ? styles.evenRow : styles.oddRow,
              pressed && styles.pressedRow,
            ]}
          >
            <Text style={[styles.cell, styles.nameCell, styles.bodyText]} numberOfLines={1}>
              {m.memberName}
            </Text>
            <Text style={[styles.cell, styles.numCell, styles.bodyText]}>{m.morningCount}</Text>
            <Text style={[styles.cell, styles.numCell, styles.bodyText]}>{m.afternoonCount}</Text>
            <Text style={[styles.cell, styles.numCell, styles.bodyText]}>{m.nightCount}</Text>
            <Text style={[styles.cell, styles.totalCell, styles.bodyText, styles.totalValue]}>
              ₹{m.totalCost.toLocaleString()}
            </Text>
            <View style={styles.chevronCol}>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
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
            ₹{grandTotal.toLocaleString()}
          </Text>
          <View style={styles.chevronCol} />
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderTopLeftRadius: THEME.radius.md,
    borderTopRightRadius: THEME.radius.md,
  },
  evenRow: {
    backgroundColor: colors.card,
  },
  oddRow: {
    backgroundColor: colors.background, // Removed hardcoded dark color
  },
  grandTotalRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderBottomLeftRadius: THEME.radius.md,
    borderBottomRightRadius: THEME.radius.md,
    borderBottomWidth: 0,
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  nameCell: {
    width: 120,
  },
  numCell: {
    width: 60,
    textAlign: 'center',
  },
  totalCell: {
    width: 90,
    textAlign: 'right',
  },
  headerText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  totalValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  chevronCol: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedRow: {
    opacity: 0.7,
  },
  grandTotalText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
