import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInLeft, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { THEME, useAppTheme, type ThemeColors } from '@/utils/theme';
import { formatDateDisplay } from '@/utils/dateHelpers';
import {
  getAllMembers,
  addMember,
  deactivateMember,
  reactivateMember,
  renameMember,
  deleteMember,
  type Member,
} from '@/db/members.repo';

// ─── Avatar colours (same palette used across app) ───────
const AVATAR_COLORS = [
  '#10B981', '#6366F1', '#F59E0B', '#EF4444',
  '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6',
];
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MembersScreen() {
  const colors = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState('');

  // ─── Rename modal state ─────────────────────────────
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renamingMember, setRenamingMember] = useState<Member | null>(null);
  const [renameText, setRenameText] = useState('');

  const loadMembers = useCallback(async () => {
    const all = await getAllMembers();
    setMembers(all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers])
  );

  // ─── Add ────────────────────────────────────────────
  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert('Enter a name', 'Please type a member name first.');
      return;
    }
    await addMember(name);
    setNewName('');
    await loadMembers();
  };

  // ─── Toggle Active / Inactive ───────────────────────
  const handleToggleActive = (member: Member) => {
    if (member.is_active) {
      Alert.alert(
        'Deactivate Member',
        `Remove "${member.name}" from daily marking? Their history will be preserved.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deactivate',
            style: 'destructive',
            onPress: async () => {
              await deactivateMember(member.id);
              await loadMembers();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Reactivate Member',
        `Bring "${member.name}" back to daily marking?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reactivate',
            onPress: async () => {
              await reactivateMember(member.id);
              await loadMembers();
            },
          },
        ]
      );
    }
  };

  // ─── Rename ─────────────────────────────────────────
  const openRenameModal = (member: Member) => {
    setRenamingMember(member);
    setRenameText(member.name);
    setRenameModalVisible(true);
  };

  const handleRename = async () => {
    const trimmed = renameText.trim();
    if (!trimmed || !renamingMember) return;
    await renameMember(renamingMember.id, trimmed);
    setRenameModalVisible(false);
    setRenamingMember(null);
    setRenameText('');
    await loadMembers();
  };

  // ─── Delete ─────────────────────────────────────────
  const handleDelete = (member: Member) => {
    Alert.alert(
      'Delete Member',
      `Permanently delete "${member.name}" and ALL their meal history & payments?\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMember(member.id);
            await loadMembers();
          },
        },
      ]
    );
  };

  // ─── Stats ──────────────────────────────────────────
  const activeCount = members.filter((m) => m.is_active).length;
  const inactiveCount = members.length - activeCount;
  const thisMonth = new Date();
  const thisMonthStr = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}`;
  const addedThisMonth = members.filter((m) => m.created_at >= `${thisMonthStr}-01`).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ────── HEADER ────── */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.headerSection}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Members</Text>
            <Text style={styles.headerSub}>Manage your PG members</Text>
          </View>
        </View>
        <Pressable onPress={() => {/* scroll to add input */}} style={styles.addHeaderBtn}>
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addHeaderText}>Add Member</Text>
        </Pressable>
      </Animated.View>

      {/* ────── STATS CARDS ────── */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: colors.primary }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active{'\n'}Members</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.info }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
            <Ionicons name="person-add-outline" size={18} color={colors.info} />
          </View>
          <Text style={[styles.statNumber, { color: colors.info }]}>{members.length}</Text>
          <Text style={styles.statLabel}>Total{'\n'}Members</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.warning }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
            <Ionicons name="person-remove-outline" size={18} color={colors.warning} />
          </View>
          <Text style={[styles.statNumber, { color: colors.warning }]}>{inactiveCount}</Text>
          <Text style={styles.statLabel}>Inactive{'\n'}Members</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.night }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.night} />
          </View>
          <Text style={[styles.statNumber, { color: colors.night }]}>{addedThisMonth}</Text>
          <Text style={styles.statLabel}>Added This{'\n'}Month</Text>
        </View>
      </Animated.View>

      {/* ────── ADD MEMBER INPUT ────── */}
      <View style={styles.addRow}>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={18} color={colors.textDim} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter member name"
            placeholderTextColor={colors.textDim}
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
        </View>
        <Pressable onPress={handleAdd} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#FFF" />
        </Pressable>
      </View>

      {/* ────── LIST HEADER ────── */}
      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <Ionicons name="people-outline" size={18} color={colors.primary} />
          <Text style={styles.listHeaderText}>All Members ({members.length})</Text>
        </View>
      </View>

      {/* ────── MEMBER LIST ────── */}
      <FlatList
        data={members}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="person-add-outline" size={64} color={colors.textDim} />
            <Text style={styles.emptyTitle}>No Members</Text>
            <Text style={styles.emptySubtitle}>
              Add PG members above to start tracking meals
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInLeft.delay(index * 50).springify()}>
            <View
              style={[
                styles.memberCard,
                !item.is_active && styles.memberCardInactive,
              ]}
            >
              <View style={styles.memberLeft}>
                <View style={[styles.avatar, { backgroundColor: avatarColor(item.name) }, !item.is_active && styles.avatarInactive]}>
                  <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text
                    style={[
                      styles.memberName,
                      !item.is_active && styles.memberNameInactive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <View style={styles.memberMetaRow}>
                    <Ionicons name="calendar-outline" size={11} color={colors.textDim} />
                    <Text style={styles.memberMeta}>
                      Joined on {formatDateDisplay(item.created_at)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.memberActions}>
                {/* Active/Inactive badge */}
                <Pressable
                  onPress={() => handleToggleActive(item)}
                  style={[
                    styles.statusBadge,
                    item.is_active ? styles.activeBadge : styles.inactiveBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: item.is_active ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </Pressable>

                {/* Edit button */}
                <Pressable
                  onPress={() => openRenameModal(item)}
                  style={({ pressed }) => [styles.iconBtn, styles.editBtn, pressed && styles.iconBtnPressed]}
                >
                  <Ionicons name="pencil-outline" size={18} color={colors.textMuted} />
                </Pressable>

                {/* Delete button */}
                <Pressable
                  onPress={() => handleDelete(item)}
                  style={({ pressed }) => [styles.iconBtn, styles.deleteBtn, pressed && styles.iconBtnPressed]}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}
      />

      {/* ────── RENAME MODAL ────── */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRenameModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Rename Member</Text>
            <Text style={styles.modalSubtitle}>
              Enter a new name for "{renamingMember?.name}"
            </Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              placeholder="New name..."
              placeholderTextColor={colors.textDim}
              onSubmitEditing={handleRename}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setRenameModalVisible(false)}
                style={[styles.modalBtn, styles.modalCancelBtn]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRename}
                style={[styles.modalBtn, styles.modalSaveBtn]}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
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

  // ─── Header ─────────────────────────────────────────
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.full,
  },
  addHeaderText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // ─── Stats ──────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    gap: 2,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 13,
  },

  // ─── Add ────────────────────────────────────────────
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: THEME.spacing.md,
  },
  inputIcon: {
    marginRight: THEME.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: THEME.radius.lg,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── List Header ───────────────────────────────────
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  listHeaderText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl + 20,
  },

  // ─── Member Card ────────────────────────────────────
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  memberCardInactive: {
    opacity: 0.6,
    borderColor: colors.border,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInactive: {
    backgroundColor: colors.textDim,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  memberNameInactive: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  memberMeta: {
    color: colors.textDim,
    fontSize: 11,
  },

  // ─── Actions ────────────────────────────────────────
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.radius.full,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editBtn: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderColor: colors.border,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  iconBtnPressed: {
    opacity: 0.6,
  },

  // ─── Empty State ────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: THEME.spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },

  // ─── Rename Modal ──────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xxl,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.xxl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: THEME.spacing.xs,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: THEME.spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.lg,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: THEME.spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  modalCancelText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
  },
  modalSaveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
