import { getMonthlySummary } from '@/api/summary';
import { getAttendance } from '@/api/attendance';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Platform } from 'react-native';

export async function exportToExcel(
  groupId: number, 
  monthStr: string, 
  currentPrices: { morning: number; afternoon: number; night: number }
) {
  try {
    const summary = await getMonthlySummary(groupId, monthStr);
    const allAttendance = await getAttendance(groupId, undefined, monthStr);
    const monthFormatted = format(parseISO(`${monthStr}-01`), 'MMMM yyyy');

    const XLSX = require('xlsx');

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // --------------------------------------------------------
    // SHEET 1: MONTHLY REPORT
    // --------------------------------------------------------
    const monthlyWsData: any[][] = [];
    monthlyWsData.push([`MealMate Report for ${monthFormatted}`]);
    monthlyWsData.push([]);

    const prices = currentPrices;

    monthlyWsData.push(['Meal Type', 'Amount']);
    monthlyWsData.push(['Morning', `₹${prices.morning}`]);
    monthlyWsData.push(['Afternoon', `₹${prices.afternoon}`]);
    monthlyWsData.push(['Night', `₹${prices.night}`]);
    monthlyWsData.push(['Total', `₹${prices.morning + prices.afternoon + prices.night}`]);
    monthlyWsData.push([]);

    monthlyWsData.push(['Name', 'Morning', 'Afternoon', 'Night', 'Total']);
    for (const member of summary.members as any[]) {
      monthlyWsData.push([
        member.full_name || member.member_name,
        member.morning_count ?? member.total_morning ?? 0,
        member.afternoon_count ?? member.total_afternoon ?? 0,
        member.night_count ?? member.total_night ?? 0,
        `₹${member.total_cost || 0}`
      ]);
    }
    monthlyWsData.push([]);
    monthlyWsData.push(['Grand Total', '', '', '', `₹${summary.grandTotal}`]);

    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyWsData);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Report');

    // --------------------------------------------------------
    // SHEETS 2 to N+1: INDIVIDUAL MEMBERS
    // --------------------------------------------------------
    const start = startOfMonth(parseISO(`${monthStr}-01`));
    const end = endOfMonth(start);
    const monthDaysStr = eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));

    for (const member of summary.members as any[]) {
      const memberId = member.user_id || member.member_id;
      const memberName = member.full_name || member.member_name;
      const memberAttendance = allAttendance.filter((a: any) => a.user_id === memberId);

      const memberWsData: any[][] = [];
      memberWsData.push(['MealMate']);
      memberWsData.push([memberName]);
      memberWsData.push([monthFormatted]);
      memberWsData.push([]);

      memberWsData.push(['Meal Type', 'Count']);
      memberWsData.push(['Morning', member.morning_count ?? member.total_morning ?? 0]);
      memberWsData.push(['Afternoon', member.afternoon_count ?? member.total_afternoon ?? 0]);
      memberWsData.push(['Night', member.night_count ?? member.total_night ?? 0]);
      memberWsData.push([]);

      memberWsData.push(['Date', 'Morning', 'Afternoon', 'Night', 'Total']);

      for (const dateStr of monthDaysStr) {
        const att = memberAttendance.find((a: any) => a.date === dateStr);
        const morning = !!att?.morning;
        const afternoon = !!att?.afternoon;
        const night = !!att?.night;
        
        // Use historical price if available, otherwise current prices as fallback
        const mPrice = (att as any)?.prices?.morning ?? prices.morning;
        const aPrice = (att as any)?.prices?.afternoon ?? prices.afternoon;
        const nPrice = (att as any)?.prices?.night ?? prices.night;
        
        let dayTotal = 0;
        if (morning) dayTotal += Number(mPrice);
        if (afternoon) dayTotal += Number(aPrice);
        if (night) dayTotal += Number(nPrice);

        const dateFormatted = format(parseISO(dateStr), 'dd/MM/yyyy');
        memberWsData.push([
          dateFormatted,
          morning ? '✓' : '✕',
          afternoon ? '✓' : '✕',
          night ? '✓' : '✕',
          `₹${dayTotal}`
        ]);
      }

      memberWsData.push([]);
      memberWsData.push(['Monthly Total', '', '', '', `₹${member.total_cost || 0}`]);

      const wsMember = XLSX.utils.aoa_to_sheet(memberWsData);

      // Sheet names max 31 chars
      let safeSheetName = memberName.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, wsMember, safeSheetName);
    }

    const filename = `MealMate_${monthStr}.xlsx`;

    if (Platform.OS === 'web') {
      XLSX.writeFile(wb, filename);
    } else {
      // Generate Base64 for native
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const FileSystem = require('expo-file-system/legacy');
      const Sharing = require('expo-sharing');

      // @ts-ignore - cacheDirectory might be missing from TS types in newer expo versions
      const cacheDir = FileSystem.cacheDirectory;
      const filepath = `${cacheDir}${filename}`;

      await FileSystem.writeAsStringAsync(filepath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filepath);
      }
    }

  } catch (error) {
    console.error('Failed to export Excel:', error);
    throw error;
  }
}
