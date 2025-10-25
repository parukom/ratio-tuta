import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray mt-12 dark:prose-invert max-w-none">
          <h2>Our Commitment to Privacy</h2>
          <p>
            At Ratio Tuta, privacy is not just a feature—it&apos;s our mission. We built this platform with a fundamental principle:
            <strong> your data belongs to you, and only you</strong>.
          </p>

          <h2>What We Don&apos;t Do</h2>
          <ul>
            <li>We <strong>don&apos;t read</strong> your emails or messages</li>
            <li>We <strong>don&apos;t track</strong> what you sell or who your customers are</li>
            <li>We <strong>don&apos;t analyze</strong> your business data for our benefit</li>
            <li>We <strong>don&apos;t sell</strong> your data to third parties—ever</li>
            <li>We <strong>don&apos;t use</strong> your data for advertising or marketing purposes</li>
            <li>We <strong>don&apos;t care</strong> who you are beyond providing you with excellent service</li>
          </ul>

          <h2>What Data We Collect</h2>
          <p>
            To provide you with our service, we collect only the minimal information necessary:
          </p>
          <ul>
            <li><strong>Account Information:</strong> Email address and password (encrypted)</li>
            <li><strong>Business Data:</strong> Information you choose to store in the system (products, sales, inventory)</li>
            <li><strong>Technical Data:</strong> Basic logs for system security and debugging purposes only</li>
          </ul>

          <h2>How We Protect Your Data</h2>
          <ul>
            <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard encryption</li>
            <li><strong>Access Control:</strong> Role-based permissions ensure team members only see what they need</li>
            <li><strong>Secure Infrastructure:</strong> Our systems are hosted on secure, enterprise-grade infrastructure</li>
            <li><strong>Regular Audits:</strong> We maintain complete audit trails for accountability</li>
          </ul>

          <h2>Data Retention and Deletion</h2>
          <p>
            Your data stays in the system as long as you want it there. You can:
          </p>
          <ul>
            <li>Export your data at any time</li>
            <li>Delete your account and all associated data permanently</li>
            <li>Request a complete copy of your data</li>
          </ul>

          <h2>Third-Party Services</h2>
          <p>
            We use minimal third-party services, and when we do, we ensure they meet our strict privacy standards.
            We never share your business data with any third party for their benefit.
          </p>

          <h2>Your Rights</h2>
          <p>Under applicable data protection laws, you have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Object to data processing</li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or how we handle your data, please contact us at:
          </p>
          <p>
            <a href="mailto:privacy@ratiotuta.com" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              privacy@ratiotuta.com
            </a>
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes by
            posting the new policy on this page and updating the &quot;Last updated&quot; date.
          </p>
        </div>
      </div>
    </div>
  )
}
