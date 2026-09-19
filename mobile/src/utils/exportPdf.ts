import { getMonthlySummary } from '@/api/summary';
import { getAttendance } from '@/api/attendance';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';

export async function exportToPdf(
  groupId: number, 
  monthStr: string, 
  currentPrices: { morning: number; afternoon: number; night: number }
) {
  try {
    const summary = await getMonthlySummary(groupId, monthStr);
    const allAttendance = await getAttendance(groupId, undefined, monthStr);
    const monthFormatted = format(parseISO(`${monthStr}-01`), 'MMMM yyyy');

    const prices = currentPrices;

    let logoHtml = '';
    try {
      const asset = Asset.fromModule(require('../../assets/images/favicon.png'));
      await asset.downloadAsync();

      let logoSrc = asset.uri;
      if (Platform.OS !== 'web') {
        if (asset.localUri) {
          const FileSystem = require('expo-file-system/legacy');
          const base64Logo = await FileSystem.readAsStringAsync(asset.localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          logoSrc = `data:image/png;base64,${base64Logo}`;
        } else {
          throw new Error('Local URI not available for asset');
        }
      }
      logoHtml = `<img src="${logoSrc}" class="report-logo" />`;
    } catch (e) {
      console.warn('Failed to load logo for PDF:', e);
      // Fallback: Continue without logo if it fails
    }

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #000;
            background-color: #fff;
            margin: 0;
            padding: 20px;
            font-size: 14px;
          }
          h1, h2, h3, h4 {
            color: #000;
            margin-bottom: 10px;
          }
          .report-header {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 15px;
          }
          .report-logo {
            width: 52px;
            height: 52px;
            margin-right: 15px;
            object-fit: contain;
          }
          .report-title-container {
            display: flex;
            flex-direction: column;
            text-align: left;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #000;
            line-height: 1.2;
          }
          .subtitle {
            font-size: 16px;
            color: #4CAF50; /* Green accent */
            margin-top: 2px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #e0e0e0;
            padding: 10px;
            text-align: center;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .grand-total-row th, .grand-total-row td {
            font-weight: bold;
            background-color: #e8f5e9;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .check { color: #4CAF50; font-weight: bold; }
          .cross { color: #F44336; font-weight: bold; }
          .member-header {
            text-align: center;
            margin-top: 40px;
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>
    `;

    // --------------------------------------------------------
    // PAGE 1: MONTHLY REPORT
    // --------------------------------------------------------
    html += `
      <div class="report-header">
        ${logoHtml}
        <div class="report-title-container">
          <div class="title">MealMate</div>
          <div class="subtitle">Monthly Report for ${monthFormatted}</div>
        </div>
      </div>

      <div class="section-title">MEAL PRICE SUMMARY</div>
      <table>
        <tr><th class="text-left">Meal Type</th><th class="text-right">Amount</th></tr>
        <tr><td class="text-left">Morning</td><td class="text-right">₹${prices.morning}</td></tr>
        <tr><td class="text-left">Afternoon</td><td class="text-right">₹${prices.afternoon}</td></tr>
        <tr><td class="text-left">Night</td><td class="text-right">₹${prices.night}</td></tr>
        <tr class="grand-total-row"><td class="text-left">Total</td><td class="text-right">₹${prices.morning + prices.afternoon + prices.night}</td></tr>
      </table>

      <div class="section-title">MEMBER MONTHLY SUMMARY</div>
      <table>
        <tr>
          <th class="text-left">Name</th>
          <th>Morning</th>
          <th>Afternoon</th>
          <th>Night</th>
          <th class="text-right">Total</th>
        </tr>
    `;

    for (const member of summary.members as any[]) {
      html += `
        <tr>
          <td class="text-left">${member.full_name || member.member_name}</td>
          <td>${member.morning_count ?? member.total_morning ?? 0}</td>
          <td>${member.afternoon_count ?? member.total_afternoon ?? 0}</td>
          <td>${member.night_count ?? member.total_night ?? 0}</td>
          <td class="text-right">₹${member.total_cost || 0}</td>
        </tr>
      `;
    }

    html += `
        <tr class="grand-total-row">
          <td class="text-left" colspan="4">GRAND TOTAL</td>
          <td class="text-right">₹${summary.grandTotal}</td>
        </tr>
      </table>
    `;

    // --------------------------------------------------------
    // PAGES 2 to N+1: INDIVIDUAL MEMBERS
    // --------------------------------------------------------
    const start = startOfMonth(parseISO(`${monthStr}-01`));
    const end = endOfMonth(start);
    const monthDaysStr = eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));

    for (const member of summary.members as any[]) {
      const memberId = member.user_id || member.member_id;
      const memberName = member.full_name || member.member_name;
      const memberAttendance = allAttendance.filter((a: any) => a.user_id === memberId);
      
      const memberDays = monthDaysStr.map(dateStr => {
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
        
        return { date: dateStr, morning, afternoon, night, dayTotal };
      });

      const firstDays = memberDays.slice(0, 14);
      const secondDays = memberDays.slice(14);

      // --- MEMBER PAGE 1 (Days 1-14) ---
      html += `<div class="page-break"></div>`;
      html += `
        <div class="member-header">
          <div class="title">MEALMATE</div>
          <div class="subtitle" style="text-transform: uppercase; margin-top: 10px; font-weight: bold; color: #000;">${memberName}</div>
          <div style="margin-top: 5px;">${monthFormatted}</div>
        </div>

        <div class="section-title">MEAL SUMMARY</div>
        <table>
          <tr><th class="text-left">Meal Type</th><th>Count</th></tr>
          <tr><td class="text-left">Morning</td><td>${member.morning_count ?? member.total_morning ?? 0}</td></tr>
          <tr><td class="text-left">Afternoon</td><td>${member.afternoon_count ?? member.total_afternoon ?? 0}</td></tr>
          <tr><td class="text-left">Night</td><td>${member.night_count ?? member.total_night ?? 0}</td></tr>
        </table>

        <div class="section-title">DAILY REPORT</div>
        <table>
          <tr>
            <th class="text-left">Date</th>
            <th>Morning</th>
            <th>Afternoon</th>
            <th>Night</th>
            <th class="text-right">Total</th>
          </tr>
      `;

      for (const day of firstDays) {
        const dateFormatted = format(parseISO(day.date), 'dd/MM/yyyy');
        const mSign = day.morning ? '<span class="check">✓</span>' : '<span class="cross">✕</span>';
        const aSign = day.afternoon ? '<span class="check">✓</span>' : '<span class="cross">✕</span>';
        const nSign = day.night ? '<span class="check">✓</span>' : '<span class="cross">✕</span>';

        html += `
          <tr>
            <td class="text-left">${dateFormatted}</td>
            <td>${mSign}</td>
            <td>${aSign}</td>
            <td>${nSign}</td>
            <td class="text-right">₹${day.dayTotal}</td>
          </tr>
        `;
      }

      html += `
        </table>
      `;

      // --- MEMBER PAGE 2 (Days 15-End) ---
      html += `<div class="page-break"></div>`;
      html += `
        <table>
          <tr>
            <th class="text-left">Date</th>
            <th>Morning</th>
            <th>Afternoon</th>
            <th>Night</th>
            <th class="text-right">Total</th>
          </tr>
      `;

      for (const day of secondDays) {
        const dateFormatted = format(parseISO(day.date), 'dd/MM/yyyy');
        const mSign = day.morning ? '<span class="check">✓</span>' : '<span class="cross">✕</span>';
        const aSign = day.afternoon ? '<span class="check">✓</span>' : '<span class="cross">✕</span>';
        const nSign = day.night ? '<span class="check">✓</span>' : '<span class="cross">✕</span>';

        html += `
          <tr>
            <td class="text-left">${dateFormatted}</td>
            <td>${mSign}</td>
            <td>${aSign}</td>
            <td>${nSign}</td>
            <td class="text-right">₹${day.dayTotal}</td>
          </tr>
        `;
      }

      html += `
          <tr class="grand-total-row">
            <td class="text-left" colspan="4">MONTHLY TOTAL</td>
            <td class="text-right">₹${member.total_cost || 0}</td>
          </tr>
        </table>
      `;
    }

    html += `
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        throw new Error(
          'Unable to open print window. Please allow pop-ups for MealMate.'
        );
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      console.log('PDF: starting generation');
      const Print = require('expo-print');
      const FileSystem = require('expo-file-system/legacy');
      const Sharing = require('expo-sharing');

      const { base64 } = await Print.printToFileAsync({
        html,
        base64: true
      });

      // @ts-ignore - cacheDirectory might be missing from TS types
      const cacheDir = FileSystem.cacheDirectory;
      const filename = `MealMate_Report_${monthStr}.pdf`;
      const finalUri = `${cacheDir}${filename}`;

      await FileSystem.writeAsStringAsync(finalUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('PDF: generated', finalUri);
      console.log('PDF: starting share');
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        await Sharing.shareAsync(finalUri, {
          mimeType: 'application/pdf',
          dialogTitle: filename,
          UTI: 'com.adobe.pdf'
        });
      }
    }

  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}
