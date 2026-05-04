import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types";

const BlogCard = ({ post }: { post: Post }) => {
  const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/placeholder.png';

  return (
    <div className="bg-white dark:bg-[#171717] rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative w-full h-48 overflow-hidden">
        <Image 
          src={imageUrl} 
          alt={post.title.rendered} 
          fill 
          style={{objectFit: 'cover'}} 
          className="group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <h2 
          className="text-xl font-bold mb-4 text-gray-900 dark:text-white line-clamp-2 leading-tight" 
          dangerouslySetInnerHTML={{ __html: post.title.rendered }} 
        />
        <Link 
           href={`/blog/${post.slug}`} 
           className="inline-flex items-center px-4 py-2 border border-green-500/30 bg-green-500/10 backdrop-blur-sm hover:bg-green-500/20 hover:border-green-500/50 text-green-600 dark:text-green-400 font-medium rounded-lg transition-all duration-300 text-sm group-hover:shadow-lg"
         >
           Learn More
           <svg className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
           </svg>
         </Link>
      </div>
    </div>
  );
};

export default BlogCard;