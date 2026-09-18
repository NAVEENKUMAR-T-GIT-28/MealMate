import supabase from '../config/db.js';
import { generateInviteCode } from '../utils/inviteCode.js';

export const createGroup = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  if (!name) return res.status(400).json({ error: 'Group name is required' });

  try {
    let inviteCode;
    let codeExists = true;
    while (codeExists) {
      inviteCode = generateInviteCode();
      const { data } = await supabase.from('groups').select('id').eq('invite_code', inviteCode);
      if (!data || data.length === 0) codeExists = false;
    }

    // Insert group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert([{ name, invite_code: inviteCode, created_by: userId }])
      .select('*')
      .single();

    if (groupError) throw groupError;

    // Add creator as admin
    const { error: memberError } = await supabase
      .from('group_members')
      .insert([{ group_id: group.id, user_id: userId, role: 'admin' }]);

    if (memberError) throw memberError;

    // Initial default prices for the new group
    const today = new Date().toISOString().split('T')[0];
    const { error: pricesError } = await supabase
      .from('meal_prices')
      .insert([
        { group_id: group.id, meal_type: 'morning', price: 0, effective_from: today, created_by: userId },
        { group_id: group.id, meal_type: 'afternoon', price: 0, effective_from: today, created_by: userId },
        { group_id: group.id, meal_type: 'night', price: 0, effective_from: today, created_by: userId }
      ]);

    if (pricesError) throw pricesError;

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating group' });
  }
};

export const joinGroup = async (req, res) => {
  const { invite_code } = req.body;
  const userId = req.user.id;

  if (!invite_code) return res.status(400).json({ error: 'Invite code is required' });

  try {
    const { data: group } = await supabase
      .from('groups')
      .select('id, name')
      .eq('invite_code', invite_code.toUpperCase())
      .single();

    if (!group) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const { data: memberCheck } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId);

    if (memberCheck && memberCheck.length > 0) {
      return res.status(400).json({ error: 'You are already a member of this group' });
    }

    const { error: insertError } = await supabase
      .from('group_members')
      .insert([{ group_id: group.id, user_id: userId, role: 'member' }]);

    if (insertError) throw insertError;

    res.json({ message: 'Successfully joined group', group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error joining group' });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    // Supabase JS doesn't easily do standard inner joins returning flat arrays without nested objects.
    // But since it's PostgREST, we can query groups and embed group_members, filtering where group_members has our user.
    // However, it's easier to query group_members where user_id = us, and select the embedded group data.
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        role,
        groups ( id, name, invite_code, created_at )
      `)
      .eq('user_id', req.user.id)
      .eq('is_active', true);

    if (error) throw error;

    // Flatten it for the frontend
    const groups = data.map(gm => ({
      id: gm.groups.id,
      name: gm.groups.name,
      invite_code: gm.groups.invite_code,
      created_at: gm.groups.created_at,
      role: gm.role
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching groups' });
  }
};

export const getGroupMembers = async (req, res) => {
  const groupId = req.params.groupId;
  try {
    // Similarly, query group_members and embed user data
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        role, is_active, joined_at,
        users ( id, full_name )
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;

    const members = data.map(gm => ({
      user_id: gm.users.id,
      name: gm.users.full_name,
      role: gm.role,
      is_active: gm.is_active,
      joined_at: gm.joined_at
    }));

    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching members' });
  }
};
