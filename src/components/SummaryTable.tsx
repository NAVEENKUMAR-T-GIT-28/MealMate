import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { THEME } from '@/utils/theme';
import type { MemberMonthlySummary } from '@/db/summary.repo';

interface SummaryTableProps {
  members: MemberMonthlySummary[];
  grandTotal: number;
}

export function SummaryTable({ members, grandTotal }: SummaryTableProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        {/* Header */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.nameCell, styles.headerText]}>Member</Text>
          <Text style={[styles.cell, styles.numCell, styles.headerText, { color: THEME.colors.morning }]}>☀️ M</Text>
          <Text style={[styles.cell, styles.numCell, styles.headerText, { color: THEME.colors.afternoon }]}>🌤️ A</Text>
          <Text style={[styles.cell, styles.numCell, styles.headerText, { color: THEME.colors.night }]}>🌙 N</Text>
          <Text style={[styles.cell, styles.totalCell, styles.headerText, { color: THEME.colors.primary }]}>Total ₹</Text>
        </View>

        {/* Member rows */}
        {members.map((m, i) => (
          <View key={m.memberId} style={[styles.row, i % 2 === 0 ? styles.evenRow : styles.oddRow]}>
            <Text style={[styles.cell, styles.nameCell, styles.bodyText]} numberOfLines={1}>
              {m.memberName}
            </Text>
            <Text style={[styles.cell, styles.numCell, styles.bodyText]}>{m.morningCount}</Text>
            <Text style={[styles.cell, styles.numCell, styles.bodyText]}>{m.afternoonCount}</Text>
            <Text style={[styles.cell, styles.numCell, styles.bodyText]}>{m.nightCount}</Text>
            <Text style={[styles.cell, styles.totalCell, styles.bodyText, styles.totalValue]}>
              ₹{m.totalCost.toLocaleString()}
            </Text>
          </View>
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
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderTopLeftRadius: THEME.radius.md,
    borderTopRightRadius: THEME.radius.md,
  },
  evenRow: {
    backgroundColor: THEME.colors.card,
  },
  oddRow: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
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
    color: THEME.colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  bodyText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
  },
  totalValue: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  grandTotalText: {
    color: THEME.colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
