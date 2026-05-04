import BlogCard from "@/components/blog-card";
import Link from "next/link";
import { Post } from "@/types";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

async function getLatestPosts(): Promise<Post[]> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(
      "https://academy.horizonfx.id/wp-json/wp/v2/posts?_embed&per_page=3",
      {
        next: {
          revalidate: 60,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Failed to fetch posts: ${res.status} ${res.statusText}`);
      return [];
    }

    return res.json();
  } catch (error) {
    // Log error but don't throw - allow build to continue
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("Request timeout while fetching blog posts during build");
    } else {
      console.warn("Error fetching blog posts during build:", error);
    }
    return [];
  }
}

export async function BlogSection() {
  const posts = await getLatestPosts();

  // Don't render section if no posts available
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Latest Blog Posts
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Stay updated with the latest insights, market analysis, and trading strategies from our experts.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
      
      <div className="text-center">
        <Button asChild variant="outline" size="sm" className="backdrop-blur-sm bg-background/60 border-border/50 hover:bg-background/80 hover:border-border transition-all duration-200">
          <Link href="/blog" className="inline-flex items-center gap-2">
            See All Blog Posts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}