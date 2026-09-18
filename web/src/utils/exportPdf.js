import { format, parseISO } from 'date-fns';
import { fetchExportData } from './reportDataHelpers';

export async function exportToPdf(groupId, monthStr) {
  try {
    const { summary, memberDetailsMap, prices } = await fetchExportData(groupId, monthStr);
    const monthFormatted = format(parseISO(`${monthStr}-01`), 'MMMM yyyy');

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
        <img src="${window.location.origin}/favicon.png" class="report-logo" alt="MealMate Logo" onerror="this.style.display='none'" />
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

    for (const member of summary.members) {
      html += `
        <tr>
          <td class="text-left">${member.memberName}</td>
          <td>${member.morningCount}</td>
          <td>${member.afternoonCount}</td>
          <td>${member.nightCount}</td>
          <td class="text-right">₹${member.totalCost}</td>
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
    for (const member of summary.members) {
      const details = memberDetailsMap[member.memberId];
      if (!details) continue;

      const firstDays = details.days.slice(0, 14);
      const secondDays = details.days.slice(14);

      // --- MEMBER PAGE 1 (Days 1-15) ---
      html += `<div class="page-break"></div>`;
      html += `
        <div class="member-header">
          <div class="title">MEALMATE</div>
          <div class="subtitle" style="text-transform: uppercase; margin-top: 10px; font-weight: bold; color: #000;">${details.member.name}</div>
          <div style="margin-top: 5px;">${monthFormatted}</div>
        </div>

        <div class="section-title">MEAL SUMMARY</div>
        <table>
          <tr><th class="text-left">Meal Type</th><th>Count</th></tr>
          <tr><td class="text-left">Morning</td><td>${details.morningCount}</td></tr>
          <tr><td class="text-left">Afternoon</td><td>${details.afternoonCount}</td></tr>
          <tr><td class="text-left">Night</td><td>${details.nightCount}</td></tr>
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

      // --- MEMBER PAGE 2 (Days 16-End) ---
      if (secondDays.length > 0) {
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
      }

      html += `
          <tr class="grand-total-row">
            <td class="text-left" colspan="4">MONTHLY TOTAL</td>
            <td class="text-right">₹${details.grandTotal}</td>
          </tr>
        </table>
      `;
    }

    html += `
      </body>
      </html>
    `;

    // Only web branch execution
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

  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}
