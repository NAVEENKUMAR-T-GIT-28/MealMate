-- 002_stored_procedures.sql

-- 1. RPC: Get Monthly Summary
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


-- 2. RPC: Toggle Attendance
CREATE OR REPLACE FUNCTION toggle_attendance(
  p_group_id INT,
  p_user_id INT,
  p_date DATE,
  p_meal_type TEXT
) RETURNS setof attendance AS $$
BEGIN
  RETURN QUERY
  INSERT INTO attendance (group_id, user_id, date, morning, afternoon, night, updated_at)
  VALUES (
    p_group_id, 
    p_user_id, 
    p_date, 
    (p_meal_type = 'morning'), 
    (p_meal_type = 'afternoon'), 
    (p_meal_type = 'night'),
    NOW()
  )
  ON CONFLICT (group_id, user_id, date) DO UPDATE SET
    morning = CASE WHEN p_meal_type = 'morning' THEN NOT attendance.morning ELSE attendance.morning END,
    afternoon = CASE WHEN p_meal_type = 'afternoon' THEN NOT attendance.afternoon ELSE attendance.afternoon END,
    night = CASE WHEN p_meal_type = 'night' THEN NOT attendance.night ELSE attendance.night END,
    updated_at = NOW()
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
