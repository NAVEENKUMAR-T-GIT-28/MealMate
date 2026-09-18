import supabase from '../config/db.js';

export const getAttendance = async (req, res) => {
  const { group_id, date, month, member_id } = req.query;

  try {
    let query = supabase
      .from('attendance')
      .select(`
        date, morning, afternoon, night, user_id,
        users ( full_name )
      `)
      .eq('group_id', group_id)
      .order('date', { ascending: true });

    if (member_id) {
      query = query.eq('user_id', member_id);
    }

    if (date) {
      query = query.eq('date', date);
    } else if (month) {
      const [year, monthNum] = month.split('-');
      const start = `${month}-01`;
      // Get the accurate last day of the month
      const lastDay = new Date(year, monthNum, 0).getDate();
      const end = `${month}-${lastDay}`;
      
      query = query.gte('date', start).lte('date', end);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted = data.map(record => ({
      date: record.date,
      morning: record.morning,
      afternoon: record.afternoon,
      night: record.night,
      user_id: record.user_id,
      member_name: record.users.full_name
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching attendance' });
  }
};

export const toggleAttendance = async (req, res) => {
  const { group_id, date, meal_type } = req.body;
  const effectiveUserId = req.user.id;
  
  if (!['morning', 'afternoon', 'night'].includes(meal_type)) {
    return res.status(400).json({ error: 'Invalid meal type' });
  }

  try {
    const { data: result, error } = await supabase.rpc('toggle_attendance', {
      p_group_id: group_id,
      p_user_id: effectiveUserId,
      p_date: date,
      p_meal_type: meal_type
    });

    if (error) {
      console.error('RPC Error:', error);
      throw error;
    }

    // The RPC returns a setof attendance, we want the first (and only) row
    res.json(result[0] || result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating attendance' });
  }
};
