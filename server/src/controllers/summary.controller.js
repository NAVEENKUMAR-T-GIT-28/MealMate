import supabase from '../config/db.js';

export const getMonthlySummary = async (req, res) => {
  const { month } = req.params; // format: 'YYYY-MM'
  const groupId = parseInt(req.query.group_id, 10);

  try {
    // Because the logic requires complex LATERAL JOINS and subqueries to get date-effective prices,
    // we call a custom Postgres RPC function on the Supabase database.
    const { data: members, error } = await supabase
      .rpc('get_monthly_summary', { 
        p_group_id: groupId, 
        p_month: month 
      });

    if (error) throw error;

    const grandTotal = members.reduce((sum, row) => sum + parseFloat(row.total_cost || 0), 0);

    res.json({
      month,
      members,
      grandTotal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error generating summary' });
  }
};
