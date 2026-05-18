import { describe, expect, it } from 'vitest';
import { buildHertzCommentTree } from '../../../shared/services/hertzPostService';
import type { HertzComment } from '../../../shared/types/feed';

function comment(id: string, parentCommentId: string | null = null): HertzComment {
  return {
    id,
    postId: 'post-1',
    userId: `user-${id}`,
    parentCommentId,
    replies: [],
    author: { id: `user-${id}`, name: `User ${id}`, username: null, badge: 'verified_member', avatarUrl: null },
    content: `Comment ${id}`,
    status: 'visible',
    createdAt: `2026-05-19T00:0${id}.000Z`,
    updatedAt: `2026-05-19T00:0${id}.000Z`,
    editedAt: null,
    canEdit: false,
    canDelete: false,
  };
}

describe('HERTZ comment replies', () => {
  it('groups replies under top-level comments and flattens reply-to-reply to the root thread', () => {
    const tree = buildHertzCommentTree([
      comment('1'),
      comment('2', '1'),
      comment('3', '2'),
      comment('4'),
    ]);

    expect(tree.map((item) => item.id)).toEqual(['1', '4']);
    expect(tree[0].replies.map((item) => item.id)).toEqual(['2', '3']);
    expect(tree[1].replies).toEqual([]);
  });
});
