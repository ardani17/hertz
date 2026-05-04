import BlogCard from "@/components/blog-card";
import { Header } from "@/components/header";
import { NextPage } from "next";
import Link from "next/link";
import { Post } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

async function getPosts(page: number = 1, perPage: number = 9): Promise<{ posts: Post[], totalPages: number, currentPage: number }> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(
      `https://academy.horizonfx.id/wp-json/wp/v2/posts?_embed&page=${page}&per_page=${perPage}`,
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
      return {
        posts: [],
        totalPages: 1,
        currentPage: page
      };
    }

    const posts = await res.json();
    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
    
    return {
      posts,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    // Log error but don't throw - allow build to continue
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn("Request timeout while fetching blog posts");
    } else {
      console.warn("Error fetching blog posts:", error);
    }
    return {
      posts: [],
      totalPages: 1,
      currentPage: page
    };
  }
}

const BlogPage: NextPage<{ searchParams: Promise<{ page?: string }> }> = async ({ searchParams }) => {
  const resolvedSearchParams = await searchParams;
  const currentPage = parseInt(resolvedSearchParams?.page || '1');
  const { posts, totalPages } = await getPosts(currentPage);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-black dark:via-gray-950 dark:to-black">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Blog
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Dapatkan insight terbaru tentang trading, analisis pasar, dan strategi investasi dari para ahli HorizonFX.
            </p>
          </div>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 dark:text-gray-400">
                No blog posts available at the moment. Please check back later.
              </p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              {currentPage > 1 && (
                <Link 
                  href={`/blog?page=${currentPage - 1}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Link>
              )}
              
              <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              
              {currentPage < totalPages && (
                <Link 
                  href={`/blog?page=${currentPage + 1}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;