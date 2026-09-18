CREATE OR REPLACE FUNCTION get_monthly_summary(p_group_id INT, p_month TEXT)
RETURNS TABLE (
  user_id INT,
  full_name TEXT,
  morning_count INT,
  afternoon_count INT,
  night_count INT,
  morning_cost NUMERIC,
  afternoon_cost NUMERIC,
  night_cost NUMERIC,
  total_cost NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH month_entries AS (
    SELECT * FROM attendance 
    WHERE group_id = p_group_id 
      -- Correctly safely bounds the month from the 1st to the end of the month
      AND date >= (p_month || '-01')::DATE 
      AND date < ((p_month || '-01')::DATE + INTERVAL '1 month')
  ),
  cost_calc AS (
    SELECT 
      e.user_id,
      e.date,
      e.morning,
      e.afternoon,
      e.night,
      (
        SELECT price FROM meal_prices 
        WHERE group_id = e.group_id AND meal_type = 'morning' AND effective_from <= e.date 
        ORDER BY effective_from DESC LIMIT 1
      ) as m_price,
      (
        SELECT price FROM meal_prices 
        WHERE group_id = e.group_id AND meal_type = 'afternoon' AND effective_from <= e.date 
        ORDER BY effective_from DESC LIMIT 1
      ) as a_price,
      (
        SELECT price FROM meal_prices 
        WHERE group_id = e.group_id AND meal_type = 'night' AND effective_from <= e.date 
        ORDER BY effective_from DESC LIMIT 1
      ) as n_price
    FROM month_entries e
  )
  SELECT 
    u.id as user_id,
    u.full_name::text,
    COALESCE(SUM(CASE WHEN c.morning THEN 1 ELSE 0 END), 0)::int as morning_count,
    COALESCE(SUM(CASE WHEN c.afternoon THEN 1 ELSE 0 END), 0)::int as afternoon_count,
    COALESCE(SUM(CASE WHEN c.night THEN 1 ELSE 0 END), 0)::int as night_count,
    COALESCE(SUM(CASE WHEN c.morning THEN c.m_price ELSE 0 END), 0)::numeric as morning_cost,
    COALESCE(SUM(CASE WHEN c.afternoon THEN c.a_price ELSE 0 END), 0)::numeric as afternoon_cost,
    COALESCE(SUM(CASE WHEN c.night THEN c.n_price ELSE 0 END), 0)::numeric as night_cost,
    COALESCE(SUM(
      (CASE WHEN c.morning THEN c.m_price ELSE 0 END) +
      (CASE WHEN c.afternoon THEN c.a_price ELSE 0 END) +
      (CASE WHEN c.night THEN c.n_price ELSE 0 END)
    ), 0)::numeric as total_cost
  FROM group_members gm
  JOIN users u ON gm.user_id = u.id
  LEFT JOIN cost_calc c ON c.user_id = gm.user_id
  WHERE gm.group_id = p_group_id AND gm.is_active = true AND gm.role != 'pending'
  GROUP BY u.id, u.full_name
  ORDER BY u.full_name ASC;
END;
$$ LANGUAGE plpgsql;
