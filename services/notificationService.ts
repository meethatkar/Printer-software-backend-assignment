/**
-- ==============================================================================
-- NOTIFICATION SERVICE (INTERNAL HELPER SERVICE)
-- No public route needed.
-- Called internally inside createOrder, approveProof, requestChanges, and advanceStage.
-- ==============================================================================
*/

import { createNotification } from '../tables/notifications';
import { Notification } from '../types/database.types';

export class NotificationService {
  /**
   * Internal sender to log notifications & trigger alert workflows.
   */
  static async send(
    userId: string,
    orderId: string | null,
    eventType: string,
    subject?: string,
    message?: string
  ): Promise<Notification | null> {
    const defaultSubject = subject || `Order Update: ${eventType}`;
    const defaultMessage = message || `An update occurred on your order (Event: ${eventType}).`;

    try {
      const record = await createNotification({
        user_id: userId,
        order_id: orderId,
        event_type: eventType,
        subject: defaultSubject,
        message: defaultMessage,
        is_read: false,
      });

      console.log(`[NotificationService] Sent alert '${eventType}' to user ${userId} for order ${orderId}`);
      return record;
    } catch (error) {
      console.error('[NotificationService] Failed to send notification:', error);
      return null;
    }
  }
}

