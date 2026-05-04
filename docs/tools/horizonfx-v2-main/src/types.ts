export interface Post {
  id: number;
  title: {
    rendered: string;
  };
  slug: string;
  content: {
    rendered: string;
  };
  _embedded: {
    'wp:featuredmedia'?: {
      source_url: string;
    }[];
  };
}