'use client'
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
            {t('userGuide.backToDocumentation')}
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
                {tSections('gettingStarted.content.intro')}
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('gettingStarted.content.creatingAccount.title')}
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{tSections('gettingStarted.content.creatingAccount.step1')} <Link href="/auth?form=signup" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">registration page</Link></li>
                <li>{tSections('gettingStarted.content.creatingAccount.step2')}</li>
                <li>{tSections('gettingStarted.content.creatingAccount.step3')}</li>
                <li>{tSections('gettingStarted.content.creatingAccount.step4')}</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('gettingStarted.content.firstSteps.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {tSections('gettingStarted.content.firstSteps.intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>{tSections('gettingStarted.content.firstSteps.createPlace.label')}:</strong> {tSections('gettingStarted.content.firstSteps.createPlace.description')}</li>
                <li><strong>{tSections('gettingStarted.content.firstSteps.addItems.label')}:</strong> {tSections('gettingStarted.content.firstSteps.addItems.description')}</li>
                <li><strong>{tSections('gettingStarted.content.firstSteps.inviteTeam.label')}:</strong> {tSections('gettingStarted.content.firstSteps.inviteTeam.description')}</li>
                <li><strong>{tSections('gettingStarted.content.firstSteps.startSelling.label')}:</strong> {tSections('gettingStarted.content.firstSteps.startSelling.description')}</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('gettingStarted.content.navigation.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {tSections('gettingStarted.content.navigation.intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>{tSections('gettingStarted.content.navigation.dashboard.label')}:</strong> {tSections('gettingStarted.content.navigation.dashboard.description')}</li>
                <li><strong>{tSections('gettingStarted.content.navigation.cashRegister.label')}:</strong> {tSections('gettingStarted.content.navigation.cashRegister.description')}</li>
                <li><strong>{tSections('gettingStarted.content.navigation.places.label')}:</strong> {tSections('gettingStarted.content.navigation.places.description')}</li>
                <li><strong>{tSections('gettingStarted.content.navigation.items.label')}:</strong> {tSections('gettingStarted.content.navigation.items.description')}</li>
                <li><strong>{tSections('gettingStarted.content.navigation.documents.label')}:</strong> {tSections('gettingStarted.content.navigation.documents.description')}</li>
                <li><strong>{tSections('gettingStarted.content.navigation.team.label')}:</strong> {tSections('gettingStarted.content.navigation.team.description')}</li>
                <li><strong>{tSections('gettingStarted.content.navigation.settings.label')}:</strong> {tSections('gettingStarted.content.navigation.settings.description')}</li>
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
                {tSections('places.content.intro')}
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('places.content.creating.title')}
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{tSections('places.content.creating.step1')}</li>
                <li>{tSections('places.content.creating.step2')}</li>
                <li>{tSections('places.content.creating.step3')}
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>{tSections('places.content.creating.nameRequired.label')}:</strong> {tSections('places.content.creating.nameRequired.description')}</li>
                    <li><strong>{tSections('places.content.creating.addressOptional.label')}:</strong> {tSections('places.content.creating.addressOptional.description')}</li>
                    <li><strong>{tSections('places.content.creating.cityCountryOptional.label')}:</strong> {tSections('places.content.creating.cityCountryOptional.description')}</li>
                    <li><strong>{tSections('places.content.creating.timezoneOptional.label')}:</strong> {tSections('places.content.creating.timezoneOptional.description')}</li>
                    <li><strong>{tSections('places.content.creating.currencyOptional.label')}:</strong> {tSections('places.content.creating.currencyOptional.description')}</li>
                  </ul>
                </li>
                <li>{tSections('places.content.creating.step4')}</li>
              </ol>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✅ {tSections('places.content.creating.quickStartTip.label')}:</strong> {tSections('places.content.creating.quickStartTip.description')}
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('places.content.managing.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {tSections('places.content.managing.intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>{tSections('places.content.managing.edit.label')}:</strong> {tSections('places.content.managing.edit.description')}</li>
                <li><strong>{tSections('places.content.managing.assignItems.label')}:</strong> {tSections('places.content.managing.assignItems.description')}</li>
                <li><strong>{tSections('places.content.managing.assignStaff.label')}:</strong> {tSections('places.content.managing.assignStaff.description')}</li>
                <li><strong>{tSections('places.content.managing.viewReports.label')}:</strong> {tSections('places.content.managing.viewReports.description')}</li>
                <li><strong>{tSections('places.content.managing.activateDeactivate.label')}:</strong> {tSections('places.content.managing.activateDeactivate.description')}</li>
                <li><strong>{tSections('places.content.managing.delete.label')}:</strong> {tSections('places.content.managing.delete.description')}</li>
              </ul>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Tip:</strong> {tSections('places.content.managing.multiLocationTip')}
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
                {tSections('inventory.content.intro')}
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('inventory.content.adding.title')}
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{tSections('inventory.content.adding.step1')}</li>
                <li>{tSections('inventory.content.adding.step2')}</li>
                <li>{tSections('inventory.content.adding.step3')}
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>{tSections('inventory.content.adding.createItem.label')}:</strong> {tSections('inventory.content.adding.createItem.description')}</li>
                    <li><strong>{tSections('inventory.content.adding.addBox.label')}:</strong> {tSections('inventory.content.adding.addBox.description')}</li>
                  </ul>
                </li>
                <li>{tSections('inventory.content.adding.step4')}
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>{tSections('inventory.content.adding.name.label')}:</strong> {tSections('inventory.content.adding.name.description')}</li>
                    <li><strong>{tSections('inventory.content.adding.sku.label')}:</strong> {tSections('inventory.content.adding.sku.description')}</li>
                    <li><strong>{tSections('inventory.content.adding.price.label')}:</strong> {tSections('inventory.content.adding.price.description')}</li>
                    <li><strong>{tSections('inventory.content.adding.cost.label')}:</strong> {tSections('inventory.content.adding.cost.description')}</li>
                    <li><strong>{tSections('inventory.content.adding.taxRate.label')}:</strong> {tSections('inventory.content.adding.taxRate.description')}</li>
                    <li><strong>{tSections('inventory.content.adding.image.label')}:</strong> {tSections('inventory.content.adding.image.description')}</li>
                    <li><strong>{tSections('inventory.content.adding.measurementType.label')}:</strong> {tSections('inventory.content.adding.measurementType.description')}</li>
                    <li><strong>{tSections('inventory.content.adding.stockQuantity.label')}:</strong> {tSections('inventory.content.adding.stockQuantity.description')}</li>
                    <li><strong>{tSections('inventory.content.adding.category.label')}:</strong> {tSections('inventory.content.adding.category.description')}</li>
                    <li><strong>{tSections('inventory.content.adding.sizeColor.label')}:</strong> {tSections('inventory.content.adding.sizeColor.description')}</li>
                  </ul>
                </li>
                <li>{tSections('inventory.content.adding.step5')}</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('inventory.content.viewing.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {tSections('inventory.content.viewing.intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>{tSections('inventory.content.viewing.productImage.label')}:</strong> {tSections('inventory.content.viewing.productImage.description')}</li>
                <li><strong>{tSections('inventory.content.viewing.name.label')}:</strong> {tSections('inventory.content.viewing.name.description')}</li>
                <li><strong>{tSections('inventory.content.viewing.stockLevel.label')}:</strong> {tSections('inventory.content.viewing.stockLevel.description')}</li>
                <li><strong>{tSections('inventory.content.viewing.price.label')}:</strong> {tSections('inventory.content.viewing.price.description')}</li>
                <li><strong>{tSections('inventory.content.viewing.variantBadge.label')}:</strong> {tSections('inventory.content.viewing.variantBadge.description')}</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                <strong>{tSections('inventory.content.viewing.clickCard')}</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{tSections('inventory.content.viewing.fullInfo')}</li>
                <li>{tSections('inventory.content.viewing.description')}</li>
                <li><strong>{tSections('inventory.content.viewing.forGrouped.label')}:</strong> {tSections('inventory.content.viewing.forGrouped.description')}</li>
                <li>{tSections('inventory.content.viewing.metadata')}</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('inventory.content.boxes.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {tSections('inventory.content.boxes.intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{tSections('inventory.content.boxes.shared')}</li>
                <li>{tSections('inventory.content.boxes.different')}</li>
                <li>{tSections('inventory.content.boxes.singleCard')}</li>
                <li>{tSections('inventory.content.boxes.clickToView')}</li>
                <li>{tSections('inventory.content.boxes.manage')}</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('inventory.content.categories.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {tSections('inventory.content.categories.intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{tSections('inventory.content.categories.create')}</li>
                <li>{tSections('inventory.content.categories.assign')}</li>
                <li>{tSections('inventory.content.categories.filter')}</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('inventory.content.measurementTypes.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {tSections('inventory.content.measurementTypes.intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>{tSections('inventory.content.measurementTypes.pcs.label')}:</strong> {tSections('inventory.content.measurementTypes.pcs.description')}</li>
                <li><strong>{tSections('inventory.content.measurementTypes.weight.label')}:</strong> {tSections('inventory.content.measurementTypes.weight.description')}</li>
                <li><strong>{tSections('inventory.content.measurementTypes.length.label')}:</strong> {tSections('inventory.content.measurementTypes.length.description')}</li>
                <li><strong>{tSections('inventory.content.measurementTypes.volume.label')}:</strong> {tSections('inventory.content.measurementTypes.volume.description')}</li>
                <li><strong>{tSections('inventory.content.measurementTypes.area.label')}:</strong> {tSections('inventory.content.measurementTypes.area.description')}</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('inventory.content.managing.title')}
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>{tSections('inventory.content.managing.edit.label')}:</strong> {tSections('inventory.content.managing.edit.description')}</li>
                <li><strong>{tSections('inventory.content.managing.delete.label')}:</strong> {tSections('inventory.content.managing.delete.description')}</li>
                <li><strong>{tSections('inventory.content.managing.toggleView.label')}:</strong> {tSections('inventory.content.managing.toggleView.description')}</li>
                <li><strong>{tSections('inventory.content.managing.groupToggle.label')}:</strong> {tSections('inventory.content.managing.groupToggle.description')}</li>
                <li><strong>{tSections('inventory.content.managing.search.label')}:</strong> {tSections('inventory.content.managing.search.description')}</li>
                <li><strong>{tSections('inventory.content.managing.filter.label')}:</strong> {tSections('inventory.content.managing.filter.description')}</li>
                <li><strong>{tSections('inventory.content.managing.sort.label')}:</strong> {tSections('inventory.content.managing.sort.description')}</li>
              </ul>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Important:</strong> {tSections('inventory.content.managing.stockWarning')}
                </p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Pro Tip:</strong> {tSections('inventory.content.managing.groupedViewTip')}
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
                {tSections('cashRegister.content.intro')}
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('cashRegister.content.making.title')}
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{tSections('cashRegister.content.making.step1')}</li>
                <li>{tSections('cashRegister.content.making.step2')}</li>
                <li>{tSections('cashRegister.content.making.step3')}</li>
                <li>{tSections('cashRegister.content.making.step4')}
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>{tSections('cashRegister.content.making.pcsItems.label')}:</strong> {tSections('cashRegister.content.making.pcsItems.description')}</li>
                    <li><strong>{tSections('cashRegister.content.making.weightLengthItems.label')}:</strong> {tSections('cashRegister.content.making.weightLengthItems.description')}</li>
                    <li><strong>{tSections('cashRegister.content.making.variants.label')}:</strong> {tSections('cashRegister.content.making.variants.description')}</li>
                  </ul>
                </li>
                <li>{tSections('cashRegister.content.making.step5')}
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>{tSections('cashRegister.content.making.itemDetails.label')}:</strong> {tSections('cashRegister.content.making.itemDetails.description')}</li>
                    <li><strong>{tSections('cashRegister.content.making.totals.label')}:</strong> {tSections('cashRegister.content.making.totals.description')}</li>
                    <li><strong>{tSections('cashRegister.content.making.adjust.label')}:</strong> {tSections('cashRegister.content.making.adjust.description')}</li>
                  </ul>
                </li>
                <li>{tSections('cashRegister.content.making.step6')}</li>
                <li>{tSections('cashRegister.content.making.step7')}</li>
                <li>{tSections('cashRegister.content.making.step8')}
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li><strong>{tSections('cashRegister.content.making.enterAmount.label')}:</strong> {tSections('cashRegister.content.making.enterAmount.description')}</li>
                    <li><strong>{tSections('cashRegister.content.making.autoChange.label')}:</strong> {tSections('cashRegister.content.making.autoChange.description')}</li>
                  </ul>
                </li>
                <li>{tSections('cashRegister.content.making.step9')}</li>
                <li>{tSections('cashRegister.content.making.step10')}</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('cashRegister.content.features.title')}
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>{tSections('cashRegister.content.features.search.label')}:</strong> {tSections('cashRegister.content.features.search.description')}</li>
                <li><strong>{tSections('cashRegister.content.features.filters.label')}:</strong> {tSections('cashRegister.content.features.filters.description')}</li>
                <li><strong>{tSections('cashRegister.content.features.sort.label')}:</strong> {tSections('cashRegister.content.features.sort.description')}</li>
                <li><strong>{tSections('cashRegister.content.features.cartPreview.label')}:</strong> {tSections('cashRegister.content.features.cartPreview.description')}</li>
                <li><strong>{tSections('cashRegister.content.features.quickActions.label')}:</strong> {tSections('cashRegister.content.features.quickActions.description')}</li>
                <li><strong>{tSections('cashRegister.content.features.stockWarnings.label')}:</strong> {tSections('cashRegister.content.features.stockWarnings.description')}</li>
              </ul>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✅ Pro Tip:</strong> {tSections('cashRegister.content.features.autoUpdate')}
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
                {tSections('reports.content.intro')}
              </p>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('reports.content.available.title')}
              </h3>
              <ul className="list-disc list-inside space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>{tSections('reports.content.available.salesOverview.label')}:</strong> {tSections('reports.content.available.salesOverview.description')}
                </li>
                <li>
                  <strong>{tSections('reports.content.available.byPlace.label')}:</strong> {tSections('reports.content.available.byPlace.description')}
                </li>
                <li>
                  <strong>{tSections('reports.content.available.byItem.label')}:</strong> {tSections('reports.content.available.byItem.description')}
                </li>
                <li>
                  <strong>{tSections('reports.content.available.byCategory.label')}:</strong> {tSections('reports.content.available.byCategory.description')}
                </li>
                <li>
                  <strong>{tSections('reports.content.available.byTimePeriod.label')}:</strong> {tSections('reports.content.available.byTimePeriod.description')}
                </li>
                <li>
                  <strong>{tSections('reports.content.available.paymentMethods.label')}:</strong> {tSections('reports.content.available.paymentMethods.description')}
                </li>
                <li>
                  <strong>{tSections('reports.content.available.taxReports.label')}:</strong> {tSections('reports.content.available.taxReports.description')}
                </li>
                <li>
                  <strong>{tSections('reports.content.available.stockLevels.label')}:</strong> {tSections('reports.content.available.stockLevels.description')}
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('reports.content.accessing.title')}
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>{tSections('reports.content.accessing.step1')}</li>
                <li>{tSections('reports.content.accessing.step2')}</li>
                <li>{tSections('reports.content.accessing.step3')}</li>
                <li>{tSections('reports.content.accessing.step4')}</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                {tSections('reports.content.keyMetrics.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {tSections('reports.content.keyMetrics.intro')}
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>{tSections('reports.content.keyMetrics.revenue.label')}:</strong> {tSections('reports.content.keyMetrics.revenue.description')}</li>
                <li><strong>{tSections('reports.content.keyMetrics.grossProfit.label')}:</strong> {tSections('reports.content.keyMetrics.grossProfit.description')}</li>
                <li><strong>{tSections('reports.content.keyMetrics.transactionCount.label')}:</strong> {tSections('reports.content.keyMetrics.transactionCount.description')}</li>
                <li><strong>{tSections('reports.content.keyMetrics.averageOrderValue.label')}:</strong> {tSections('reports.content.keyMetrics.averageOrderValue.description')}</li>
                <li><strong>{tSections('reports.content.keyMetrics.itemsSold.label')}:</strong> {tSections('reports.content.keyMetrics.itemsSold.description')}</li>
                <li><strong>{tSections('reports.content.keyMetrics.topSellers.label')}:</strong> {tSections('reports.content.keyMetrics.topSellers.description')}</li>
                <li><strong>{tSections('reports.content.keyMetrics.stockTurnover.label')}:</strong> {tSections('reports.content.keyMetrics.stockTurnover.description')}</li>
              </ul>

              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <strong>📊 Data Insights:</strong> {tSections('reports.content.keyMetrics.realTimeUpdate')}
                </p>
              </div>
            </div>
          </section>

          {/* Quick Links */}
          <div className="mt-16 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('userGuide.needMoreHelp')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/docs"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('userGuide.backToAllDocs')}
              </Link>
              <Link
                href="/docs/developer"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('userGuide.developerGuide')}
              </Link>
              <Link
                href="/dashboard/home"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('userGuide.goToDashboard')}
              </Link>
              <Link
                href="/auth"
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('userGuide.signUpLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
