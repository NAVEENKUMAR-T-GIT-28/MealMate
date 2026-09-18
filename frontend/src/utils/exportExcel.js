import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { fetchExportData } from './reportDataHelpers';

export async function exportToExcel(groupId, monthStr) {
  try {
    const { summary, memberDetailsMap, prices } = await fetchExportData(groupId, monthStr);
    const monthFormatted = format(parseISO(`${monthStr}-01`), 'MMMM yyyy');

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // --------------------------------------------------------
    // SHEET 1: MONTHLY REPORT
    // --------------------------------------------------------
    const monthlyWsData = [];
    monthlyWsData.push([`MealMate Report for ${monthFormatted}`]);
    monthlyWsData.push([]);

    monthlyWsData.push(['Meal Type', 'Amount']);
    monthlyWsData.push(['Morning', `₹${prices.morning}`]);
    monthlyWsData.push(['Afternoon', `₹${prices.afternoon}`]);
    monthlyWsData.push(['Night', `₹${prices.night}`]);
    monthlyWsData.push(['Total', `₹${prices.morning + prices.afternoon + prices.night}`]);
    monthlyWsData.push([]);

    monthlyWsData.push(['Name', 'Morning', 'Afternoon', 'Night', 'Total']);
    for (const member of summary.members) {
      monthlyWsData.push([
        member.memberName,
        member.morningCount,
        member.afternoonCount,
        member.nightCount,
        `₹${member.totalCost}`
      ]);
    }
    monthlyWsData.push([]);
    monthlyWsData.push(['Grand Total', '', '', '', `₹${summary.grandTotal}`]);

    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyWsData);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Report');

    // --------------------------------------------------------
    // SHEETS 2 to N+1: INDIVIDUAL MEMBERS
    // --------------------------------------------------------
    for (const member of summary.members) {
      const details = memberDetailsMap[member.memberId];
      if (!details) continue;

      const memberWsData = [];
      memberWsData.push(['MealMate']);
      memberWsData.push([details.member.name]);
      memberWsData.push([monthFormatted]);
      memberWsData.push([]);

      memberWsData.push(['Meal Type', 'Count']);
      memberWsData.push(['Morning', details.morningCount]);
      memberWsData.push(['Afternoon', details.afternoonCount]);
      memberWsData.push(['Night', details.nightCount]);
      memberWsData.push([]);

      memberWsData.push(['Date', 'Morning', 'Afternoon', 'Night', 'Total']);

      for (const day of details.days) {
        const dateFormatted = format(parseISO(day.date), 'dd/MM/yyyy');
        memberWsData.push([
          dateFormatted,
          day.morning ? '✓' : '✕',
          day.afternoon ? '✓' : '✕',
          day.night ? '✓' : '✕',
          `₹${day.dayTotal}`
        ]);
      }

      memberWsData.push([]);
      memberWsData.push(['Monthly Total', '', '', '', `₹${details.grandTotal}`]);

      const wsMember = XLSX.utils.aoa_to_sheet(memberWsData);

      // Sheet names max 31 chars
      let safeSheetName = details.member.name.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, wsMember, safeSheetName);
    }

    const filename = `MealMate_${monthStr}.xlsx`;

    // Only web branch execution
    XLSX.writeFile(wb, filename);

  } catch (error) {
    console.error('Failed to export Excel:', error);
    throw error;
  }
}
