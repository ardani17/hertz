import { HertzInAppNotificationService, buildHertzInAppNotificationSummary } from './hertzInAppNotificationService';

export interface HertzNotificationSummary {
  unreadCount: number;
  hasUnread: boolean;
  unreadDmCount: number;
  hasUnreadDm: boolean;
}

export function buildHertzNotificationSummary({ unreadCount = 0, unreadDmCount }: { unreadCount?: number; unreadDmCount: number }): HertzNotificationSummary {
  return buildHertzInAppNotificationSummary({ unreadCount, unreadDmCount });
}

export class HertzNotificationService {
  private readonly inApp = new HertzInAppNotificationService();

  async summary(userId: string): Promise<HertzNotificationSummary> {
    return this.inApp.summary(userId);
  }
}
