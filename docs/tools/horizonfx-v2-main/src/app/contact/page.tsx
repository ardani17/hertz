"use client";

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Wrench, ExternalLink, Mail, Phone } from 'lucide-react';

export default function ContactPage() {
  const handleContactClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get in touch with our team for business inquiries or technical support. We&apos;re here to help you succeed.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Business Inquiries */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Business Inquiries
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  For partnerships, collaborations, and business opportunities
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>Business Development</span>
                  </div>
                  <Button 
                    onClick={() => handleContactClick('https://t.me/jacuziel')}
                    className="w-full group/btn"
                    size="lg"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact via Telegram
                    <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Technical Issues */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Wrench className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Technical Support
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  For technical issues, bug reports, and platform support
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>Technical Support Team</span>
                  </div>
                  <Button 
                    onClick={() => handleContactClick('https://t.me/advancedmicrodevice')}
                    className="w-full group/btn"
                    size="lg"
                    variant="outline"
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    Get Technical Help
                    <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Response Time
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">Business Inquiries</h3>
                <p className="text-muted-foreground">We typically respond within 24-48 hours</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Technical Support</h3>
                <p className="text-muted-foreground">We aim to respond within 2-6 hours</p>
              </div>
            </div>
          </div>

          {/* Contact Guidelines */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Contact Guidelines
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Be Specific</h3>
                <p className="text-sm text-muted-foreground">
                  Provide detailed information about your inquiry or issue
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Include Context</h3>
                <p className="text-sm text-muted-foreground">
                  Share relevant screenshots or error messages when applicable
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Be Patient</h3>
                <p className="text-sm text-muted-foreground">
                  Allow our team time to provide you with the best possible assistance
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}