"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { GraduationCap, Shield, Bitcoin, Calendar, ChevronDown, TrendingUp, Droplets, FileText, Menu, X, Calculator, Bot, BookOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export function Header() {
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showArticlesDropdown, setShowArticlesDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-screen-2xl px-4">
        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 items-center h-14">
          {/* Left Navigation */}
          <div className="flex items-center justify-start">
            <nav className="flex items-center space-x-4">
              <a 
                href="https://academy.horizonfx.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Academy</span>
              </a>
              <a 
                href="https://cftc.horizonfx.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Shield className="h-4 w-4" />
                <span>CFTC</span>
              </a>
              <a 
                href="https://sixcall.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bitcoin className="h-4 w-4" />
                <span>Sixcall</span>
              </a>
            </nav>
          </div>
          
          {/* Center Brand */}
          <div className="flex items-center justify-center">
            <Link href="/" className="cursor-pointer">
              <Image 
                src="/black.png" 
                alt="HorizonFX Logo" 
                width={180}
                height={48}
                className="h-12 w-auto hover:opacity-80 transition-opacity dark:hidden"
              />
              <Image 
                src="/white.png" 
                alt="HorizonFX Logo" 
                width={180}
                height={48}
                className="h-12 w-auto hover:opacity-80 transition-opacity hidden dark:block"
              />
            </Link>
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center justify-end space-x-4">
            {/* Articles Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowArticlesDropdown(!showArticlesDropdown)}
                className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Articles</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {showArticlesDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[150px]">
                  <Link
                    href="/blog"
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowArticlesDropdown(false)}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Blog</span>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Calendar className="h-4 w-4" />
                <span>Tools</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {showToolsDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[150px]">
                  <Link
                    href="/economic-calendar"
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Economic Calendar</span>
                  </Link>
                  <a
                    href="https://tma.horizonfx.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    <Bot className="h-4 w-4" />
                    <span>AI Agent</span>
                  </a>
                  <Link
                    href="https://liquidity-outlook.horizonfx.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Liquidity Outlook</span>
                  </Link>
                  <Link
                    href="/exchange-liquidity"
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    <Droplets className="h-4 w-4" />
                    <span>Exchange Liquidity</span>
                  </Link>
                  <Link
                    href="/profitability-calculator"
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Profitability Calculator</span>
                  </Link>
                  <Link
                    href="/elliot-calculator"
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Elliott Wave Calculator</span>
                  </Link>
                  <Link
                    href="/pivot-point"
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Pivot Point Calculator</span>
                  </Link>
                  <Link
                    href="/order-book"
                    className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Order Book</span>
                  </Link>
                </div>
              )}
            </div>
            
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between h-14">
          <Link href="/" className="cursor-pointer">
            <Image 
              src="/black.png" 
              alt="HorizonFX Logo" 
              width={120}
              height={32}
              className="h-8 w-auto hover:opacity-80 transition-opacity dark:hidden"
            />
            <Image 
              src="/white.png" 
              alt="HorizonFX Logo" 
              width={120}
              height={32}
              className="h-8 w-auto hover:opacity-80 transition-opacity hidden dark:block"
            />
          </Link>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <a 
                  href="https://academy.horizonfx.id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Academy</span>
                </a>
                <a 
                  href="https://cftc.horizonfx.id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  <span>CFTC</span>
                </a>
                <a 
                  href="https://sixcall.net" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bitcoin className="h-4 w-4" />
                  <span>Sixcall</span>
                </a>
              </div>
              
              {/* Mobile Articles */}
              <div className="border-t border-border/40 pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Articles</h3>
                <Link
                  href="/blog"
                  className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <FileText className="h-4 w-4" />
                  <span>Blog</span>
                </Link>
              </div>
              
              {/* Mobile Tools */}
              <div className="border-t border-border/40 pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Tools</h3>
                <div className="space-y-2">
                  <Link
                    href="/economic-calendar"
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Economic Calendar</span>
                  </Link>
                  <a
                    href="https://tma.horizonfx.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Bot className="h-4 w-4" />
                    <span>AI Agent</span>
                  </a>
                  <a
                    href="https://liquidity-outlook.horizonfx.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Liquidity Outlook</span>
                  </a>
                  <Link
                    href="/exchange-liquidity"
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Droplets className="h-4 w-4" />
                    <span>Exchange Liquidity</span>
                  </Link>
                  <Link
                    href="/profitability-calculator"
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Profitability Calculator</span>
                  </Link>
                  <Link
                    href="/elliot-calculator"
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Elliott Wave Calculator</span>
                  </Link>
                  <Link
                    href="/pivot-point"
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Pivot Point Calculator</span>
                  </Link>
                  <Link
                    href="/order-book"
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Order Book</span>
                  </Link>
                </div>
              </div>
              
            </div>
          </div>
        )}
      </div>
    </header>
  )
}