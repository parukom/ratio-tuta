'use client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FirstPagesHeader } from '@/components/FirstPagesHeader'
import { useEffect, useState } from 'react'
import {
  WrenchScrewdriverIcon,
  CircleStackIcon,
  CloudIcon,
  LockClosedIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

type SessionData = {
  userId: string;
  name: string;
  role: 'USER' | 'ADMIN';
} | null;

export default function DeveloperGuidePage() {
  const t = useTranslations('Docs')
  const tSections = useTranslations('Docs.developerGuide.sections')
  const [session, setSession] = useState<SessionData>(null)

  useEffect(() => {
    fetchSession()
  }, [])

  async function fetchSession() {
    try {
      const res = await fetch('/api/me')
      if (res.ok) {
        const data = await res.json()
        setSession({
          userId: data.id,
          name: data.name,
          role: data.role
        })
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <FirstPagesHeader session={session} />

      <div className="relative isolate px-6 pt-24 lg:px-8">
        <div className="mx-auto max-w-4xl py-12">
          {/* Back Link */}
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mb-8"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Documentation
          </Link>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('developerGuide.title')}
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              {t('developerGuide.description')}
            </p>
          </div>

          {/* Architecture */}
          <section id="architecture" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tSections('architecture.title')}
              </h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Pecunia is built with modern web technologies for performance, scalability, and developer experience.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Tech Stack
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Frontend</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• <strong>Next.js 15.5.0</strong> - React framework with App Router</li>
                    <li>• <strong>TypeScript</strong> - Type safety</li>
                    <li>• <strong>Tailwind CSS</strong> - Utility-first styling</li>
                    <li>• <strong>next-intl</strong> - Internationalization</li>
                    <li>• <strong>React Hot Toast</strong> - Notifications</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Backend</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• <strong>Next.js API Routes</strong> - Serverless endpoints</li>
                    <li>• <strong>Prisma</strong> - ORM and database toolkit</li>
                    <li>• <strong>PostgreSQL</strong> - Relational database</li>
                    <li>• <strong>bcryptjs</strong> - Password hashing</li>
                    <li>• <strong>iron-session</strong> - Secure sessions</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Infrastructure</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• <strong>AWS S3</strong> - File storage (avatars, images)</li>
                    <li>• <strong>Upstash Redis</strong> - Rate limiting & caching</li>
                    <li>• <strong>Resend</strong> - Transactional emails</li>
                    <li>• <strong>Vercel</strong> - Deployment platform</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Security</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• <strong>CSRF Protection</strong> - Stateless HMAC tokens</li>
                    <li>• <strong>CSP Headers</strong> - Content Security Policy</li>
                    <li>• <strong>Rate Limiting</strong> - DDoS protection</li>
                    <li>• <strong>AES-256-GCM</strong> - Email encryption</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Project Structure
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`pecunia/
├── src/
│   ├── app/                  # Next.js 15 App Router
│   │   ├── api/             # API endpoints
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # Admin dashboard
│   │   ├── cash-register/   # POS interface
│   │   └── docs/            # Documentation
│   ├── components/          # React components
│   │   ├── admin-zone/      # Admin UI components
│   │   ├── cash-register/   # POS components
│   │   └── ui/              # Reusable UI elements
│   ├── lib/                 # Utility libraries
│   │   ├── api-client.ts    # CSRF-enabled API wrapper
│   │   ├── auth.ts          # Authentication helpers
│   │   ├── csrf.ts          # CSRF token generation
│   │   ├── session.ts       # Session management
│   │   └── prisma.ts        # Database client
│   └── hooks/               # Custom React hooks
├── prisma/
│   └── schema.prisma        # Database schema
├── lib/                     # Shared backend utilities
├── public/                  # Static assets
└── messages/                # i18n translations`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Design Patterns
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Server Components:</strong> Default for data fetching and SSR</li>
                <li><strong>Client Components:</strong> Only when needed for interactivity</li>
                <li><strong>API Route Handlers:</strong> RESTful endpoints in <code>/app/api</code></li>
                <li><strong>Middleware:</strong> Session validation, CSRF, rate limiting</li>
                <li><strong>Custom Hooks:</strong> Reusable stateful logic (e.g., <code>useCsrfToken</code>)</li>
                <li><strong>Repository Pattern:</strong> Database operations abstracted via Prisma</li>
              </ul>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Architecture Principle:</strong> We follow a pragmatic approach - use server components for data fetching, client components for interactivity, and API routes for mutations.
                </p>
              </div>
            </div>
          </section>

          {/* Database */}
          <section id="database" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                <CircleStackIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tSections('database.title')}
              </h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                PostgreSQL database managed with Prisma ORM for type-safe queries and migrations.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Core Models
              </h3>
              <div className="space-y-4">
                <details className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    User & Authentication
                  </summary>
                  <div className="p-4 pt-0 text-sm text-gray-700 dark:text-gray-300">
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">{`model User {
  id              String    @id @default(cuid())
  email           String    @unique
  emailHmac       String    @unique  // HMAC for lookups
  emailEncrypted  String            // AES-256-GCM encrypted
  passwordHash    String
  firstName       String
  lastName        String
  role            Role      @default(USER)
  emailVerified   Boolean   @default(false)
  avatarUrl       String?
  createdAt       DateTime  @default(now())
}`}</pre>
                    <p className="mt-2">
                      <strong>Security:</strong> Emails are encrypted (AES-256-GCM) and HMAC-indexed for secure lookups.
                    </p>
                  </div>
                </details>

                <details className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    Team & Members
                  </summary>
                  <div className="p-4 pt-0 text-sm text-gray-700 dark:text-gray-300">
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">{`model Team {
  id          String         @id @default(cuid())
  name        String
  ownerId     String
  members     TeamMember[]
  places      Place[]
  items       Item[]
  plan        SubscriptionPlan @default(FREE)
}

model TeamMember {
  id       String   @id @default(cuid())
  teamId   String
  userId   String
  role     TeamRole @default(MEMBER)
}`}</pre>
                    <p className="mt-2">
                      <strong>Multi-tenancy:</strong> Team-based isolation for security and data separation.
                    </p>
                  </div>
                </details>

                <details className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    Place (Location)
                  </summary>
                  <div className="p-4 pt-0 text-sm text-gray-700 dark:text-gray-300">
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">{`model Place {
  id          String    @id @default(cuid())
  teamId      String
  name        String
  address1    String?
  city        String?
  country     String?
  timezone    String?
  currency    String    @default("EUR")
  isActive    Boolean   @default(true)
  receipts    Receipt[]
  createdAt   DateTime  @default(now())
}`}</pre>
                  </div>
                </details>

                <details className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    Item (Product)
                  </summary>
                  <div className="p-4 pt-0 text-sm text-gray-700 dark:text-gray-300">
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">{`model Item {
  id              String          @id @default(cuid())
  teamId          String
  name            String
  sku             String?
  price           Float
  pricePaid       Float?
  taxRateBps      Int             // Basis points (100 = 1%)
  imageUrl        String
  measurementType MeasurementType @default(PCS)
  stockQuantity   Float           @default(0)
  categoryId      String?
  isActive        Boolean         @default(true)
}`}</pre>
                    <p className="mt-2">
                      <strong>Measurement Types:</strong> PCS, WEIGHT, LENGTH, VOLUME, AREA
                    </p>
                  </div>
                </details>

                <details className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    Receipt & Line Items
                  </summary>
                  <div className="p-4 pt-0 text-sm text-gray-700 dark:text-gray-300">
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-2 overflow-x-auto">{`model Receipt {
  id            String        @id @default(cuid())
  placeId       String
  userId        String
  totalAmount   Float
  taxAmount     Float
  amountGiven   Float
  changeAmount  Float
  paymentOption PaymentOption
  lineItems     ReceiptLineItem[]
  createdAt     DateTime      @default(now())
}

model ReceiptLineItem {
  id          String  @id @default(cuid())
  receiptId   String
  itemId      String
  quantity    Float
  unitPrice   Float
  totalPrice  Float
  taxRateBps  Int
}`}</pre>
                  </div>
                </details>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Database Operations
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// Run migrations
npm run prisma:migrate

// Generate Prisma Client
npm run prisma:generate

// Open Prisma Studio (GUI)
npm run prisma:studio

// Reset database (development only!)
npm run prisma:reset`}
              </pre>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Security:</strong> All database queries use parameterized statements via Prisma. Email addresses are encrypted at rest and HMAC-indexed for secure lookups.
                </p>
              </div>
            </div>
          </section>

          {/* API */}
          <section id="api" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                <CloudIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tSections('api.title')}
              </h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                RESTful API built with Next.js 15 API Routes. All endpoints require authentication unless marked as public.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Authentication Endpoints
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-blue-500">
                  <code className="text-sm">POST /api/login</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Login with email & password. Returns user data and sets session cookie.
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-2 rounded mt-2 text-xs overflow-x-auto">{`// Request
{ "email": "user@example.com", "password": "***", "remember": true }

// Response
{ "id": "...", "email": "...", "role": "USER" }`}</pre>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-green-500">
                  <code className="text-sm">POST /api/register/self</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Register new user account. Sends verification email.
                  </p>
                  <pre className="bg-gray-900 text-gray-100 p-2 rounded mt-2 text-xs overflow-x-auto">{`// Request
{ "name": "John Doe", "email": "...", "password": "...", "teamName": "..." }

// Response
{ "message": "Account created. Please verify your email." }`}</pre>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-red-500">
                  <code className="text-sm">POST /api/logout</code>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    End session and clear cookies. <strong>Requires CSRF token.</strong>
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Resource Endpoints
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Endpoint</th>
                      <th className="px-4 py-2 text-left font-semibold">Method</th>
                      <th className="px-4 py-2 text-left font-semibold">Description</th>
                      <th className="px-4 py-2 text-left font-semibold">CSRF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-2"><code>/api/users/me</code></td>
                      <td className="px-4 py-2">GET</td>
                      <td className="px-4 py-2">Get current user</td>
                      <td className="px-4 py-2">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code>/api/users/me</code></td>
                      <td className="px-4 py-2">PATCH</td>
                      <td className="px-4 py-2">Update profile</td>
                      <td className="px-4 py-2">✅</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code>/api/users/me</code></td>
                      <td className="px-4 py-2">DELETE</td>
                      <td className="px-4 py-2">Delete account</td>
                      <td className="px-4 py-2">✅</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code>/api/places</code></td>
                      <td className="px-4 py-2">GET</td>
                      <td className="px-4 py-2">List places</td>
                      <td className="px-4 py-2">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code>/api/places</code></td>
                      <td className="px-4 py-2">POST</td>
                      <td className="px-4 py-2">Create place</td>
                      <td className="px-4 py-2">✅</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code>/api/places/[id]</code></td>
                      <td className="px-4 py-2">PATCH</td>
                      <td className="px-4 py-2">Update place</td>
                      <td className="px-4 py-2">✅</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code>/api/places/[id]</code></td>
                      <td className="px-4 py-2">DELETE</td>
                      <td className="px-4 py-2">Delete place</td>
                      <td className="px-4 py-2">✅</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code>/api/items</code></td>
                      <td className="px-4 py-2">GET</td>
                      <td className="px-4 py-2">List items</td>
                      <td className="px-4 py-2">❌</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code>/api/items</code></td>
                      <td className="px-4 py-2">POST</td>
                      <td className="px-4 py-2">Create item</td>
                      <td className="px-4 py-2">✅</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2"><code>/api/receipts</code></td>
                      <td className="px-4 py-2">POST</td>
                      <td className="px-4 py-2">Create receipt</td>
                      <td className="px-4 py-2">✅</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Using the API Client
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Frontend uses a CSRF-enabled API wrapper:
              </p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { api, ApiError } from '@/lib/api-client'

// GET request (no CSRF needed)
const data = await api.get('/api/places')

// POST request (CSRF auto-included)
const newPlace = await api.post('/api/places', {
  name: 'New Store',
  currency: 'EUR'
})

// PATCH request
const updated = await api.patch('/api/places/123', {
  name: 'Updated Name'
})

// DELETE request
await api.delete('/api/places/123')

// Error handling
try {
  await api.post('/api/places', data)
} catch (err) {
  if (err instanceof ApiError) {
    console.error(err.message, err.status)
  }
}`}
              </pre>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✅ CSRF Protection:</strong> All POST/PATCH/PUT/DELETE requests automatically include a CSRF token via the <code>X-CSRF-Token</code> header.
                </p>
              </div>
            </div>
          </section>

          {/* Security */}
          <section id="security" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                <LockClosedIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tSections('security.title')}
              </h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Comprehensive security implementation following OWASP guidelines and industry best practices.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                CSRF Protection
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Implementation:</strong> Stateless HMAC-based tokens tied to user sessions
                </p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                  <li>Token format: <code>randomValue.hmac(randomValue:userId)</code></li>
                  <li>No server-side storage required</li>
                  <li>Timing-safe token comparison (prevents timing attacks)</li>
                  <li>Auto-included in all state-changing requests</li>
                  <li>9 critical endpoints protected</li>
                </ul>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded mt-3 text-xs overflow-x-auto">{`// Backend validation
import { requireCsrfToken } from '@lib/csrf'

export async function POST(req: Request) {
  const session = await getSession()
  requireCsrfToken(req, session) // Throws if invalid
  // ... handle request
}`}</pre>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Authentication & Sessions
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Password Hashing:</strong> bcrypt with 12 rounds</li>
                <li><strong>Password Requirements:</strong> 8-128 characters, complexity checks</li>
                <li><strong>Pwned Password Check:</strong> k-Anonymity API integration</li>
                <li><strong>Session Cookies:</strong> HttpOnly, Secure, SameSite=Strict, __Host- prefix</li>
                <li><strong>Session Storage:</strong> iron-session with AES-256-GCM encryption</li>
                <li><strong>Email Verification:</strong> Required for account activation</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Data Protection
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Email Encryption</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• AES-256-GCM at rest</li>
                    <li>• HMAC-SHA256 for lookups</li>
                    <li>• Prevents data breach exposure</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">File Storage</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• AWS S3 with signed URLs</li>
                    <li>• 5MB max file size</li>
                    <li>• MIME type validation</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Security Headers
              </h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// next.config.ts
headers: [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; img-src 'self' data: https://*.amazonaws.com;"
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
]`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Rate Limiting
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Authentication:</strong> 5 attempts per 15 minutes per IP</li>
                <li><strong>API Endpoints:</strong> Sliding window algorithm</li>
                <li><strong>Storage:</strong> Upstash Redis (distributed)</li>
                <li><strong>Response Headers:</strong> X-RateLimit-* for debugging</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Audit Logging
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                All security-sensitive actions are logged:
              </p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { logAudit } from '@lib/logger'

await logAudit({
  action: 'user.login.success',
  status: 'SUCCESS',
  userId: user.id,
  metadata: { ip: req.ip }
})`}
              </pre>

              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>🔒 Security Checklist:</strong> Never commit secrets (.env), always use HTTPS in production, rotate JWT secrets regularly, monitor audit logs for suspicious activity.
                </p>
              </div>
            </div>
          </section>

          {/* Deployment */}
          <section id="deployment" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600">
                <CloudIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tSections('deployment.title')}
              </h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Deploy to production with Vercel, PostgreSQL, and AWS services.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Environment Variables
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Required environment variables (see <code>.env.example</code>):
              </p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# Database
DATABASE_URL="postgresql://..."

# Sessions
SESSION_SECRET="strong-random-secret-min-32-chars"

# AWS S3 (file uploads)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="pecunia-files"

# Email (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Redis (rate limiting)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# App
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"`}
              </pre>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Deployment Steps
              </h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Set up PostgreSQL database</strong>
                  <pre className="bg-gray-900 text-gray-100 p-2 rounded mt-2 text-xs">
{`# Use Vercel Postgres, Supabase, or any PostgreSQL provider
# Run migrations
npx prisma migrate deploy`}
                  </pre>
                </li>
                <li>
                  <strong>Configure AWS S3 bucket</strong>
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-sm">
                    <li>Create bucket with private access</li>
                    <li>Configure CORS for your domain</li>
                    <li>Create IAM user with S3 permissions</li>
                  </ul>
                </li>
                <li>
                  <strong>Set up Redis (Upstash)</strong>
                  <pre className="bg-gray-900 text-gray-100 p-2 rounded mt-2 text-xs">
{`# Create Redis database at upstash.com
# Copy REST URL and token to env vars`}
                  </pre>
                </li>
                <li>
                  <strong>Deploy to Vercel</strong>
                  <pre className="bg-gray-900 text-gray-100 p-2 rounded mt-2 text-xs">
{`# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or connect GitHub repo for auto-deploys`}
                  </pre>
                </li>
                <li>
                  <strong>Set environment variables in Vercel dashboard</strong>
                </li>
                <li>
                  <strong>Configure custom domain</strong>
                </li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Production Checklist
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="mt-1" />
                  <span>Database migrations applied</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="mt-1" />
                  <span>All environment variables set</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="mt-1" />
                  <span>SESSION_SECRET is cryptographically strong (32+ chars)</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="mt-1" />
                  <span>HTTPS enabled (automatic with Vercel)</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="mt-1" />
                  <span>Email sending configured and tested</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="mt-1" />
                  <span>S3 bucket CORS configured for your domain</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="mt-1" />
                  <span>Rate limiting enabled (Upstash Redis connected)</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="mt-1" />
                  <span>Audit logging reviewed</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="mt-1" />
                  <span>Error monitoring configured (Sentry, etc.)</span>
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Monitoring
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Vercel Analytics:</strong> Performance and usage metrics</li>
                <li><strong>Database:</strong> Monitor connection pool, query performance</li>
                <li><strong>Redis:</strong> Check rate limit hits, cache performance</li>
                <li><strong>S3:</strong> Monitor storage usage and costs</li>
                <li><strong>Logs:</strong> Review audit logs for security events</li>
              </ul>

              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-sm text-indigo-800 dark:text-indigo-200">
                  <strong>🚀 Performance:</strong> Next.js automatically optimizes your app with code splitting, image optimization, and edge caching. Vercel provides global CDN distribution.
                </p>
              </div>
            </div>
          </section>

          {/* Quick Links */}
          <div className="mt-16 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Additional Resources
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/docs"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                ← Back to All Documentation
              </Link>
              <Link
                href="/docs/user"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                User Guide →
              </Link>
              <a
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Next.js Documentation ↗
              </a>
              <a
                href="https://www.prisma.io/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Prisma Documentation ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
