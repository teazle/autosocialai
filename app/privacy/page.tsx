import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - AutoSocial AI",
  description: "Privacy Policy for AutoSocial AI",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <Link
            href="/"
            className="text-sm sm:text-base text-indigo-600 hover:text-indigo-700 mb-3 sm:mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Last updated: January 2025</p>
        </header>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">1. Introduction</h2>
            <p className="text-sm sm:text-base">
              Welcome to AutoSocial AI. We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you use our
              automated social media management service.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">2. Information We Collect</h2>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 mt-3 sm:mt-4">2.1 Account Information</h3>
            <p className="text-sm sm:text-base">
              When you create an account, we collect:
            </p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>Email address</li>
              <li>Name and business information</li>
              <li>Profile information</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 mt-3 sm:mt-4">2.2 Social Media Platform Data</h3>
            <p className="text-sm sm:text-base">
              With your explicit consent, we access:
            </p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>Connected social media account information (Facebook, Instagram, TikTok)</li>
              <li>Access tokens required for posting content</li>
              <li>Content performance metrics</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 mt-3 sm:mt-4">2.3 Usage Data</h3>
            <p className="text-sm sm:text-base">
              We automatically collect information about how you use our service:
            </p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>IP address and browser type</li>
              <li>Device information</li>
              <li>Usage patterns and feature interactions</li>
              <li>Error logs and diagnostic information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">3. How We Use Your Information</h2>
            <p className="text-sm sm:text-base">We use the collected information for:</p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>Providing and maintaining our automated posting service</li>
              <li>Creating and managing your social media content</li>
              <li>Authenticating and authorizing API access to social media platforms</li>
              <li>Improving our AI content generation algorithms</li>
              <li>Sending important service notifications</li>
              <li>Responding to customer support requests</li>
              <li>Preventing fraud and ensuring security</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Storage and Security</h2>
            <p>
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Encryption of data in transit using SSL/TLS</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Secure storage of access tokens</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
            </ul>
            <p className="mt-4">
              Data is stored in secure cloud infrastructure with automated backups and disaster recovery procedures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Services</h2>
            <p>
              We integrate with the following services:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Meta (Facebook/Instagram):</strong> For social media posting</li>
              <li><strong>TikTok:</strong> For content publishing</li>
              <li><strong>Groq AI:</strong> For content generation</li>
              <li><strong>Replicate:</strong> For AI image generation</li>
            </ul>
            <p className="mt-4">
              These services have their own privacy policies. We only share data necessary for service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Access and review your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your data in a portable format</li>
              <li>Revoke API access tokens at any time</li>
              <li>Opt out of promotional communications</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at the email address provided in the Contact section.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide services.
              When you delete your account, we will delete or anonymize your personal data within 30 days,
              except where we are required to retain it for legal or regulatory purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p>
              Our service is not intended for users under the age of 18. We do not knowingly collect
              personal information from children. If you believe we have collected information from a child,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any material changes
              by posting the new policy on this page and updating the "Last updated" date. Your continued
              use of the service after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            <p>
              If you have questions about this privacy policy or our data practices, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> privacy@autosocial.ai<br />
              <strong>Address:</strong> [Your Company Address]
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 text-center text-gray-600">
          <p className="text-sm sm:text-base">© 2025 AutoSocial AI. All rights reserved.</p>
          <div className="mt-3 sm:mt-4 flex flex-wrap justify-center items-center gap-2 sm:gap-4">
            <Link href="/privacy" className="text-sm sm:text-base hover:text-indigo-600">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/terms" className="text-sm sm:text-base hover:text-indigo-600">
              Terms of Service
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

