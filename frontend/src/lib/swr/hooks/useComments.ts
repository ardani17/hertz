'use client';

import type { HertzComment } from '@shared/types';
import { useResource } from './useResource';

export type CommentListData = { comments: HertzComment[] };
export const commentsKey = (shortId: string) => `/api/hertz/posts/${shortId}/comments`;

export function useCommentList(shortId: string | null) {
  return useResource<CommentListData>(shortId ? commentsKey(shortId) : null, { refreshIntervalMs: 7_000 });
}
