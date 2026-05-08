export type CommunityNoteRatingValue = 'helpful' | 'not_helpful';

export interface CommunityNoteSourceInput {
  url: string;
  title?: string | null;
}

export interface CommunityNoteInput {
  content: string;
  sources: CommunityNoteSourceInput[];
}

export interface CommunityNoteSource {
  id: string;
  noteId: string;
  url: string;
  title: string | null;
  createdAt: string;
}

export interface CommunityNote {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  status: 'published' | 'hidden' | 'deleted';
  helpfulCount: number;
  notHelpfulCount: number;
  viewerRating: CommunityNoteRatingValue | null;
  sources: CommunityNoteSource[];
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
}
