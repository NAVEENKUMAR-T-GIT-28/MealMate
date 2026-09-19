import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { THEME, useAppTheme } from '@/utils/theme';
import { useAuth } from '@/context/AuthContext';
import { useGroup } from '@/context/GroupContext';
import { useGroupMembersQuery } from '@/hooks/useGroupMembersQuery';
import { updateMemberStatus, removeMember } from '@/api/groups';
import { GroupMember } from '@/api/members';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

export default function MembersScreen() {
  const colors = useAppTheme();
  const { user } = useAuth();
  const { currentGroup, isAdmin, admitMember, isLoading: isGroupLoading } = useGroup();
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: membersData,
    isLoading: isMembersLoading,
    isError,
    refetch,
  } = useGroupMembersQuery(currentGroup?.id, !!currentGroup);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'toggle_status' | 'remove' | 'allow' | 'deny' | null;
    member?: GroupMember;
    title: string;
    message: string;
    confirmText: string;
    isDanger: boolean;
  }>({
    visible: false,
    type: null,
    title: '',
    message: '',
    confirmText: '',
    isDanger: false,
  });

  const closeModal = () => setModalConfig({ ...modalConfig, visible: false, member: undefined });

  const allMembers = membersData ?? [];
  
  const pendingMembers = useMemo(() => allMembers.filter(m => m.role === 'pending'), [allMembers]);
  const regularMembers = useMemo(() => allMembers.filter(m => m.role !== 'pending'), [allMembers]);
  
  const totalCount = regularMembers.length;
  const activeCount = regularMembers.filter(m => m.is_active).length;
  const inactiveCount = totalCount - activeCount;

  const handleCopyCode = async () => {
    if (currentGroup?.invite_code) {
      await Clipboard.setStringAsync(currentGroup.invite_code);
      Alert.alert('Copied!', 'Invite code copied to clipboard.', [{ text: 'OK' }]);
    }
  };

  const handleCopyLink = async () => {
    const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:5173';
    if (!webUrl) {
      Alert.alert('Configuration Error', 'Web URL is not configured. Cannot generate invite link.');
      return;
    }
    if (currentGroup?.invite_code) {
      const link = `${webUrl}/groups?code=${currentGroup.invite_code}`;
      await Clipboard.setStringAsync(link);
      Alert.alert('Copied!', 'Invite link copied to clipboard.', [{ text: 'OK' }]);
    }
  };

  const confirmAction = async () => {
    if (!modalConfig.member || !currentGroup) return;
    setIsSubmitting(true);
    
    try {
      if (modalConfig.type === 'toggle_status') {
        await updateMemberStatus(currentGroup.id, modalConfig.member.user_id, !modalConfig.member.is_active);
      } else if (modalConfig.type === 'remove' || modalConfig.type === 'deny') {
        await removeMember(currentGroup.id, modalConfig.member.user_id);
      } else if (modalConfig.type === 'allow') {
        await admitMember(modalConfig.member.user_id);
      }
      
      await queryClient.invalidateQueries({ queryKey: ['members', currentGroup.id] });
      closeModal();
    } catch (error: any) {
      Alert.alert('Action Failed', error?.response?.data?.error || 'An error occurred while updating member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openToggleModal = (member: GroupMember) => {
    setModalConfig({
      visible: true,
      type: 'toggle_status',
      member,
      title: 'Change Member Status',
      message: `Are you sure you want to mark ${member.name} as ${member.is_active ? 'inactive' : 'active'}?`,
      confirmText: member.is_active ? 'Make Inactive' : 'Make Active',
      isDanger: member.is_active,
    });
  };

  const openRemoveModal = (member: GroupMember) => {
    setModalConfig({
      visible: true,
      type: 'remove',
      member,
      title: 'Remove Member',
      message: `Are you sure you want to remove ${member.name} from the group? This cannot be undone.`,
      confirmText: 'Remove',
      isDanger: true,
    });
  };

  const openAllowModal = (member: GroupMember) => {
    setModalConfig({
      visible: true,
      type: 'allow',
      member,
      title: 'Allow Member',
      message: `Allow ${member.name} to join the group?`,
      confirmText: 'Allow',
      isDanger: false,
    });
  };

  const openDenyModal = (member: GroupMember) => {
    setModalConfig({
      visible: true,
      type: 'deny',
      member,
      title: 'Deny Request',
      message: `Deny ${member.name}'s request to join?`,
      confirmText: 'Deny',
      isDanger: true,
    });
  };

  const renderHeader = () => {
    if (!currentGroup) return null;
    
    const formattedDate = currentGroup.created_at ? format(new Date(currentGroup.created_at), 'MMM d, yyyy') : 'Unknown';

    return (
      <View style={{ marginBottom: THEME.spacing.lg }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.groupInfoRow}>
            <View style={[styles.groupLogo, { backgroundColor: colors.primaryDark }]}>
              <Ionicons name="people-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.groupName, { color: colors.text }]}>{currentGroup.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>Created {formattedDate}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>Invite Code</Text>
          <View style={styles.inviteRow}>
            <Text style={[styles.inviteCode, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}>
              {currentGroup.invite_code}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handleCopyCode}>
                <Ionicons name="copy-outline" size={16} color={colors.text} />
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>Code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handleCopyLink}>
                <Ionicons name="link-outline" size={16} color={colors.text} />
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{activeCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.warning || '#F59E0B' }]}>{inactiveCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Inactive</Text>
          </View>
        </View>

        {isAdmin && pendingMembers.length > 0 && (
          <View style={{ marginTop: THEME.spacing.md }}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="time-outline" size={18} color={colors.warning || '#F59E0B'} />
              <Text style={[styles.sectionTitle, { color: colors.warning || '#F59E0B' }]}>Pending Requests ({pendingMembers.length})</Text>
            </View>
            {pendingMembers.map((member) => (
              <View key={member.user_id} style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.warning || '#F59E0B', borderLeftWidth: 4 }]}>
                <View style={styles.memberLeft}>
                  <View style={[styles.avatar, { backgroundColor: colors.textDim }]}>
                    <Text style={styles.avatarText}>{member.name ? member.name.charAt(0).toUpperCase() : '?'}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      Requested {member.joined_at ? format(new Date(member.joined_at), 'MMM d') : ''}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.primary }]} onPress={() => openAllowModal(member)}>
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Allow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtnOutline, { borderColor: colors.danger }]} onPress={() => openDenyModal(member)}>
                    <Ionicons name="close" size={14} color={colors.danger} />
                    <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '600' }}>Deny</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.sectionHeaderRow, { marginTop: THEME.spacing.lg }]}>
          <Ionicons name="people-outline" size={18} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Members ({totalCount})</Text>
        </View>
      </View>
    );
  };

  const renderMemberItem = ({ item: member }: { item: GroupMember }) => {
    const isCurrentUser = member.user_id === user?.id;
    const initial = member.name ? member.name.charAt(0).toUpperCase() : '?';
    const isInactive = !member.is_active;

    return (
      <View style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: isInactive ? 0.7 : 1 }]}>
        <View style={styles.memberLeft}>
          <View style={[styles.avatar, { backgroundColor: isInactive ? colors.textDim : colors.primaryDark }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.memberName, { color: colors.text, textDecorationLine: isInactive ? 'line-through' : 'none' }]}>
                {member.name}
              </Text>
              {isCurrentUser && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>You</Text>
                </View>
              )}
              {member.role === 'admin' && (
                <View style={[styles.badgeOutline, { borderColor: colors.primary }]}>
                  <Ionicons name="shield-checkmark-outline" size={10} color={colors.primary} style={{ marginRight: 2 }} />
                  <Text style={[styles.badgeTextOutline, { color: colors.primary }]}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
              Joined {member.joined_at ? format(new Date(member.joined_at), 'MMM d, yyyy') : 'Unknown'}
            </Text>
          </View>
        </View>
        
        <View style={styles.memberRight}>
          <View style={[styles.badgeOutline, { borderColor: isInactive ? colors.textDim : colors.primary, marginRight: (isAdmin && !isCurrentUser) || isCurrentUser ? 8 : 0 }]}>
            <Text style={[styles.badgeTextOutline, { color: isInactive ? colors.textDim : colors.primary }]}>
              {isInactive ? 'Inactive' : 'Active'}
            </Text>
          </View>

          {isCurrentUser && (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity 
                style={[styles.iconBtnOnly, { backgroundColor: colors.background }]} 
                onPress={() => router.push('/profile')}
              >
                <Ionicons name="pencil-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {isAdmin && !isCurrentUser && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity 
                style={[styles.iconBtnOnly, { backgroundColor: isInactive ? colors.background : colors.primaryLight || '#E0F2FE' }]} 
                onPress={() => openToggleModal(member)}
              >
                <Ionicons name="power-outline" size={16} color={isInactive ? colors.text : colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconBtnOnly, { backgroundColor: colors.background }]} 
                onPress={() => openRemoveModal(member)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isGroupLoading || (isMembersLoading && !membersData)) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textMuted, marginTop: THEME.spacing.md }}>Loading group settings...</Text>
      </View>
    );
  }

  if (!currentGroup) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="people-outline" size={64} color={colors.textDim} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Group Selected</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Please select a group from the dashboard or create one.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={regularMembers}
        keyExtractor={(item) => String(item.user_id)}
        renderItem={renderMemberItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isMembersLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={{ color: colors.textMuted }}>No members found in this group.</Text>
          </View>
        }
      />

      <Modal visible={modalConfig.visible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{modalConfig.title}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>{modalConfig.message}</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={closeModal}
                disabled={isSubmitting}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: modalConfig.isDanger ? colors.danger : colors.primary }]}
                onPress={confirmAction}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{modalConfig.confirmText}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: THEME.spacing.xl },
  listContainer: { padding: THEME.spacing.md, gap: THEME.spacing.sm, paddingBottom: THEME.spacing.xxl },
  card: { padding: THEME.spacing.lg, borderRadius: THEME.radius.xl, borderWidth: 1 },
  groupInfoRow: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.md },
  groupLogo: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  groupName: { fontSize: 18, fontWeight: '700' },
  divider: { height: 1, marginVertical: THEME.spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: THEME.spacing.sm },
  inviteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inviteCode: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, fontSize: 16, fontWeight: '700', letterSpacing: 2, flex: 1, marginRight: THEME.spacing.sm, textAlign: 'center' },
  iconBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, gap: 4 },
  statsRow: { flexDirection: 'row', gap: THEME.spacing.sm, marginTop: THEME.spacing.md },
  statCard: { flex: 1, padding: THEME.spacing.md, borderRadius: THEME.radius.lg, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  memberCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: THEME.spacing.md, borderRadius: THEME.radius.lg, borderWidth: 1, marginBottom: THEME.spacing.sm },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: THEME.spacing.md, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  memberInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  memberName: { fontSize: 15, fontWeight: '600' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  badgeOutline: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
  badgeTextOutline: { fontSize: 10, fontWeight: '700' },
  memberRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtnOnly: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4 },
  smallBtnOutline: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, gap: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: THEME.spacing.lg },
  modalCard: { padding: THEME.spacing.xl, borderRadius: THEME.radius.xl, borderWidth: 1, gap: THEME.spacing.md },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSubtitle: { fontSize: 14, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: THEME.spacing.md, marginTop: THEME.spacing.sm },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  submitBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: THEME.radius.md, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#FFFFFF', fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: THEME.spacing.md },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: THEME.spacing.sm, paddingHorizontal: THEME.spacing.xl },
});
