import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function TermsAndConditions() {
  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mt-8">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray mt-12 dark:prose-invert max-w-none">
          <h2>Welcome to Ratio Tuta</h2>
          <p>
            By using Ratio Tuta, you agree to these Terms and Conditions. Please read them carefully.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Ratio Tuta, you agree to be bound by these Terms and Conditions and our Privacy Policy.
            If you do not agree to these terms, please do not use our service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Ratio Tuta provides a privacy-focused point-of-sale (POS) and business management platform. Our service includes:
          </p>
          <ul>
            <li>Inventory management and tracking</li>
            <li>Sales processing and reporting</li>
            <li>Multi-location support</li>
            <li>Team collaboration tools</li>
            <li>Analytics and insights</li>
          </ul>

          <h2>3. User Accounts</h2>
          <p>
            To use Ratio Tuta, you must create an account. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
            <li>Ensuring your account information is accurate and up-to-date</li>
          </ul>

          <h2>4. Privacy and Data Ownership</h2>
          <p>
            <strong>Your data belongs to you.</strong> We are committed to protecting your privacy:
          </p>
          <ul>
            <li>We do not sell, trade, or monetize your data</li>
            <li>We do not analyze your business data for our benefit</li>
            <li>You can export or delete your data at any time</li>
            <li>See our <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Privacy Policy</Link> for full details</li>
          </ul>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any illegal or unauthorized purpose</li>
            <li>Violate any laws in your jurisdiction</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit viruses, malware, or harmful code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the service</li>
          </ul>

          <h2>6. Service Availability</h2>
          <p>
            We strive to provide reliable, uninterrupted service. However:
          </p>
          <ul>
            <li>We do not guarantee 100% uptime</li>
            <li>We may perform maintenance that temporarily affects service</li>
            <li>We will notify you of scheduled maintenance when possible</li>
          </ul>

          <h2>7. Pricing and Payment</h2>
          <ul>
            <li>Ratio Tuta offers a free version with no time limit</li>
            <li>Paid plans are available for additional features and capacity</li>
            <li>Pricing is transparent with no hidden fees</li>
            <li>You may cancel your subscription at any time</li>
            <li>Refunds are handled on a case-by-case basis</li>
          </ul>

          <h2>8. Intellectual Property</h2>
          <p>
            Ratio Tuta and its original content, features, and functionality are owned by Ratio Tuta and are protected
            by international copyright, trademark, and other intellectual property laws.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Ratio Tuta shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages resulting from your use or inability to use the service.
          </p>

          <h2>10. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account if you violate these Terms and Conditions.
            You may also terminate your account at any time through your account settings.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We may update these Terms and Conditions from time to time. We will notify you of significant changes
            by posting the new terms on this page and updating the &quot;Last updated&quot; date.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms and Conditions are governed by and construed in accordance with the laws of Lithuania,
            without regard to its conflict of law provisions.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us:
          </p>
          <p>
            <a href="mailto:legal@ratiotuta.com" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              legal@ratiotuta.com
            </a>
          </p>

          <h2>14. Entire Agreement</h2>
          <p>
            These Terms and Conditions, together with our Privacy Policy, constitute the entire agreement between
            you and Ratio Tuta regarding the use of our service.
          </p>
        </div>
      </div>
    </div>
  )
}
