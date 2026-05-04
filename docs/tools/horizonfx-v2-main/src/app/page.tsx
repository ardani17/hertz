import { Header } from "@/components/header";
import { NewsSection } from "@/components/news-section";
import StocksTable from "@/components/stocks-table";
import ETFsTable from "@/components/etfs-table";
import { BlogSection } from "@/components/blog-section";
import { Footer } from "@/components/footer";
import AnnouncementPopup from "@/components/AnnouncementPopup";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <NewsSection />
        {/* Stocks Section */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Daily Stock Market Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StocksTable 
              title="Daily Gainers"
              endpoint="/api/stocks/gainers"
              type="gainers"
            />
            <StocksTable 
              title="Daily Losers"
              endpoint="/api/stocks/losers"
              type="losers"
            />
            <StocksTable 
              title="Trending Stocks"
              endpoint="/api/stocks/trending"
              type="trending"
            />
          </div>
        </section>
        
        {/* ETFs Section */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Top ETFs Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ETFsTable 
              title="Top ETFs US"
              endpoint="/api/etfs/top"
              type="top"
            />
            <ETFsTable 
              title="Top Performing ETFs"
              endpoint="/api/etfs/performing"
              type="performing"
            />
          </div>
        </section>
        
        {/* Blog Section */}
        <BlogSection />
      </main>
      <Footer />
      
      {/* Announcement Popup */}
      <AnnouncementPopup />
    </div>
  );
}
