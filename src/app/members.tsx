import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInLeft, SlideOutRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/utils/theme';
import {
  getAllMembers,
  addMember,
  deactivateMember,
  reactivateMember,
  type Member,
} from '@/db/members.repo';

export default function MembersScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState('');

  const loadMembers = useCallback(async () => {
    const all = await getAllMembers();
    setMembers(all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers])
  );

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

  const activeCount = members.filter((m) => m.is_active).length;
  const inactiveCount = members.length - activeCount;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Stats */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        {inactiveCount > 0 && (
          <View style={[styles.statBadge, { borderColor: THEME.colors.textDim }]}>
            <Text style={[styles.statNumber, { color: THEME.colors.textMuted }]}>
              {inactiveCount}
            </Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        )}
      </Animated.View>

      {/* Add Member */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="New member name..."
          placeholderTextColor={THEME.colors.textDim}
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable onPress={handleAdd} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#FFF" />
        </Pressable>
      </View>

      {/* Member List */}
      <FlatList
        data={members}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="person-add-outline" size={64} color={THEME.colors.textDim} />
            <Text style={styles.emptyTitle}>No Members</Text>
            <Text style={styles.emptySubtitle}>
              Add PG members above to start tracking meals
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInLeft.delay(index * 50).springify()}>
            <Pressable
              onPress={() => handleToggleActive(item)}
              style={[
                styles.memberCard,
                !item.is_active && styles.memberCardInactive,
              ]}
            >
              <View style={styles.memberLeft}>
                <View
                  style={[
                    styles.avatar,
                    !item.is_active && styles.avatarInactive,
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text
                    style={[
                      styles.memberName,
                      !item.is_active && styles.memberNameInactive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.memberMeta}>
                    Added {item.created_at}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.is_active ? styles.activeBadge : styles.inactiveBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: item.is_active ? THEME.colors.primary : THEME.colors.textMuted },
                  ]}
                >
                  {item.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  statsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  statNumber: {
    color: THEME.colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    color: THEME.colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  addBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.lg,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxxl,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  memberCardInactive: {
    opacity: 0.6,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInactive: {
    backgroundColor: THEME.colors.textDim,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  memberName: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  memberNameInactive: {
    textDecorationLine: 'line-through',
    color: THEME.colors.textMuted,
  },
  memberMeta: {
    color: THEME.colors.textDim,
    fontSize: 11,
    marginTop: 2,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: THEME.spacing.md,
  },
  emptyTitle: {
    color: THEME.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
