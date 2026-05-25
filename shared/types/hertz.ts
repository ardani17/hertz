import type {
  HertzAuthor,
  HertzFeedResult,
  HertzPost,
  HertzPostDetail,
  HertzPostInput,
} from './feed';

export type {
  HertzAuthor,
  HertzFeedResult,
  HertzPost,
  HertzPostDetail,
  HertzPostInput,
};

export interface HertzCreditSetting {
  key: string;
  amount: number;
  isActive: boolean;
  updatedAt: string;
}
