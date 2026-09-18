import { summaryApi } from '../api/summary';
import { attendanceApi } from '../api/attendance';
import { pricesApi } from '../api/prices';

export async function fetchExportData(groupId, monthStr) {
  const [summaryRes, attendanceRes, pricesHistory] = await Promise.all([
    summaryApi.getSummary(groupId, monthStr),
    attendanceApi.getAttendanceForMonth(groupId, monthStr),
    pricesApi.getPrices(groupId)
  ]);

  // Calculate effective prices for the month
  const monthEndStr = `${monthStr}-31`;
  const prices = { morning: 0, afternoon: 0, night: 0 };
  const monthEndObj = new Date(monthEndStr);
  
  if (pricesHistory) {
    for (const mealType of ['morning', 'afternoon', 'night']) {
      const history = pricesHistory.filter(p => p.meal_type === mealType && new Date(p.effective_from) <= monthEndObj);
      if (history.length > 0) {
        prices[mealType] = history[0].price;
      }
    }
  }

  // Helper to get exact price on a specific date
  const getPriceOnDate = (type, dateStr) => {
    if (!pricesHistory) return 0;
    const targetDate = new Date(dateStr);
    const valid = pricesHistory.find(p => p.meal_type === type && new Date(p.effective_from) <= targetDate);
    return valid ? valid.price : 0;
  };

  // Map summary.members to V1 format expected by the export scripts
  const mappedMembers = (summaryRes.members || []).map(m => ({
    memberId: m.user_id || m.member_id,
    memberName: m.full_name || m.member_name,
    morningCount: parseInt(m.morning_count || 0),
    afternoonCount: parseInt(m.afternoon_count || 0),
    nightCount: parseInt(m.night_count || 0),
    totalCost: parseFloat(m.total_cost || 0)
  }));

  const summary = {
    members: mappedMembers,
    grandTotal: parseFloat(summaryRes.grandTotal || 0)
  };

  // Group attendance by member
  const attendanceByMember = {};
  if (attendanceRes && attendanceRes.length > 0) {
    attendanceRes.forEach(record => {
      const uId = record.user_id;
      if (!attendanceByMember[uId]) {
        attendanceByMember[uId] = {
          member: { name: record.member_name },
          days: []
        };
      }
      
      const m = record.morning;
      const a = record.afternoon;
      const n = record.night;
      const mPrice = getPriceOnDate('morning', record.date);
      const aPrice = getPriceOnDate('afternoon', record.date);
      const nPrice = getPriceOnDate('night', record.date);
      const dayTotal = (m ? mPrice : 0) + (a ? aPrice : 0) + (n ? nPrice : 0);
      
      attendanceByMember[uId].days.push({
        date: record.date,
        morning: m,
        afternoon: a,
        night: n,
        dayTotal
      });
    });
  }

  // Create member details map
  const memberDetailsMap = {};
  for (const m of mappedMembers) {
    const att = attendanceByMember[m.memberId] || { days: [], member: { name: m.memberName } };
    
    // Sort days chronologically
    att.days.sort((a, b) => a.date.localeCompare(b.date));

    memberDetailsMap[m.memberId] = {
      member: att.member,
      prices: prices,
      morningCount: m.morningCount,
      afternoonCount: m.afternoonCount,
      nightCount: m.nightCount,
      grandTotal: m.totalCost,
      days: att.days
    };
  }

  return { summary, memberDetailsMap, prices };
}
