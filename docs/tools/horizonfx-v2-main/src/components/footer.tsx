"use client";

import { GraduationCap, Shield, Bitcoin, Calendar, TrendingUp, Droplets, FileText, Mail, Calculator, Code, BarChart3, Target, Bot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";


export function Footer() {
  return (
    <footer className="relative bg-background text-foreground overflow-hidden border-t border-border/20">
      {/* Emerald Void Background Pattern */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-950/20 via-background to-background" />
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Brand Section */}
          <div className="space-y-6 flex flex-col items-center">
            <Link href="/" className="inline-block group">
              <Image 
                src="/black.png" 
                alt="HorizonFX Logo" 
                width={200}
                height={53}
                className="h-14 w-auto transition-transform group-hover:scale-105 dark:hidden"
                priority
              />
              <Image 
                src="/white.png" 
                alt="HorizonFX Logo" 
                width={200}
                height={53}
                className="h-14 w-auto transition-transform group-hover:scale-105 hidden dark:block"
                priority
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm text-center">
              Platform trading dan analisis forex terdepan dengan tools canggih untuk membantu trader mencapai kesuksesan di pasar finansial global.
            </p>
            <div className="flex items-center justify-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/20 w-full max-w-sm">
              <div className="p-2 rounded-full bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Support</p>
                <span className="text-sm font-medium">support@horizonfx.id</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Quick Links</h3>
            </div>
            <nav className="flex flex-col space-y-3">
              <a 
                href="https://academy.horizonfx.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Academy</span>
              </a>
              <a 
                href="https://cftc.horizonfx.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Shield className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">CFTC</span>
              </a>
              <a 
                href="https://sixcall.net/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                  <Bitcoin className="h-4 w-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Sixcall</span>
              </a>
              <a 
                href="https://ohlc.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                  <Code className="h-4 w-4 text-violet-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Developer API</span>
              </a>
              <a 
                href="https://t.me/HZFXI" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Mail className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Channel Horizonfx</span>
              </a>
            </nav>
          </div>

          {/* Tools */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Trading Tools</h3>
            </div>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/economic-calendar"
                className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Calendar className="h-4 w-4 text-purple-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Economic Calendar</span>
              </Link>
              <a
                href="https://tma.horizonfx.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                  <Bot className="h-4 w-4 text-indigo-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">AI Agent</span>
              </a>
              <Link
                href="https://liquidity-outlook.horizonfx.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                  <TrendingUp className="h-4 w-4 text-cyan-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Liquidity Outlook</span>
              </Link>
              <Link
                href="/exchange-liquidity"
                className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Droplets className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Exchange Liquidity</span>
              </Link>
              <Link
                href="/profitability-calculator"
                className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                  <Calculator className="h-4 w-4 text-pink-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Profitability Calculator</span>
              </Link>
              <Link
                href="/elliot-calculator"
                className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Elliott Wave Calculator</span>
              </Link>
              <Link
                href="/pivot-point"
                className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                  <Target className="h-4 w-4 text-red-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Pivot Point Calculator</span>
              </Link>
            </nav>
          </div>

          {/* Articles & Resources */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Resources</h3>
            </div>
            <nav className="flex flex-col space-y-3">
              <Link
                href="/blog"
                className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:translate-x-1"
              >
                <div className="p-2 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                  <FileText className="h-4 w-4 text-indigo-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">Blog & Articles</span>
              </Link>
              
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/20 dark:border-amber-800/20">
                <div className="flex items-start space-x-3">
                  <div className="p-1.5 rounded-full bg-amber-500/10">
                    <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">Risk Disclaimer</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      Trading forex dan CFD melibatkan risiko tinggi dan mungkin tidak cocok untuk semua investor. Pastikan Anda memahami risiko yang terlibat.
                    </p>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-gradient-to-r from-transparent via-border/40 to-transparent">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-foreground">
                © {new Date().getFullYear()} HorizonFX.
              </div>
              <div className="text-sm text-muted-foreground">
                All rights reserved.
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-1">
               <Link 
                 href="/privacy" 
                 className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 text-center md:text-left"
               >
                 Privacy Policy
               </Link>
               <div className="hidden md:block w-px h-4 bg-border/40" />
               <Link 
                 href="/terms" 
                 className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 text-center md:text-left"
               >
                 Terms of Service
               </Link>
               <div className="hidden md:block w-px h-4 bg-border/40" />
               <Link 
                 href="/contact" 
                 className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 text-center md:text-left"
               >
                 Contact Us
               </Link>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}