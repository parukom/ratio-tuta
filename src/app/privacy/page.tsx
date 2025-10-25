import Link from 'next/link'
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  XCircleIcon,
  DocumentTextIcon,
  LockClosedIcon,
  TrashIcon,
  GlobeAltIcon,
  ScaleIcon,
  EnvelopeIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline'

export default function PrivacyPolicy() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16 lg:py-24 lg:px-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4 sm:mb-6">
            <ShieldCheckIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl xl:text-6xl dark:text-white px-2">
            Privacy Policy
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 px-2">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Commitment Banner */}
        <div className="mt-8 sm:mt-10 lg:mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">Our Commitment to Privacy</h2>
          <p className="text-base sm:text-lg text-indigo-50">
            At Ratio Tuta, privacy is not just a feature—it&apos;s our mission. We built this platform with a fundamental principle:
            <span className="block mt-2 text-lg sm:text-xl font-semibold text-white">
              Your data belongs to you, and only you.
            </span>
          </p>
        </div>

        {/* Content Sections */}
        <div className="mt-8 sm:mt-10 lg:mt-12 space-y-6 sm:space-y-8">

          {/* What We Don't Do */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <XCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">What We Don&apos;t Do</h2>
            </div>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We <strong>don&apos;t read</strong> your emails or messages</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We <strong>don&apos;t track</strong> what you sell or who your customers are</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We <strong>don&apos;t analyze</strong> your business data for our benefit</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We <strong>don&apos;t sell</strong> your data to third parties—ever</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We <strong>don&apos;t use</strong> your data for advertising or marketing purposes</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We <strong>don&apos;t care</strong> who you are beyond providing you with excellent service</span>
              </li>
            </ul>
          </section>

          {/* What Data We Collect */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <DocumentTextIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">What Data We Collect</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
              To provide you with our service, we collect only the minimal information necessary:
            </p>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Account Information</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">Email address and password (encrypted)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Business Data</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">Information you choose to store in the system (products, sales, inventory)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Technical Data</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">Basic logs for system security and debugging purposes only</p>
                </div>
              </div>
            </div>
          </section>

          {/* How We Protect Your Data */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <LockClosedIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">How We Protect Your Data</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">Encryption</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">All data is encrypted in transit and at rest using industry-standard encryption</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">Access Control</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Role-based permissions ensure team members only see what they need</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">Secure Infrastructure</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Our systems are hosted on secure, enterprise-grade infrastructure</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1 sm:mb-2">Regular Audits</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">We maintain complete audit trails for accountability</p>
              </div>
            </div>
          </section>

          {/* Data Retention and Deletion */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <TrashIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Data Retention and Deletion</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
              Your data stays in the system as long as you want it there. You can:
            </p>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Export your data at any time</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Delete your account and all associated data permanently</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Request a complete copy of your data</span>
              </li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <GlobeAltIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Third-Party Services</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              We use minimal third-party services, and when we do, we ensure they meet our strict privacy standards.
              We never share your business data with any third party for their benefit.
            </p>
          </section>

          {/* Your Rights */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <ScaleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-indigo-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Your Rights</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4 sm:mb-6">
              Under applicable data protection laws, you have the right to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-indigo-500 text-sm sm:text-base">→</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Access your personal data</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-indigo-500 text-sm sm:text-base">→</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Correct inaccurate data</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-indigo-500 text-sm sm:text-base">→</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Request deletion of your data</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-indigo-500 text-sm sm:text-base">→</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Export your data</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:col-span-2">
                <span className="text-indigo-500 text-sm sm:text-base">→</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Object to data processing</span>
              </div>
            </div>
          </section>

          {/* Contact Us */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <EnvelopeIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-pink-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Contact Us</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions about this Privacy Policy or how we handle your data, please contact us at:
            </p>
            <a
              href="mailto:privacy@ratiotuta.com"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-semibold rounded-lg transition-colors"
            >
              <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              privacy@ratiotuta.com
            </a>
          </section>

          {/* Changes to This Policy */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <BellAlertIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Changes to This Policy</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by
              posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
