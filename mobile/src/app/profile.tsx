import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme, THEME } from '@/utils/theme';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const colors = useAppTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = () => {
    setEditName(user?.full_name || '');
    setIsEditing(true);
  };

  const handleSaveName = async () => {
    if (editName.trim() === '') {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    if (editName.trim() !== user?.full_name) {
      setIsSaving(true);
      const res = await updateProfile(editName.trim());
      setIsSaving(false);
      if (res.success) {
        setIsEditing(false);
      } else {
        Alert.alert('Error', res.error || 'Failed to update name');
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        logout();
      }
      return;
    }
    
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() }
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        
        {/* Large Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Name Row */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Name</Text>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.primary, backgroundColor: colors.background }]}
                value={editName}
                onChangeText={setEditName}
                autoFocus
                editable={!isSaving}
                onSubmitEditing={handleSaveName}
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handleSaveName} disabled={isSaving}>
                  <Text style={styles.actionBtnText}>{isSaving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.textMuted }]} onPress={() => setIsEditing(false)} disabled={isSaving}>
                  <Text style={styles.actionBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.valueContainer}>
              <Ionicons name="person-outline" size={18} color={colors.textDim} style={styles.icon} />
              <Text style={[styles.valueText, { color: colors.text }]}>{user?.full_name}</Text>
              <TouchableOpacity onPress={handleEditClick} style={styles.editIcon}>
                <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Email Row */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
          <View style={styles.valueContainer}>
            <Ionicons name="mail-outline" size={18} color={colors.textDim} style={styles.icon} />
            <Text style={[styles.valueText, { color: colors.textDim }]}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Logout Section */}
      <View style={styles.logoutSection}>
        <Text style={[styles.logoutLabel, { color: colors.textMuted }]}>Want to switch accounts?</Text>
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.danger }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutBtnText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: THEME.spacing.lg,
  },
  card: {
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    padding: THEME.spacing.xl,
    paddingTop: 32,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '700',
  },
  row: {
    borderBottomWidth: 1,
    paddingVertical: THEME.spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  valueText: {
    fontSize: 16,
    flex: 1,
  },
  editIcon: {
    padding: 4,
  },
  editContainer: {
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: THEME.radius.sm,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  logoutSection: {
    marginTop: 40,
    alignItems: 'center',
  },
  logoutLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
