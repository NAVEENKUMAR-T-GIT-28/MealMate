import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendance';
import { queryKeys } from './queryKeys';

/**
 * Fetches attendance for a specific group + single date.
 * Attendance changes frequently (current user actions) — 1 min staleTime.
 * Optimistic updates handle immediate UI feedback.
 */
export function useAttendanceQuery(groupId, date) {
  return useQuery({
    queryKey: queryKeys.attendance(groupId, date),
    queryFn: () => attendanceApi.getAttendanceForDate(groupId, date),
    staleTime: 1 * 60 * 1000,
    enabled: !!groupId && !!date,
  });
}

/**
 * Fetches attendance for a specific group + full month, optionally filtered by member.
 * Used by MemberDetailPage for the day-by-day calendar view.
 */
export function useAttendanceMonthQuery(groupId, month, memberId) {
  return useQuery({
    queryKey: queryKeys.attendanceMonth(groupId, month, memberId),
    queryFn: () => attendanceApi.getAttendanceForMonth(groupId, month, memberId),
    staleTime: 1 * 60 * 1000,
    enabled: !!groupId && !!month,
  });
}
