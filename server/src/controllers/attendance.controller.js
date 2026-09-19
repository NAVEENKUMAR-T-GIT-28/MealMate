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
    // 1. Check if an attendance record already exists for this user, group, and date
    const { data: existing, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('group_id', group_id)
      .eq('user_id', effectiveUserId)
      .eq('date', date)
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch Error:', fetchError);
      throw fetchError;
    }

    let result;

    if (existing) {
      // 2. If it exists, toggle the specific meal type boolean
      const updatedValue = !existing[meal_type];
      
      const { data: updated, error: updateError } = await supabase
        .from('attendance')
        .update({ 
          [meal_type]: updatedValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      result = updated;
    } else {
      // 3. If it doesn't exist, insert a new record
      const { data: inserted, error: insertError } = await supabase
        .from('attendance')
        .insert([{
          group_id,
          user_id: effectiveUserId,
          date,
          morning: meal_type === 'morning',
          afternoon: meal_type === 'afternoon',
          night: meal_type === 'night'
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      result = inserted;
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating attendance' });
  }
};
