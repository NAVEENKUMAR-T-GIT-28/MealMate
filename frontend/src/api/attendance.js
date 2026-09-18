import client from './client';

export const attendanceApi = {
  getAttendanceForMonth: async (groupId, month, memberId) => {
    let url = `/attendance?group_id=${groupId}&month=${month}`;
    if (memberId) {
      url += `&member_id=${memberId}`;
    }
    const response = await client.get(url);
    return response.data;
  },
  getAttendanceForDate: async (groupId, date) => {
    const response = await client.get(`/attendance?group_id=${groupId}&date=${date}`);
    return response.data;
  },
  toggleMeal: async (groupId, date, mealType) => {
    const response = await client.put('/attendance/toggle', {
      group_id: groupId,
      date,
      meal_type: mealType
    });
    return response.data;
  }
};
