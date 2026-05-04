import { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { WordPressContent } from "@/components/wordpress-content";
import { Post } from "@/types";
import { ArrowLeft } from "lucide-react";

async function getPost(slug: string): Promise<Post | null> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(
      `https://academy.horizonfx.id/wp-json/wp/v2/posts?slug=${slug}&_embed`,
      {
        next: {
          revalidate: 60,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Failed to fetch post: ${res.status} ${res.statusText}`);
      return null;
    }

    const posts = await res.json();
    return posts[0] || null;
  } catch (error) {
    // Log error but don't throw
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("Request timeout while fetching blog post");
    } else {
      console.warn("Error fetching blog post:", error);
    }
    return null;
  }
}

const BlogPostPage: NextPage<{ params: Promise<{ slug: string }> }> = async ({ params }) => {
  const { slug } = await params;
  const post = await getPost(slug);
  
  if (!post) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-black dark:via-gray-950 dark:to-black">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Post Not Found
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                The blog post you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
              </p>
              <Link 
                href="/blog" 
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/placeholder.png';

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-black dark:via-gray-950 dark:to-black">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Back to Blog Button */}
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          
          <article className="bg-white dark:bg-[#171717] rounded-2xl shadow-lg overflow-hidden">
            <div className="relative w-full h-80 md:h-96">
              <Image 
                src={imageUrl} 
                alt={post.title.rendered} 
                fill 
                style={{objectFit: 'cover'}} 
                className="" 
              />
            </div>
            <div className="p-8 md:p-12">
              <h1 
                className="text-3xl md:text-4xl font-bold mb-8 text-gray-900 dark:text-white leading-tight" 
                dangerouslySetInnerHTML={{ __html: post.title.rendered }} 
              />
              <WordPressContent content={post.content.rendered} />
            </div>
          </article>
        </div>
      </div>
    </>
  );
};

export default BlogPostPage;