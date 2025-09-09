import React from "react";
import {
    ShieldCheckIcon,
    CalculatorIcon,
    EyeSlashIcon,
    Squares2X2Icon,
} from "@heroicons/react/24/outline";

const features = [
    {
        name: "Secure Data",
        description:
            "Everything is encrypted. Only you can see your sales and notes.",
        icon: ShieldCheckIcon,
    },
    //   {
    //     name: "Easy Sales",
    //     description:
    //       "Just add what you sell or buy, and the app calculates the rest.",
    //     icon: CalculatorIcon,
    //   },
    {
        name: "All-in-One",
        description:
            "Stock, sales, and calculations together in one simple tool.",
        icon: Squares2X2Icon,
    },
    {
        name: "Private",
        description:
            "No personal details needed. No government control. Just your numbers.",
        icon: EyeSlashIcon,
    },
];

export default function FeaturesSection() {
    return (
        <section id="features" className="bg-white py-24 sm:py-32 dark:bg-gray-900">
            <div className="bg-white py-24 sm:py-32 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base/7 font-semibold text-indigo-600 dark:text-indigo-400">Deploy faster</h2>
                        <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance dark:text-white">
                            Everything you need to deploy your app
                        </p>
                        <p className="mt-6 text-lg/8 text-gray-600 dark:text-gray-300">
                            Quis tellus eget adipiscing convallis sit sit eget aliquet quis. Suspendisse eget egestas a elementum
                            pulvinar et feugiat blandit at. In mi viverra elit nunc.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                            {features.map((feature) => (
                                <div key={feature.name} className="flex flex-col">
                                    <dt className="flex items-center gap-x-3 text-base/7 font-semibold text-gray-900 dark:text-white">
                                        <feature.icon aria-hidden="true" className="size-5 flex-none text-indigo-600 dark:text-indigo-400" />
                                        {feature.name}
                                    </dt>
                                    <dd className="mt-4 flex flex-auto flex-col text-base/7 text-gray-600 dark:text-gray-400">
                                        <p className="flex-auto">{feature.description}</p>
                                        <p className="mt-6">

                                        </p>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>
        </section>
    );
}