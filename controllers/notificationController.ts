/**
-- ==============================================================================
-- NOTIFICATIONS CONTROLLER (EXPRESS NATIVE)
-- Methods: listMyNotifications, markAsRead, markAllAsRead
-- ==============================================================================
*/

import { Request, Response } from 'express';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../tables/notifications';

export async function listMyNotifications(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const notifications = await getUserNotifications(userId);
  res.status(200).json({ success: true, data: notifications });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const notificationId = req.params.id as string;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const success = await markNotificationAsRead(notificationId, userId);
  if (!success) {
    res.status(500).json({ success: false, error: 'Failed to update notification' });
    return;
  }

  res.status(200).json({ success: true, data: { updated: true } });
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const success = await markAllNotificationsAsRead(userId);
  if (!success) {
    res.status(500).json({ success: false, error: 'Failed to update notifications' });
    return;
  }

  res.status(200).json({ success: true, data: { updated: true } });
}
