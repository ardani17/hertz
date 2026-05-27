import { getMarketRailSnapshot, type MarketRailSnapshot } from '@/lib/globalDataMarket';

export class MarketRailService {
  async snapshot(): Promise<MarketRailSnapshot> {
    return getMarketRailSnapshot();
  }
}

