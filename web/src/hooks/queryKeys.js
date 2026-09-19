/**
 * Centralized query key factory for TanStack Query.
 * 
 * Every query in the app should use keys from this file to ensure
 * consistent cache invalidation and avoid key collisions.
 */
export const queryKeys = {
  // Auth
  me: ['me'],

  // Groups
  groups: ['groups'],

  // Members for a specific group
  members: (groupId) => ['members', groupId],

  // Prices for a specific group
  prices: (groupId) => ['prices', groupId],

  // Attendance for a specific group + single date
  attendance: (groupId, date) => ['attendance', groupId, date],

  // Attendance for a specific group + full month (used in MemberDetailPage)
  attendanceMonth: (groupId, month, memberId) => ['attendance', groupId, 'month', month, memberId ?? 'all'],

  // Summary for a specific group + month
  summary: (groupId, month) => ['summary', groupId, month],
};
