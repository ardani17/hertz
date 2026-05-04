import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Search, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found | HorizonFX",
  description: "The page you're looking for doesn't exist. Return to HorizonFX homepage or explore our trading tools.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/5 via-background to-background" />
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }} />
          </div>

          {/* 404 Animation */}
          <div className="relative">
            <div className="text-8xl md:text-9xl font-bold text-primary/20 select-none animate-pulse">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center animate-bounce">
                <HelpCircle className="w-12 h-12 md:w-16 md:h-16 text-primary/60" />
              </div>
            </div>
          </div>

          {/* Content Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Halaman Tidak Ditemukan
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman telah dipindahkan atau URL yang dimasukkan salah.
                </p>
              </div>

              {/* Action Button */}
              <div className="flex justify-center pt-4">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Kembali ke Beranda
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8">
            <Link 
              href="/economic-calendar" 
              className="group p-4 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <Search className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  Kalender Ekonomi
                </span>
              </div>
            </Link>

            <Link 
              href="/profitability-calculator" 
              className="group p-4 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Search className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  Kalkulator Profit
                </span>
              </div>
            </Link>

            <Link 
              href="/blog" 
              className="group p-4 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 transition-all duration-200 hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                  <Search className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  Blog & Artikel
                </span>
              </div>
            </Link>
          </div>

          {/* Help Text */}
          <div className="text-center pt-8">
            <p className="text-sm text-muted-foreground">
              Butuh bantuan? Hubungi tim support kami atau kunjungi{" "}
              <Link href="https://academy.horizonfx.id" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                HorizonFX Academy
              </Link>
              {" "}untuk panduan lengkap.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}