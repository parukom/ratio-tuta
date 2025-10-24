'use client'
/* eslint-disable react/no-unescaped-entities */
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FirstPagesHeader } from '@/components/FirstPagesHeader'
import { useEffect, useState } from 'react'
import {
  RocketLaunchIcon,
  MapIcon,
  CubeIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

type SessionData = {
  userId: string;
  name: string;
  role: 'USER' | 'ADMIN';
} | null;

export default function UserGuidePage() {
  const t = useTranslations('Docs')
  const tSections = useTranslations('Docs.userGuide.sections')
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
              {t('userGuide.title')}
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              {t('userGuide.description')}
            </p>
          </div>

          {/* Getting Started */}
          <section id="gettingStarted" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                <RocketLaunchIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tSections('gettingStarted.title')}
              </h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Welcome to Pecunia! This guide will help you get started with managing your business operations.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Creating Your Account
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Visit the <Link href="/auth?form=signup" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">registration page</Link></li>
                <li>Fill in your name, email, password (8-128 characters), and team name</li>
                <li>Click "Create Account" and verify your email address</li>
                <li>Log in with your credentials</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                First Steps
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                After logging in for the first time:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Create a Place:</strong> Set up your first business location (store, restaurant, event, etc.)</li>
                <li><strong>Add Items:</strong> Build your inventory with products you sell</li>
                <li><strong>Invite Team Members:</strong> Add staff who will help manage operations</li>
                <li><strong>Start Selling:</strong> Use the cash register to process transactions</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Navigation
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The main navigation menu includes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Dashboard:</strong> Overview of your business metrics</li>
                <li><strong>Cash Register:</strong> Process sales and create receipts</li>
                <li><strong>Places:</strong> Manage your business locations</li>
                <li><strong>Items:</strong> Manage your inventory</li>
                <li><strong>Documents:</strong> View receipts and reports</li>
                <li><strong>Team:</strong> Manage team members and permissions</li>
                <li><strong>Settings:</strong> Configure your account and preferences</li>
              </ul>
            </div>
          </section>

          {/* Places */}
          <section id="places" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tSections('places.title')}
              </h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Places represent your physical or virtual business locations. Each place can have its own inventory, team assignments, and sales tracking.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Creating a Place
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Navigate to <strong>Dashboard → Places</strong></li>
                <li>Click <strong>"Create Place"</strong></li>
                <li>Fill in the information:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>Name (required):</strong> Your location name - can be anything you like (e.g., "My Shop", "Downtown Store", "Store #1")</li>
                    <li><strong>Address (optional):</strong> Physical address - can be added later</li>
                    <li><strong>City & Country (optional):</strong> Location details</li>
                    <li><strong>Timezone (optional):</strong> Local timezone for accurate reporting (e.g., Europe/Vilnius)</li>
                    <li><strong>Currency (optional):</strong> Default currency (e.g., EUR, USD) - defaults to EUR if not specified</li>
                  </ul>
                </li>
                <li>Click <strong>"Create"</strong> to save</li>
              </ol>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✅ Quick Start:</strong> To get started quickly, you only need to provide a name. All other fields (address, timezone, currency) are optional and can be added or updated later in the place settings.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Managing Places
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You can:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Edit:</strong> Update place details, address, or settings</li>
                <li><strong>Assign Items:</strong> Link inventory items to this location</li>
                <li><strong>Assign Staff:</strong> Designate team members to work at this place</li>
                <li><strong>View Reports:</strong> See sales and performance metrics per location</li>
                <li><strong>Activate/Deactivate:</strong> Temporarily close a location without deleting it</li>
                <li><strong>Delete:</strong> Permanently remove a place (requires confirmation)</li>
              </ul>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Tip:</strong> Use multiple places to separate different locations, events, or business units for better reporting and management.
                </p>
              </div>
            </div>
          </section>

          {/* Inventory */}
          <section id="inventory" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                <CubeIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tSections('inventory.title')}
              </h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Manage your products, track stock levels, and organize items by categories. Items are displayed as visual cards showing key information at a glance.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Adding Items
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Go to <strong>Dashboard → Items</strong></li>
                <li>Click <strong>"+ Create"</strong> button</li>
                <li>Choose between:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>Create Item:</strong> Add a single product</li>
                    <li><strong>Add Box:</strong> Create multiple variants at once (e.g., shoes in sizes 35, 36, 37)</li>
                  </ul>
                </li>
                <li>Fill in item details:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>Name:</strong> Product name</li>
                    <li><strong>SKU:</strong> Stock keeping unit (optional)</li>
                    <li><strong>Price:</strong> Selling price</li>
                    <li><strong>Cost:</strong> Purchase cost (for profit calculations)</li>
                    <li><strong>Tax Rate:</strong> VAT or sales tax percentage</li>
                    <li><strong>Image:</strong> Product photo (required)</li>
                    <li><strong>Measurement Type:</strong> PCS (pieces), WEIGHT (kg/g), LENGTH (m/cm), etc.</li>
                    <li><strong>Stock Quantity:</strong> Current inventory level</li>
                    <li><strong>Category:</strong> Organize items by type</li>
                    <li><strong>Size/Color:</strong> Variant details (optional)</li>
                  </ul>
                </li>
                <li>Click <strong>"Create"</strong></li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Viewing Item Details
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Items are displayed as compact cards showing:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Product Image:</strong> Visual representation or color swatch</li>
                <li><strong>Name:</strong> Item or box name</li>
                <li><strong>Stock Level:</strong> Current available quantity</li>
                <li><strong>Price:</strong> Selling price per unit</li>
                <li><strong>Variant Badge:</strong> Shows number of sizes/colors for grouped items</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                <strong>Click any card</strong> to open a detailed drawer showing:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Full product information (status, SKU, pricing, tax, measurements)</li>
                <li>Complete description and tags</li>
                <li><strong>For grouped items:</strong> List of all variants with individual stock levels</li>
                <li>Brand, color, and other metadata</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Boxes and Grouped Items
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you have multiple variants of the same product (e.g., T-shirt in S/M/L/XL), use <strong>"Add Box"</strong> to create them together:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>All variants share the same base name, price, and tax rate</li>
                <li>Each variant can have different sizes, colors, and stock levels</li>
                <li>Grouped items appear as a single card with a <strong>"variants"</strong> badge</li>
                <li>Click the grouped card to see all variants with individual stock quantities</li>
                <li>Edit or delete individual variants, or manage the entire box at once</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Item Categories
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Categories help organize your inventory:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Create categories like "Beverages", "Food", "Merchandise", etc.</li>
                <li>Assign items to categories for easier browsing</li>
                <li>Filter items by category in both the Items page and cash register</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Measurement Types
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Different selling methods for different products:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>PCS (Pieces):</strong> Sell by unit (e.g., bottles, shirts)</li>
                <li><strong>WEIGHT:</strong> Sell by weight in kg or grams (e.g., coffee, meat)</li>
                <li><strong>LENGTH:</strong> Sell by length in meters or cm (e.g., fabric, cable)</li>
                <li><strong>VOLUME:</strong> Sell by volume in liters or ml (e.g., bulk liquids)</li>
                <li><strong>AREA:</strong> Sell by area in m² or cm² (e.g., tiles, wallpaper)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Managing Items
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Edit:</strong> Click "Edit" button on any card to update details or adjust stock</li>
                <li><strong>Delete:</strong> Remove items permanently (with confirmation)</li>
                <li><strong>Toggle View:</strong> Switch between Cards view and Table view</li>
                <li><strong>Group Toggle:</strong> Group similar items or show all items individually</li>
                <li><strong>Search:</strong> Find items by name quickly</li>
                <li><strong>Filter:</strong> Show only active items, in-stock items, or by category</li>
                <li><strong>Sort:</strong> Order by name, price, stock level, or creation date</li>
              </ul>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Important:</strong> Stock quantities are tracked in the base unit (grams for WEIGHT, cm for LENGTH, ml for VOLUME, cm² for AREA). The system converts between units automatically when displaying or editing.
                </p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Pro Tip:</strong> Use the grouped view to keep your inventory organized. Items with the same base name and color are automatically grouped together, making it easier to manage products with multiple sizes or variants.
                </p>
              </div>
            </div>
          </section>

          {/* Cash Register */}
          <section id="cashRegister" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                <CreditCardIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tSections('cashRegister.title')}
              </h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The cash register is your point-of-sale (POS) system for processing transactions.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Making a Sale
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Navigate to <strong>Cash Register</strong> from the main menu</li>
                <li>Select the <strong>Place</strong> where you're selling (if you have multiple)</li>
                <li>Browse or search for items</li>
                <li>Click on items to add them to the cart:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>For <strong>PCS items:</strong> Each click adds 1 unit</li>
                    <li>For <strong>WEIGHT/LENGTH items:</strong> Enter the amount (kg, meters, etc.)</li>
                    <li>Items with variants (sizes, colors) show a selection modal</li>
                  </ul>
                </li>
                <li>Review the cart on the right side:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>See item names, quantities, and prices</li>
                    <li>View subtotal, tax, and total</li>
                    <li>Adjust quantities if needed</li>
                  </ul>
                </li>
                <li>Click <strong>"Checkout"</strong></li>
                <li>Choose payment method: <strong>Cash</strong> or <strong>Card</strong></li>
                <li>For cash payments:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Enter amount received from customer</li>
                    <li>System calculates change automatically</li>
                  </ul>
                </li>
                <li>Click <strong>"Complete Sale"</strong></li>
                <li>Receipt is generated and stock is updated automatically</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Cash Register Features
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Search:</strong> Quickly find items by name or SKU</li>
                <li><strong>Filters:</strong> Show only in-stock items, filter by category</li>
                <li><strong>Sort:</strong> Sort by name, price, or stock level</li>
                <li><strong>Cart Preview:</strong> Real-time total calculation with tax</li>
                <li><strong>Quick Actions:</strong> Fast buttons for common items</li>
                <li><strong>Stock Warnings:</strong> Visual indicators for low/out-of-stock items</li>
              </ul>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✅ Pro Tip:</strong> The cash register automatically updates inventory levels after each sale. You can view transaction history in the Documents section.
                </p>
              </div>
            </div>
          </section>

          {/* Reports */}
          <section id="reports" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tSections('reports.title')}
              </h2>
            </div>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Track your business performance with comprehensive reports and analytics.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Available Reports
              </h3>
              <ul className="list-disc list-inside space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Sales Overview:</strong> Total revenue, number of transactions, average transaction value
                </li>
                <li>
                  <strong>By Place:</strong> Compare performance across different locations
                </li>
                <li>
                  <strong>By Item:</strong> See which products sell best
                </li>
                <li>
                  <strong>By Category:</strong> Analyze sales by product category
                </li>
                <li>
                  <strong>By Time Period:</strong> Daily, weekly, monthly, and custom date ranges
                </li>
                <li>
                  <strong>Payment Methods:</strong> Cash vs. card transaction breakdown
                </li>
                <li>
                  <strong>Tax Reports:</strong> VAT/sales tax collected for accounting
                </li>
                <li>
                  <strong>Stock Levels:</strong> Current inventory status and low-stock alerts
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Accessing Reports
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Go to <strong>Dashboard → Home</strong> for overview metrics</li>
                <li>Visit <strong>Documents</strong> to see all receipts</li>
                <li>Filter by date range, place, or payment method</li>
                <li>Export data for external analysis (coming soon)</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                Key Metrics
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Monitor these important business indicators:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Revenue:</strong> Total sales income</li>
                <li><strong>Gross Profit:</strong> Revenue minus cost of goods sold</li>
                <li><strong>Transaction Count:</strong> Number of sales completed</li>
                <li><strong>Average Order Value:</strong> Revenue divided by transactions</li>
                <li><strong>Items Sold:</strong> Total quantity of products sold</li>
                <li><strong>Top Sellers:</strong> Best-performing products</li>
                <li><strong>Stock Turnover:</strong> How quickly inventory sells</li>
              </ul>

              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <strong>📊 Data Insights:</strong> Reports are updated in real-time. Use date filters to compare different time periods and identify trends.
                </p>
              </div>
            </div>
          </section>

          {/* Quick Links */}
          <div className="mt-16 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Need More Help?
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/docs"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                ← Back to All Documentation
              </Link>
              <Link
                href="/docs/developer"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Developer Guide →
              </Link>
              <Link
                href="/dashboard/home"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Go to Dashboard →
              </Link>
              <Link
                href="/auth"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Sign Up / Login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
