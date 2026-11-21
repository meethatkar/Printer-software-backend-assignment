/**
-- ==============================================================================
-- NOTIFICATIONS TABLE MODEL & QUERIES
-- Table 9: notifications (Logs order updates, proof status alerts, and completion alerts:
-- id, user_id, order_id, event_type, subject, message, is_read, sent_at)
-- ==============================================================================
*/

import { getSupabaseAdmin } from '../configs/supabase';
import { Notification, NotificationInsert, NotificationUpdate } from '../types/database.types';

export const NOTIFICATIONS_TABLE = 'notifications';

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false });

  if (error || !data) {
    console.error('[Notifications Table] Error fetching notifications:', error);
    return [];
  }
  return data as Notification[];
}

export async function createNotification(notification: NotificationInsert): Promise<Notification | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .insert(notification)
    .select()
    .single();

  if (error) {
    console.error('[Notifications Table] Error creating notification:', error);
    return null;
  }
  return data as Notification;
}

export async function markNotificationAsRead(id: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', userId);

  return !error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .update({ is_read: true })
    .eq('user_id', userId);

  return !error;
}

