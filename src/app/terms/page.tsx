import Link from 'next/link'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BellAlertIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  XCircleIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

export default function TermsAndConditions() {
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
            <DocumentTextIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl xl:text-6xl dark:text-white px-2">
            Terms & Conditions
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 px-2">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Welcome Banner */}
        <div className="mt-8 sm:mt-10 lg:mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-xl">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">Welcome to Ratio Tuta</h2>
          <p className="text-base sm:text-lg text-indigo-50">
            By using Ratio Tuta, you agree to these Terms and Conditions. Please read them carefully.
          </p>
        </div>

        {/* Content Sections */}
        <div className="mt-8 sm:mt-10 lg:mt-12 space-y-6 sm:space-y-8">

          {/* Acceptance of Terms */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <CheckCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              By accessing or using Ratio Tuta, you agree to be bound by these Terms and Conditions and our Privacy Policy.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          {/* Description of Service */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <DocumentDuplicateIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">2. Description of Service</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              Ratio Tuta provides a privacy-focused point-of-sale (POS) and business management platform. Our service includes:
            </p>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-blue-500 mt-0.5 sm:mt-1 text-sm sm:text-base">•</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Inventory management and tracking</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-blue-500 mt-0.5 sm:mt-1 text-sm sm:text-base">•</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Sales processing and reporting</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-blue-500 mt-0.5 sm:mt-1 text-sm sm:text-base">•</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Multi-location support</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-blue-500 mt-0.5 sm:mt-1 text-sm sm:text-base">•</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Team collaboration tools</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-blue-500 mt-0.5 sm:mt-1 text-sm sm:text-base">•</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Analytics and insights</span>
              </li>
            </ul>
          </section>

          {/* User Accounts */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <UserCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-indigo-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">3. User Accounts</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              To use Ratio Tuta, you must create an account. You are responsible for:
            </p>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                </div>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Maintaining the confidentiality of your account credentials</span>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                </div>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">All activities that occur under your account</span>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                </div>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Notifying us immediately of any unauthorized use</span>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                </div>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Ensuring your account information is accurate and up-to-date</span>
              </div>
            </div>
          </section>

          {/* Privacy and Data Ownership */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <ShieldCheckIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">4. Privacy and Data Ownership</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              <strong>Your data belongs to you.</strong> We are committed to protecting your privacy:
            </p>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We do not sell, trade, or monetize your data</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We do not analyze your business data for our benefit</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">You can export or delete your data at any time</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-green-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✓</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  See our <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-semibold underline">Privacy Policy</Link> for full details
                </span>
              </li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <XCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-red-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">5. Acceptable Use</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">You agree not to:</p>
            <ul className="space-y-2.5 sm:space-y-3">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Use the service for any illegal or unauthorized purpose</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Violate any laws in your jurisdiction</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Infringe on intellectual property rights</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Transmit viruses, malware, or harmful code</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Attempt to gain unauthorized access to our systems</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-red-500 mt-0.5 sm:mt-1 text-sm sm:text-base">✗</span>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Interfere with or disrupt the service</span>
              </li>
            </ul>
          </section>

          {/* Service Availability */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <BellAlertIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">6. Service Availability</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              We strive to provide reliable, uninterrupted service. However:
            </p>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We do not guarantee 100% uptime</p>
              </div>
              <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We may perform maintenance that temporarily affects service</p>
              </div>
              <div className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">We will notify you of scheduled maintenance when possible</p>
              </div>
            </div>
          </section>

          {/* Pricing and Payment */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <CurrencyDollarIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">7. Pricing and Payment</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Ratio Tuta offers a free version with no time limit</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Paid plans are available for additional features and capacity</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Pricing is transparent with no hidden fees</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">You may cancel your subscription at any time</p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 sm:col-span-2">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Refunds are handled on a case-by-case basis</p>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <DocumentTextIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-pink-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">8. Intellectual Property</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              Ratio Tuta and its original content, features, and functionality are owned by Ratio Tuta and are protected
              by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <ScaleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">9. Limitation of Liability</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              To the maximum extent permitted by law, Ratio Tuta shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your use or inability to use the service.
            </p>
          </section>

          {/* Termination */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <XCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-gray-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">10. Termination</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              We reserve the right to terminate or suspend your account if you violate these Terms and Conditions.
              You may also terminate your account at any time through your account settings.
            </p>
          </section>

          {/* Changes to Terms */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <BellAlertIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">11. Changes to Terms</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              We may update these Terms and Conditions from time to time. We will notify you of significant changes
              by posting the new terms on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          {/* Governing Law */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <ScaleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-indigo-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">12. Governing Law</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              These Terms and Conditions are governed by and construed in accordance with the laws of Lithuania,
              without regard to its conflict of law provisions.
            </p>
          </section>

          {/* Contact Us */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <EnvelopeIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">13. Contact Us</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            <a
              href="mailto:legal@ratiotuta.com"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-semibold rounded-lg transition-colors"
            >
              <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              legal@ratiotuta.com
            </a>
          </section>

          {/* Entire Agreement */}
          <section className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <DocumentDuplicateIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-teal-500 flex-shrink-0" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">14. Entire Agreement</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              These Terms and Conditions, together with our Privacy Policy, constitute the entire agreement between
              you and Ratio Tuta regarding the use of our service.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
