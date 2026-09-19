export const queryKeys = {
  groups: ['groups'],
  members: (groupId: string | number) => ['members', groupId],
  prices: (groupId: string | number) => ['prices', groupId],
  attendance: (groupId: string | number, date: string) => ['attendance', groupId, date],
  summary: (groupId: string | number, month?: string) => month ? ['summary', groupId, month] : ['summary', groupId],
};
