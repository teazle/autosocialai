import Link from "next/link";

export const metadata = {
  title: "Terms of Service - AutoSocial AI",
  description: "Terms of Service for AutoSocial AI",
};

export default function TermsOfService() {
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Last updated: January 2025</p>
        </header>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">1. Agreement to Terms</h2>
            <p className="text-sm sm:text-base">
              By accessing or using AutoSocial AI ("the Service"), you agree to be bound by these Terms of Service
              and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited
              from using or accessing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">2. Description of Service</h2>
            <p className="text-sm sm:text-base">
              AutoSocial AI provides automated social media content creation and posting services for Facebook,
              Instagram, and TikTok. The Service includes:
            </p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>AI-generated content including text and captions</li>
              <li>AI-generated images and visual content</li>
              <li>Automated scheduling and posting to connected social media accounts</li>
              <li>Content management and analytics tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">3. Account Registration</h2>
            <p className="text-sm sm:text-base">To use the Service, you must:</p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be at least 18 years old or have parental consent</li>
              <li>Have the authority to bind the business you represent</li>
            </ul>
            <p className="mt-4 text-sm sm:text-base">
              You are responsible for all activities that occur under your account. Notify us immediately
              of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">4. Social Media Platform Requirements</h2>
            <p className="text-sm sm:text-base">
              By using the Service, you acknowledge that:
            </p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>You must comply with each platform's Terms of Service and Community Guidelines</li>
              <li>You are responsible for obtaining necessary permissions for automated posting</li>
              <li>Platform limits and restrictions may affect service availability</li>
              <li>We are not responsible for platform policy changes or API limitations</li>
              <li>You grant us permission to post content on your behalf via authorized API access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">5. Acceptable Use</h2>
            <p className="text-sm sm:text-base">You agree NOT to use the Service to:</p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>Post illegal, harmful, or offensive content</li>
              <li>Violate any intellectual property rights</li>
              <li>Post spam, malware, or malicious content</li>
              <li>Impersonate other persons or entities</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Attempt to reverse engineer or compromise the Service</li>
              <li>Use the Service to compete with or harm our business</li>
              <li>Engage in any form of automated abuse or manipulation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">6. AI-Generated Content</h2>
            <p className="text-sm sm:text-base">
              Our Service uses AI to generate content. You acknowledge and agree that:
            </p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>AI-generated content may not always be perfect or accurate</li>
              <li>You are responsible for reviewing and approving content before posting</li>
              <li>We are not liable for content that violates platform policies</li>
              <li>AI models and capabilities may change over time</li>
              <li>Content should be customized to match your brand voice and guidelines</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">7. Payment Terms</h2>
            <p className="text-sm sm:text-base">
              Subscription fees are charged in advance on a monthly or annual basis. By subscribing, you authorize us to charge
              the applicable fees using your chosen payment method. Terms include:
            </p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>All fees are non-refundable unless otherwise stated</li>
              <li>We reserve the right to change pricing with 30 days' notice</li>
              <li>Subscription automatically renews unless cancelled</li>
              <li>Failed payments may result in service suspension</li>
              <li>No refunds for partial billing periods</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">8. Intellectual Property</h2>
            <p>
              The Service and its original content are owned by AutoSocial AI and protected by intellectual property laws.
              You retain ownership of your brand content and user-generated materials. By using the Service, you grant
              us a limited license to use your brand information and content solely for providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">9. Service Availability and Modifications</h2>
            <p className="text-sm sm:text-base">
              We strive to maintain high availability but do not guarantee uninterrupted service. We may:
            </p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>Perform scheduled maintenance with reasonable notice</li>
              <li>Modify or discontinue features at our discretion</li>
              <li>Add new features or capabilities</li>
              <li>Suspend service for policy violations</li>
              <li>Experience downtime due to third-party dependencies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">10. Termination</h2>
            <p className="text-sm sm:text-base">
              Either party may terminate the Service at any time. Upon termination:
            </p>
            <ul className="text-sm sm:text-base list-disc list-inside ml-4 space-y-1">
              <li>Your access to the Service will be immediately revoked</li>
              <li>We will delete your account and data according to our retention policy</li>
              <li>Active subscriptions will be cancelled</li>
              <li>You remain responsible for charges incurred before termination</li>
            </ul>
            <p className="mt-4">
              We reserve the right to suspend or terminate accounts that violate these Terms without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">11. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE
              SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">12. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUTOSOCIAL AI SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
              WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE
              LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">13. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless AutoSocial AI, its officers, directors, employees,
              and agents from any claims, damages, losses, liabilities, costs, or expenses (including legal fees)
              arising out of or relating to your use of the Service, violation of these Terms, or infringement
              of any rights of another party.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">14. Dispute Resolution</h2>
            <p>
              Any disputes arising from these Terms or the Service shall be resolved through binding arbitration
              in accordance with the rules of the American Arbitration Association. This agreement to arbitrate
              includes all claims arising out of or relating to these Terms or the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">15. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes
              by posting the new Terms on this page and updating the "Last updated" date. Your continued use
              of the Service after such changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">16. Contact Information</h2>
            <p>
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> support@autosocial.ai<br />
              <strong>Address:</strong> [Your Company Address]
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">17. Entire Agreement</h2>
            <p>
              These Terms constitute the entire agreement between you and AutoSocial AI regarding the Service
              and supersede all prior agreements and understandings, whether written or oral.
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

