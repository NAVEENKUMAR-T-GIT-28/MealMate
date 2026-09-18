import { ChevronRight } from 'lucide-react';
import './SummaryTable.css';

export default function SummaryTable({ members, grandTotal, onMemberPress }) {
  return (
    <div className="summary-table-wrapper">
      <table className="summary-table">
        <thead>
          <tr>
            <th className="col-name">Member</th>
            <th className="col-num morning-col">☀️ M</th>
            <th className="col-num afternoon-col">🌤️ A</th>
            <th className="col-num night-col">🌙 N</th>
            <th className="col-total">Total ₹</th>
            <th className="col-chevron"></th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr
              key={m.user_id}
              className={`summary-row ${i % 2 === 0 ? 'even' : 'odd'}`}
              onClick={() => onMemberPress?.(m.user_id)}
              role="button"
              tabIndex={0}
            >
              <td className="col-name">{m.full_name}</td>
              <td className="col-num">{m.morning_count}</td>
              <td className="col-num">{m.afternoon_count}</td>
              <td className="col-num">{m.night_count}</td>
              <td className="col-total total-value">₹{Number(m.total_cost || 0).toLocaleString()}</td>
              <td className="col-chevron">
                <ChevronRight size={16} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="grand-total-row">
            <td className="col-name grand-total-text">Grand Total</td>
            <td className="col-num"></td>
            <td className="col-num"></td>
            <td className="col-num"></td>
            <td className="col-total grand-total-text">₹{grandTotal.toLocaleString()}</td>
            <td className="col-chevron"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
