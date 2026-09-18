import jwt from 'jsonwebtoken';
import supabase from '../config/db.js';

// 1. Authenticate User
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// 2. Ensure User is a Member of the Group
export const requireGroupMember = async (req, res, next) => {
  const groupId = req.params?.groupId || req.body?.group_id || req.query?.group_id;
  if (!groupId) {
    return res.status(400).json({ error: 'Bad Request: Group ID missing' });
  }

  try {
    const { data: member, error } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .single();

    if (error || !member) {
      return res.status(403).json({ error: 'Forbidden: You are not an active member of this group' });
    }

    req.membership = { groupId, role: member.role };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error checking membership' });
  }
};

// 3. Ensure User is an Admin of the Group
export const requireGroupAdmin = (req, res, next) => {
  if (req.membership.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};
