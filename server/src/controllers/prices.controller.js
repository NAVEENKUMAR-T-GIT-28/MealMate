import supabase from '../config/db.js';

export const getPrices = async (req, res) => {
  const { group_id } = req.query;

  try {
    const { data, error } = await supabase
      .from('meal_prices')
      .select('*')
      .eq('group_id', group_id)
      .order('effective_from', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching prices' });
  }
};

export const addPrice = async (req, res) => {
  const { group_id, meal_type, price, effective_from } = req.body;
  
  if (!['morning', 'afternoon', 'night'].includes(meal_type)) {
    return res.status(400).json({ error: 'Invalid meal type' });
  }

  try {
    const { data, error } = await supabase
      .from('meal_prices')
      .insert([
        { group_id, meal_type, price, effective_from, created_by: req.user.id }
      ])
      .select('*')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error adding price' });
  }
};
