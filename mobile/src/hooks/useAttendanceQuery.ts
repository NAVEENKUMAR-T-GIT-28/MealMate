import { useQuery } from '@tanstack/react-query';
import { getAttendance, AttendanceRecord } from '../api/attendance';
import { queryKeys } from '../query/queryKeys';

export function useAttendanceQuery(groupId: number | null | undefined, date: string, enabled: boolean = true) {
  return useQuery<AttendanceRecord[]>({
    queryKey: queryKeys.attendance(groupId ?? 0, date),
    queryFn: () => getAttendance(groupId!, date),
    enabled: enabled && !!groupId && !!date,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAttendanceMonthQuery(
  groupId: number | null | undefined,
  month: string,
  userId?: number | string
) {
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'month', groupId, month],
    queryFn: async () => {
      if (!groupId) return [];
      const data = await getAttendance(groupId, undefined, month);
      // If a userId is provided, filter the results for that specific user.
      if (userId) {
        return data.filter((record) => String(record.user_id) === String(userId));
      }
      return data;
    },
    enabled: !!groupId && !!month,
  });
}
