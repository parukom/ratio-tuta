'use client'

import Image from 'next/image'
import { CheckIcon } from '@heroicons/react/20/solid'
import { FirstPagesHeader } from '@/components/FirstPagesHeader'
import FAQ from '@/components/Faq'
import Footer from '@/components/Footer'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

// user's packages
const packages = [
    {
        id: 'free',
        name: 'FREE',
        monthlyCents: 0,
        features: [
            'Up to one place',
            'Up to 30 items',
            'Up to 2000 sales per month',
            'Up to 1 team mate',
            '3 months of storing data',
        ],
        description: 'Free tier for trying the product',
        featured: false,
    },
    {
        id: 'pro10',
        name: 'PRO 10',
        monthlyCents: 1000, // €10.00
        features: [
            'Up to 2 places',
            'Up to 120 items',
            'Up to 8000 sales per month',
            'Up to 4 team mates',
            '10 months of storing data',
        ],
        description: 'Small teams',
        featured: false,
    },
    {
        id: 'premium20',
        name: 'PREMIUM 20',
        monthlyCents: 2000, // €20.00
        features: [
            'Up to 5 places',
            'Up to 250 items',
            'Up to 20000 sales per month',
            'Up to 25 workers',
            '24 months of storing data',
            'Better image quality',
            'Document storage up to 1GB',
            '€0.49 for extra GB',
        ],
        description: 'For growing businesses',
        featured: true,
    },
    {
        id: 'enterprise',
        name: 'ENTERPRISE',
        monthlyCents: 0,
        features: [
            'Unlimited places',
            'Unlimited items',
            'Unlimited sales',
            'Unlimited workers',
            'Unlimited months of storing data',
            'Best image quality',
            'Unlimited document storage',
        ],
        description: 'Contact us for custom pricing',
        featured: false,
        contact: true,
    },
]

// types
type PackageType = {
    id: string
    name: string
    monthlyCents?: number
    features: string[]
    description?: string
    featured?: boolean
    contact?: boolean
}

// compute display prices (EUR) and annual price as monthly * 10 (2 months free)
function formatPrice(cents: number) {
    if (cents === 0) return 'Free'
    return `€${(cents / 100).toFixed(2)}`
}

function annualFromMonthly(cents: number) {
    // annual is 10x monthly
    return cents * 10
}

type SessionData = {
    userId: string;
    name: string;
    role: 'USER' | 'ADMIN';
} | null;

export default function PricingPage() {
    const t = useTranslations('Pricing')
    const searchParams = useSearchParams()
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
    const [selectedTeam, setSelectedTeam] = useState<string>('')
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
    const [isAnnual, setIsAnnual] = useState(false)
    const [activePackageSlug, setActivePackageSlug] = useState<string>('free')
    const [subscriptionLoading, setSubscriptionLoading] = useState(false)
    const [session, setSession] = useState<SessionData>(null)

    useEffect(() => {
        if (searchParams.get('canceled') === 'true') {
            toast.error(t('paymentCanceled'))
        }
    }, [searchParams, t])

    const fetchActiveSubscription = useCallback(async () => {
        if (!selectedTeam) return

        setSubscriptionLoading(true)
        try {
            const res = await fetch(`/api/teams/${selectedTeam}/subscription`)
            if (!res.ok) {
                setActivePackageSlug('free')
                return
            }
            const data = await res.json()
            setActivePackageSlug(data.package?.slug || 'free')
        } catch (error) {
            console.error('Error fetching subscription:', error)
            setActivePackageSlug('free')
        } finally {
            setSubscriptionLoading(false)
        }
    }, [selectedTeam])

    useEffect(() => {
        fetchSession()
        fetchTeams()
    }, [])

    useEffect(() => {
        if (selectedTeam) {
            fetchActiveSubscription()
        }
    }, [selectedTeam, fetchActiveSubscription])

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

    async function fetchTeams() {
        try {
            const res = await fetch('/api/teams')
            if (!res.ok) return
            const data = await res.json()
            setTeams(data)
            if (data.length > 0) {
                setSelectedTeam(data[0].id)
            }
        } catch (error) {
            console.error('Error fetching teams:', error)
        }
    }

    async function handleCheckout(packageSlug: string, annual: boolean) {
        if (!selectedTeam) {
            toast.error(t('tooltips.selectTeamFirst'))
            return
        }

        const checkoutKey = `${packageSlug}-${annual ? 'annual' : 'monthly'}`
        setCheckoutLoading(checkoutKey)

        try {
            const res = await fetch('/api/packages/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: selectedTeam,
                    packageSlug,
                    annual,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create checkout session')
            }

            if (data.url) {
                window.location.href = data.url
            }
        } catch (error) {
            console.error('Checkout error:', error)
            toast.error('Failed to create checkout session')
            setCheckoutLoading(null)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-900">
            <FirstPagesHeader session={session} />

            <main>
                {/* Pricing section */}
                <form className="group/tiers bg-white pt-24 sm:pt-32 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-4xl text-center">
                            <h2 className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">{t('title')}</h2>
                            <p className="mt-2 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-6xl dark:text-white">
                                {t('subtitle')}
                            </p>
                        </div>
                        <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-600 sm:text-xl/8 dark:text-gray-400">
                            {t('description')}
                        </p>
                        {teams.length === 0 && (
                            <div className="mt-8 mx-auto max-w-md">
                                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        {t('noTeams')}
                                    </p>
                                </div>
                            </div>
                        )}
                        {teams.length > 0 && (
                            <div className="mt-10 flex justify-center">
                                <div className="w-full max-w-md">
                                    <label htmlFor="team-select" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                                        {t('selectTeam')}
                                    </label>
                                    <select
                                        id="team-select"
                                        value={selectedTeam}
                                        onChange={(e) => setSelectedTeam(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    >
                                        {teams.map((team) => (
                                            <option key={team.id} value={team.id}>
                                                {team.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        <div className="mt-6 flex justify-center">
                            <fieldset aria-label="Payment frequency">
                                <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs/5 font-semibold inset-ring inset-ring-gray-200 dark:inset-ring-white/10">
                                    <label className="group relative rounded-full px-2.5 py-1 has-checked:bg-indigo-600 dark:has-checked:bg-indigo-500">
                                        <input
                                            value="monthly"
                                            checked={!isAnnual}
                                            onChange={() => setIsAnnual(false)}
                                            name="frequency"
                                            type="radio"
                                            className="absolute inset-0 appearance-none rounded-full"
                                        />
                                        <span className="text-gray-500 group-has-checked:text-white dark:text-gray-400">{t('frequency.monthly')}</span>
                                    </label>
                                    <label className="group relative rounded-full px-2.5 py-1 has-checked:bg-indigo-600 dark:has-checked:bg-indigo-500">
                                        <input
                                            value="annually"
                                            checked={isAnnual}
                                            onChange={() => setIsAnnual(true)}
                                            name="frequency"
                                            type="radio"
                                            className="absolute inset-0 appearance-none rounded-full"
                                        />
                                        <span className="text-gray-500 group-has-checked:text-white dark:text-gray-400">{t('frequency.annually')}</span>
                                    </label>
                                </div>
                            </fieldset>
                        </div>
                        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-4xl xl:mx-0 xl:max-w-none xl:grid-cols-4">
                            {packages.map((tier: PackageType) => {
                                const monthly = tier.monthlyCents ?? 0
                                const annual = annualFromMonthly(monthly)
                                const isActivePlan = tier.id === activePackageSlug
                                return (
                                    <div
                                        key={tier.id}
                                        data-featured={tier.featured ? 'true' : undefined}
                                        className={`group/tier rounded-3xl p-8 ring-1 ring-gray-200 data-featured:ring-2 data-featured:ring-indigo-600 dark:bg-gray-800/50 dark:ring-white/15 dark:data-featured:ring-indigo-400 ${isActivePlan ? 'ring-2 ring-green-500 dark:ring-green-400' : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-x-4">
                                            <h3
                                                id={`tier-${tier.id}`}
                                                className="text-lg/8 font-semibold text-gray-900 group-data-featured/tier:text-indigo-600 dark:text-white dark:group-data-featured/tier:text-indigo-400"
                                            >
                                                {tier.name}
                                            </h3>
                                            {isActivePlan ? (
                                                <p className="rounded-full bg-green-600/10 px-2.5 py-1 text-xs/5 font-semibold text-green-700 dark:bg-green-500/20 dark:text-green-400 whitespace-nowrap">
                                                    {t('badges.active')}
                                                </p>
                                            ) : tier.featured ? (
                                                <p className="rounded-full bg-indigo-600/10 px-2.5 py-1 text-xs/5 font-semibold text-indigo-600 dark:bg-indigo-500 dark:text-white whitespace-nowrap">
                                                    {t('badges.popular')}
                                                </p>
                                            ) : null}
                                        </div>
                                        <p className="mt-4 text-sm/6 text-gray-600 dark:text-gray-300">{tier.description}</p>
                                        <p className="mt-6 flex items-baseline gap-x-1 group-not-has-[[name=frequency][value=monthly]:checked]/tiers:hidden">
                                            <span className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                                {monthly === 0 ? 'Free' : formatPrice(monthly)}
                                            </span>
                                            <span className="text-sm/6 font-semibold text-gray-600 dark:text-gray-400">{t('perMonth')}</span>
                                        </p>
                                        <p className="mt-6 flex items-baseline gap-x-1 group-not-has-[[name=frequency][value=annually]:checked]/tiers:hidden">
                                            <span className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                                {annual === 0 ? 'Free' : formatPrice(annual)}
                                            </span>
                                            <span className="text-sm/6 font-semibold text-gray-600 dark:text-gray-400">{t('perYear')}</span>
                                        </p>
                                        <div className="relative group mt-6">
                                            <button
                                                type="button"
                                                disabled={
                                                    !selectedTeam ||
                                                    isActivePlan ||
                                                    tier.contact ||
                                                    subscriptionLoading ||
                                                    checkoutLoading === `${tier.id}-${isAnnual ? 'annual' : 'monthly'}`
                                                }
                                                onClick={() => handleCheckout(tier.id, isAnnual)}
                                                aria-describedby={isActivePlan || tier.contact ? `tooltip-${tier.id}` : undefined}
                                                className={`${!selectedTeam || isActivePlan || tier.contact || subscriptionLoading
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : ''
                                                    } block w-full rounded-md px-3 py-2 text-center text-sm/6 font-semibold text-indigo-600 inset-ring-1 inset-ring-indigo-200 group-data-featured/tier:bg-indigo-600 group-data-featured/tier:text-white group-data-featured/tier:shadow-xs group-data-featured/tier:inset-ring-0 hover:inset-ring-indigo-300 group-data-featured/tier:hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-white/10 dark:text-white dark:inset-ring dark:inset-ring-white/5 dark:group-data-featured/tier:bg-indigo-500 dark:group-data-featured/tier:shadow-none dark:hover:bg-white/20 dark:hover:inset-ring-white/5 dark:group-data-featured/tier:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500 dark:group-not-data-featured/tier:focus-visible:outline-white/75`}
                                            >
                                                {subscriptionLoading
                                                    ? t('actions.loading')
                                                    : checkoutLoading === `${tier.id}-${isAnnual ? 'annual' : 'monthly'}`
                                                        ? t('actions.redirecting')
                                                        : isActivePlan
                                                            ? t('actions.currentPlan')
                                                            : tier.contact
                                                                ? t('actions.contactSales')
                                                                : t('actions.buyPlan')}
                                            </button>

                                            {(isActivePlan || tier.contact || !selectedTeam) && (
                                                <div
                                                    id={`tooltip-${tier.id}`}
                                                    role="tooltip"
                                                    className="pointer-events-none absolute left-1/2 bottom-full mb-2 w-max -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-700"
                                                >
                                                    {!selectedTeam
                                                        ? t('tooltips.selectTeamFirst')
                                                        : isActivePlan
                                                            ? t('tooltips.currentPlan')
                                                            : tier.contact
                                                                ? t('tooltips.contactForPricing')
                                                                : ''}
                                                </div>
                                            )}
                                        </div>
                                        <ul role="list" className="mt-8 space-y-3 text-sm/6 text-gray-600 dark:text-gray-300">
                                            {tier.features.map((feature: string) => (
                                                <li key={feature} className="flex gap-x-3">
                                                    <CheckIcon
                                                        aria-hidden="true"
                                                        className="h-6 w-5 flex-none text-indigo-600 dark:text-indigo-400"
                                                    />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </form>

                {/* Logo cloud */}
                <div className="mx-auto mt-24 max-w-7xl px-6 sm:mt-32 lg:px-8">
                    <div className="mx-auto grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-12 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 sm:gap-y-14 lg:mx-0 lg:max-w-none lg:grid-cols-5">
                        <Image
                            alt="Transistor"
                            src="https://tailwindcss.com/plus-assets/img/logos/158x48/transistor-logo-gray-900.svg"
                            width={158}
                            height={48}
                            className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 dark:hidden"
                        />
                        <Image
                            alt="Transistor"
                            src="https://tailwindcss.com/plus-assets/img/logos/158x48/transistor-logo-white.svg"
                            width={158}
                            height={48}
                            className="col-span-2 max-h-12 w-full object-contain not-dark:hidden lg:col-span-1"
                        />

                        <Image
                            alt="Reform"
                            src="https://tailwindcss.com/plus-assets/img/logos/158x48/reform-logo-gray-900.svg"
                            width={158}
                            height={48}
                            className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 dark:hidden"
                        />
                        <Image
                            alt="Reform"
                            src="https://tailwindcss.com/plus-assets/img/logos/158x48/reform-logo-white.svg"
                            width={158}
                            height={48}
                            className="col-span-2 max-h-12 w-full object-contain not-dark:hidden lg:col-span-1"
                        />

                        <Image
                            alt="Tuple"
                            src="https://tailwindcss.com/plus-assets/img/logos/158x48/tuple-logo-gray-900.svg"
                            width={158}
                            height={48}
                            className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 dark:hidden"
                        />
                        <Image
                            alt="Tuple"
                            src="https://tailwindcss.com/plus-assets/img/logos/158x48/tuple-logo-white.svg"
                            width={158}
                            height={48}
                            className="col-span-2 max-h-12 w-full object-contain not-dark:hidden lg:col-span-1"
                        />

                        <Image
                            alt="SavvyCal"
                            src="https://tailwindcss.com/plus-assets/img/logos/158x48/savvycal-logo-gray-900.svg"
                            width={158}
                            height={48}
                            className="col-span-2 max-h-12 w-full object-contain sm:col-start-2 lg:col-span-1 dark:hidden"
                        />
                        <Image
                            alt="SavvyCal"
                            src="https://tailwindcss.com/plus-assets/img/logos/158x48/savvycal-logo-white.svg"
                            width={158}
                            height={48}
                            className="col-span-2 max-h-12 w-full object-contain not-dark:hidden sm:col-start-2 lg:col-span-1"
                        />

                        <Image
                            alt="Statamic"
                            src="https://tailwindcss.com/plus-assets/img/logos/158x48/statamic-logo-gray-900.svg"
                            width={158}
                            height={48}
                            className="col-span-2 col-start-2 max-h-12 w-full object-contain sm:col-start-auto lg:col-span-1 dark:hidden"
                        />
                        <Image
                            alt="Statamic"
                            src="https://tailwindcss.com/plus-assets/img/logos/158x48/statamic-logo-white.svg"
                            width={158}
                            height={48}
                            className="col-span-2 col-start-2 max-h-12 w-full object-contain not-dark:hidden sm:col-start-auto lg:col-span-1"
                        />
                    </div>
                    <div className="mt-16 flex justify-center">
                        <p className="relative rounded-full bg-gray-50 px-4 py-1.5 text-sm/6 text-gray-600 inset-ring inset-ring-gray-900/5 dark:bg-gray-800/75 dark:text-gray-400 dark:inset-ring-white/10">
                            <span className="hidden md:inline">
                                Transistor saves up to $40,000 per year, per employee by working with us.
                            </span>
                            <a
                                href="#"
                                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                <span aria-hidden="true" className="absolute inset-0" /> See our case study{' '}
                                <span aria-hidden="true">&rarr;</span>
                            </a>
                        </p>
                    </div>
                </div>

                {/* Testimonial section */}
                <div className="mx-auto mt-24 max-w-7xl sm:mt-56 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden bg-gray-900 px-6 py-20 shadow-xl sm:rounded-3xl sm:px-10 sm:py-24 md:px-12 lg:px-20 dark:bg-black dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:inset-ring dark:after:inset-ring-white/10 dark:after:sm:rounded-3xl">
                        <Image
                            width={1216}
                            height={574}
                            alt=""
                            src="https://images.unsplash.com/photo-1601381718415-a05fb0a261f3?ixid=MXwxMjA3fDB8MHxwcm9maWxlLXBhZ2V8ODl8fHxlbnwwfHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1216&q=80"
                            className="absolute inset-0 size-full object-cover brightness-150 saturate-0"
                        />
                        <div className="absolute inset-0 bg-gray-900/90 mix-blend-multiply" />
                        <div aria-hidden="true" className="absolute -top-56 -left-80 transform-gpu blur-3xl">
                            <div
                                style={{
                                    clipPath:
                                        'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                                }}
                                className="aspect-1097/845 w-274.25 bg-linear-to-r from-[#ff4694] to-[#776fff] opacity-[0.45] dark:opacity-[0.30]"
                            />
                        </div>
                        <div
                            aria-hidden="true"
                            className="hidden md:absolute md:bottom-16 md:left-200 md:block md:transform-gpu md:blur-3xl"
                        >
                            <div
                                style={{
                                    clipPath:
                                        'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                                }}
                                className="aspect-1097/845 w-274.25 bg-linear-to-r from-[#ff4694] to-[#776fff] opacity-25 dark:opacity-20"
                            />
                        </div>
                        <div className="relative mx-auto max-w-2xl lg:mx-0">
                            <Image
                                width={44}
                                height={44}
                                alt=""
                                src="https://tailwindcss.com/plus-assets/img/logos/workcation-logo-white.svg"
                                className="h-12 w-auto dark:hidden"
                            />
                            <Image
                                width={44}
                                height={44}
                                alt=""
                                src="https://tailwindcss.com/plus-assets/img/logos/workcation-logo-white.svg"
                                className="h-12 w-auto not-dark:hidden"
                            />
                            <figure>
                                <blockquote className="mt-6 text-lg font-semibold text-white sm:text-xl/8">
                                    <p>
                                        “Lorem ipsum dolor sit amet consectetur adipisicing elit. Nemo expedita voluptas culpa sapiente
                                        alias molestiae. Numquam corrupti in laborum sed rerum et corporis.”
                                    </p>
                                </blockquote>
                                <figcaption className="mt-6 text-base text-white dark:text-gray-200">
                                    <div className="font-semibold">Judith Black</div>
                                    <div className="mt-1">CEO of Workcation</div>
                                </figcaption>
                            </figure>
                        </div>
                    </div>
                </div>

            </main>

            {/* FAQ section */}
            <FAQ />

            {/* Footer */}
            <Footer />
        </div>
    )
}
