import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendance';
import { queryKeys } from './queryKeys';

/**
 * Mutation hook for toggling meal attendance with optimistic updates.
 *
 * Flow:
 * 1. onMutate: cancel in-flight attendance query, snapshot cache, optimistically toggle
 * 2. API: PUT /attendance/toggle
 * 3. onError: rollback to previous snapshot
 * 4. onSettled: invalidate attendance + summary queries for consistency
 *
 * The attendance toggle API returns the updated attendance row.
 * Server response shape: { id, group_id, user_id, date, morning, afternoon, night, updated_at }
 */
export function useToggleAttendance(groupId, date) {
  const queryClient = useQueryClient();
  const attendanceKey = queryKeys.attendance(groupId, date);

  return useMutation({
    mutationFn: ({ mealType }) => attendanceApi.toggleMeal(groupId, date, mealType),

    onMutate: async ({ mealType, memberId, activeMembers }) => {
      // 1. Cancel any in-flight attendance queries for this date
      await queryClient.cancelQueries({ queryKey: attendanceKey });

      // 2. Snapshot the previous attendance data
      const previousAttendance = queryClient.getQueryData(attendanceKey);

      // 3. Optimistically update the cache
      queryClient.setQueryData(attendanceKey, (old) => {
        if (!old) return old;
        const entries = [...old];
        const index = entries.findIndex(e => e.user_id === memberId);
        if (index >= 0) {
          entries[index] = { ...entries[index], [mealType]: !entries[index][mealType] };
        } else {
          // New entry for this user on this date
          const member = activeMembers?.find(m => m.user_id === memberId);
          entries.push({
            user_id: memberId,
            member_name: member?.name,
            morning: mealType === 'morning',
            afternoon: mealType === 'afternoon',
            night: mealType === 'night',
            date,
          });
        }
        return entries;
      });

      // 4. Return rollback context
      return { previousAttendance };
    },

    onError: (_err, _variables, context) => {
      // Rollback to previous cache on failure
      if (context?.previousAttendance) {
        queryClient.setQueryData(attendanceKey, context.previousAttendance);
      }
    },

    onSettled: () => {
      // Invalidate attendance for this date to sync with server truth
      queryClient.invalidateQueries({ queryKey: attendanceKey });

      // Invalidate summaries that depend on attendance data.
      // We invalidate all summaries for this group (any month) since the toggle
      // could affect the current month's summary.
      queryClient.invalidateQueries({
        queryKey: ['summary', groupId],
        // Partial match: invalidates ['summary', groupId, <any month>]
      });

      // Invalidate monthly attendance queries (used by MemberDetailPage)
      queryClient.invalidateQueries({
        queryKey: ['attendance', groupId, 'month'],
      });
    },
  });
}
