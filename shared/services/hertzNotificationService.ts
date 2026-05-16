import { HertzDmRepository } from '../repositories/hertzDmRepository';

export interface HertzNotificationSummary {
  unreadDmCount: number;
  hasUnreadDm: boolean;
}

export function buildHertzNotificationSummary({ unreadDmCount }: { unreadDmCount: number }): HertzNotificationSummary {
  const count = Math.max(0, Number.isFinite(unreadDmCount) ? Math.floor(unreadDmCount) : 0);
  return {
    unreadDmCount: count,
    hasUnreadDm: count > 0,
  };
}

export class HertzNotificationService {
  private readonly dm = new HertzDmRepository();

  async summary(userId: string): Promise<HertzNotificationSummary> {
    return buildHertzNotificationSummary({
      unreadDmCount: await this.dm.countUnread(userId),
    });
  }
}
