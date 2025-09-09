import Image from 'next/image'

export default function OurMission() {
  return (
    <div className="overflow-hidden bg-white py-24 sm:py-32 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="max-w-4xl">
          <p className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">About us</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl dark:text-white">
            On a mission to empower you to save time, save money, and stay up to date across every place
          </h1>
          <p className="mt-6 text-xl/8 text-balance text-gray-700 dark:text-gray-300">
            Ratio tuta is a secure online notebook that calculates everything for you. Keep notes, tables, and formulas
            together, stay informed about what’s happening across places, and trust that your data is protected.
          </p>
        </div>
        <section className="mt-20 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-16">
          <div className="lg:pr-8">
            <h2 className="text-2xl font-semibold tracking-tight text-pretty text-gray-900 dark:text-white">
              Our mission
            </h2>
            <ul className="mt-6 space-y-4 text-base/7 text-gray-600 dark:text-gray-400">
              <li><span className="font-medium text-gray-900 dark:text-white">Save time:</span> capture once, automate with formulas, and find anything instantly.</li>
              <li><span className="font-medium text-gray-900 dark:text-white">Save money:</span> reduce errors, see a clear picture of costs, and make faster decisions.</li>
              <li><span className="font-medium text-gray-900 dark:text-white">Stay updated across places:</span> track what’s happening at each place in real time.</li>
              <li><span className="font-medium text-gray-900 dark:text-white">Be secure by default:</span> privacy-first design with role-based access and audit trails.</li>
            </ul>
          </div>
          <div className="pt-16 lg:row-span-2 lg:-mr-16 xl:mr-auto">
            <div className="-mx-8 grid grid-cols-2 gap-4 sm:-mx-16 sm:grid-cols-4 lg:mx-0 lg:grid-cols-2 xl:gap-8">
              <div className="relative aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 outline-black/10 dark:shadow-none dark:outline-white/10">
                <Image alt="" src="/images/cat.jpg" fill priority={false} loading="lazy" className="object-cover" />
              </div>
              <div className="relative -mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 outline-black/10 lg:-mt-40 dark:shadow-none dark:outline-white/10">
                <Image alt="" src="/images/cat.jpg" fill priority={false} loading="lazy" className="object-cover" />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 outline-black/10 dark:shadow-none dark:outline-white/10">
                <Image alt="" src="/images/cat.jpg" fill priority={false} loading="lazy" className="object-cover" />
              </div>
              <div className="relative -mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline-1 -outline-offset-1 outline-black/10 lg:-mt-40 dark:shadow-none dark:outline-white/10">
                <Image alt="" src="/images/cat.jpg" fill priority={false} loading="lazy" className="object-cover" />
              </div>
            </div>
          </div>
          <div className="max-lg:mt-16 lg:col-span-1">
            <p className="text-base/7 font-semibold text-gray-500 dark:text-gray-400">What you get</p>
            <hr className="mt-6 border-t border-gray-200 dark:border-gray-700" />
            <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="flex flex-col gap-y-2 border-b border-dotted border-gray-200 pb-4 dark:border-gray-700">
                <dt className="text-sm/6 text-gray-600 dark:text-gray-400">Time back</dt>
                <dd className="order-first text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  Less manual work every week
                </dd>
              </div>
              <div className="flex flex-col gap-y-2 border-b border-dotted border-gray-200 pb-4 dark:border-gray-700">
                <dt className="text-sm/6 text-gray-600 dark:text-gray-400">Lower costs</dt>
                <dd className="order-first text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  Fewer mistakes, clearer insights
                </dd>
              </div>
              <div className="flex flex-col gap-y-2 max-sm:border-b max-sm:border-dotted max-sm:border-gray-200 max-sm:pb-4 dark:max-sm:border-gray-700">
                <dt className="text-sm/6 text-gray-600 dark:text-gray-400">Live visibility</dt>
                <dd className="order-first text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  Know what’s happening in each place
                </dd>
              </div>
              <div className="flex flex-col gap-y-2">
                <dt className="text-sm/6 text-gray-600 dark:text-gray-400">Security</dt>
                <dd className="order-first text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  Private by default, access you control
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  )
}

