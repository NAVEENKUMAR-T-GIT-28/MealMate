import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { toggleAttendance, ToggleAttendancePayload, AttendanceRecord } from '../api/attendance';
import { queryKeys } from '../query/queryKeys';

interface MutationContext {
  previousAttendance: AttendanceRecord[] | undefined;
}

export function useToggleAttendanceMutation(currentUserId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation<any, Error, ToggleAttendancePayload, MutationContext>({
    mutationFn: toggleAttendance,

    onMutate: async (variables) => {
      const { group_id, date, meal_type } = variables;
      const key = queryKeys.attendance(group_id, date);

      // 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: key });

      // 2. Snapshot the previous value
      const previousAttendance = queryClient.getQueryData<AttendanceRecord[]>(key);

      // 3. Optimistically update the cache
      if (previousAttendance && currentUserId) {
        queryClient.setQueryData<AttendanceRecord[]>(key, (old) => {
          if (!old) return old;
          const userIndex = old.findIndex((item) => item.user_id === currentUserId);

          if (userIndex !== -1) {
            // Update existing user attendance record
            return old.map((record, index) => {
              if (index === userIndex) {
                return {
                  ...record,
                  [meal_type]: !record[meal_type],
                };
              }
              return record;
            });
          } else {
            // Create optimistic record if none exists for today yet
            const newRecord: AttendanceRecord = {
              date,
              morning: meal_type === 'morning',
              afternoon: meal_type === 'afternoon',
              night: meal_type === 'night',
              user_id: currentUserId,
              member_name: 'You',
            };
            return [...old, newRecord];
          }
        });
      }

      // Return context with snapshot
      return { previousAttendance };
    },

    onError: (err, variables, context) => {
      // Rollback to previous attendance cache snapshot
      if (context?.previousAttendance) {
        const key = queryKeys.attendance(variables.group_id, variables.date);
        queryClient.setQueryData(key, context.previousAttendance);
      }
      Alert.alert('Update Failed', 'Failed to update attendance. Please try again.');
    },

    onSettled: (_data, _error, variables) => {
      // Synchronize affected attendance query with server
      const key = queryKeys.attendance(variables.group_id, variables.date);
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
