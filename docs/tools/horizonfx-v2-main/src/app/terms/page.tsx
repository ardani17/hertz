import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            
            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using HorizonFX (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            {/* Description of Service */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                HorizonFX provides financial market information, analysis, educational content, and trading tools. Our services include but are not limited to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Real-time and historical market data</li>
                <li>Technical analysis tools and indicators</li>
                <li>Economic calendar and news</li>
                <li>Educational resources and articles</li>
                <li>Trading signals and market insights</li>
              </ul>
            </section>

            {/* User Responsibilities */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed">
                As a user of our service, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide accurate and complete information when creating an account</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use the service only for lawful purposes</li>
                <li>Not attempt to gain unauthorized access to our systems</li>
                <li>Not distribute malware or engage in any harmful activities</li>
                <li>Respect intellectual property rights</li>
              </ul>
            </section>

            {/* Risk Disclaimer */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Risk Disclaimer</h2>
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50 p-6 rounded-lg">
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-amber-800 dark:text-amber-200">Important Risk Warning</h3>
                  <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                    Trading foreign exchange (forex), contracts for difference (CFDs), and other leveraged products carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you.
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                    Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite. You should be aware of all the risks associated with trading and seek advice from an independent financial advisor if you have any doubts.
                  </p>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Intellectual Property Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, features, and functionality of HorizonFX, including but not limited to text, graphics, logos, icons, images, audio clips, and software, are the exclusive property of HorizonFX and are protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            {/* Prohibited Uses */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Prohibited Uses</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may not use our service:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
              </ul>
            </section>

            {/* Disclaimer of Warranties */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">7. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                The information on this website is provided on an &quot;as is&quot; basis. To the fullest extent permitted by law, HorizonFX excludes all representations, warranties, conditions, and terms whether express, implied, or statutory.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                In no event shall HorizonFX, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, punitive, consequential, or special damages arising out of or related to your use of the service.
              </p>
            </section>

            {/* Indemnification */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">9. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to defend, indemnify, and hold harmless HorizonFX and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney&apos;s fees).
              </p>
            </section>

            {/* Termination */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">10. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
            </section>

            {/* Governing Law */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">11. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be interpreted and governed by the laws of Indonesia, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">12. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            {/* Contact Information */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">13. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-muted/50 p-6 rounded-lg border">
                <p className="text-foreground font-medium">HorizonFX</p>
                <p className="text-muted-foreground">Email: legal@horizonfx.id</p>
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