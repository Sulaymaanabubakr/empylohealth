import { supabase } from '../supabase/supabaseClient';

const randomChannel = (prefix, id) => `${prefix}-${id}-${Math.random().toString(36).slice(2, 8)}`;

const normalizePlannerItem = (row) => ({
  id: row.id,
  userId: row.user_id,
  title: row.title || '',
  itemType: row.item_type || 'task',
  scheduledFor: row.scheduled_for,
  allDay: row.all_day === true,
  status: row.status || 'pending',
  notes: row.notes || '',
  metadata: row.metadata || {},
  completedAt: row.completed_at || null,
  createdAt: row.created_at || null,
  updatedAt: row.updated_at || null,
});

const loadPlannerItems = async (uid) => {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 30);

  const { data, error } = await supabase
    .from('planner_items')
    .select('*')
    .eq('user_id', uid)
    .gte('scheduled_for', windowStart.toISOString())
    .order('scheduled_for', { ascending: true });

  if (error) throw error;
  return (data || []).map(normalizePlannerItem);
};

export const plannerService = {
  async list(uid) {
    if (!uid) return [];
    return loadPlannerItems(uid);
  },

  async createItem({ userId, title, itemType = 'task', scheduledFor, allDay = false, notes = '', metadata = {} }) {
    const payload = {
      user_id: userId,
      title: String(title || '').trim(),
      item_type: itemType,
      scheduled_for: scheduledFor,
      all_day: !!allDay,
      notes: String(notes || '').trim(),
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    };

    const { data, error } = await supabase
      .from('planner_items')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return normalizePlannerItem(data);
  },

  async toggleDone(itemId, done) {
    const { data, error } = await supabase
      .from('planner_items')
      .update({
        status: done ? 'done' : 'pending',
        completed_at: done ? new Date().toISOString() : null,
      })
      .eq('id', itemId)
      .select('*')
      .single();

    if (error) throw error;
    return normalizePlannerItem(data);
  },

  async deleteItem(itemId) {
    const { error } = await supabase
      .from('planner_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return true;
  },

  subscribe(uid, callback, onError) {
    let active = true;

    const run = async () => {
      try {
        const items = await loadPlannerItems(uid);
        if (active) callback(items);
      } catch (error) {
        if (active) onError?.(error);
      }
    };

    run();

    const channel = supabase
      .channel(randomChannel('planner-items', uid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planner_items', filter: `user_id=eq.${uid}` }, run)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel).catch(() => {});
    };
  },
};
