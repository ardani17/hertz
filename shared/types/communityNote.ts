export type CommunityNoteRatingValue = 'helpful' | 'not_helpful';

export interface CommunityNoteRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  status: 'published' | 'hidden' | 'deleted';
  helpful_count: number;
  not_helpful_count: number;
  username: string | null;
  display_name: string | null;
  rating: CommunityNoteRatingValue | null;
  created_at: Date | string;
  updated_at: Date | string;
  edited_at: Date | string | null;
}

export interface CommunityNoteSourceRow {
  id: string;
  note_id: string;
  source_url: string;
  source_title: string | null;
  created_at: Date | string;
}

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
