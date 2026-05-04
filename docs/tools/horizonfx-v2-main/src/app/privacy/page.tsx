import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            
            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                HorizonFX (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium text-foreground">2.1 Personal Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Register for an account</li>
                  <li>Subscribe to our newsletter</li>
                  <li>Contact us through our contact forms</li>
                  <li>Participate in surveys or promotions</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-medium text-foreground">2.2 Automatically Collected Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We automatically collect certain information when you visit our website, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>IP address and location data</li>
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Pages visited and time spent on our site</li>
                  <li>Referring website addresses</li>
                </ul>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Providing and maintaining our services</li>
                <li>Improving our website and user experience</li>
                <li>Sending you updates and marketing communications (with your consent)</li>
                <li>Responding to your inquiries and providing customer support</li>
                <li>Analyzing usage patterns and trends</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>With service providers who assist us in operating our website</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or merger</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            {/* Cookies */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand where our visitors are coming from. You can control cookie settings through your browser preferences.
              </p>
            </section>

            {/* Your Rights */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>The right to access your personal information</li>
                <li>The right to correct inaccurate information</li>
                <li>The right to delete your personal information</li>
                <li>The right to restrict processing</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
            </section>

            {/* Third-Party Links */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Third-Party Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our services are not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            {/* Contact Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-muted/50 p-6 rounded-lg border">
                <p className="text-foreground font-medium">HorizonFX</p>
                <p className="text-muted-foreground">Email: privacy@horizonfx.id</p>
                <p className="text-muted-foreground">Website: https://horizonfx.id</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}