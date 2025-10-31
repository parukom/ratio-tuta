import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/i18n/getMessages";
import { isLocale, type Locale } from "@/i18n/config";
import StructuredData from "@/components/StructuredData";

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

// Generate metadata for each locale
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: localeParam } = await params;
    const locale = isLocale(localeParam) ? localeParam : 'en';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Load localized messages
    const messages = await getMessages(locale);
    const seoMessages = messages.SEO as {
        title: string;
        description: string;
        keywords: Record<string, string>;
        structuredData: {
            softwareName: string;
            softwareDescription: string;
        };
    };

    // Convert keywords object to array
    const keywordsArray = Object.values(seoMessages.keywords);

    return {
        title: {
            default: seoMessages.title,
            template: "%s | Ratio Tuta"
        },
        description: seoMessages.description,
        keywords: keywordsArray,
        authors: [{ name: "Tomas Dudovicius", url: "https://github.com/parukom" }],
        creator: "Tomas Dudovicius",
        publisher: "Ratio Tuta",

        // Open Graph (Facebook, LinkedIn)
        openGraph: {
            type: "website",
            locale: locale === 'lt' ? 'lt_LT' : locale === 'ru' ? 'ru_RU' : 'en_US',
            alternateLocale: ["lt_LT", "en_US", "ru_RU"],
            url: `${baseUrl}/${locale}`,
            title: seoMessages.title,
            description: seoMessages.description,
            siteName: "Ratio Tuta",
            images: [
                {
                    url: "/images/og-image.png",
                    width: 1200,
                    height: 630,
                    alt: `${seoMessages.structuredData.softwareName} - ${seoMessages.structuredData.softwareDescription}`,
                },
            ],
        },

        // Twitter Card
        twitter: {
            card: "summary_large_image",
            title: seoMessages.title,
            description: seoMessages.description,
            images: ["/images/twitter-image.png"],
            creator: "@ratiotuta",
        },

        // Multi-language support with hreflang
        alternates: {
            canonical: `${baseUrl}/${locale}`,
            languages: {
                'en': `${baseUrl}/en`,
                'lt': `${baseUrl}/lt`,
                'ru': `${baseUrl}/ru`,
                'x-default': `${baseUrl}/en`
            }
        }
    };
}

export default async function LocaleLayout({
    children,
    params
}: Props) {
    const { locale: localeParam } = await params;
    const locale: Locale = isLocale(localeParam) ? localeParam : 'en';
    const messages = await getMessages(locale);

    const seoMessages = messages.SEO as {
        title: string;
        description: string;
        keywords: Record<string, string>;
        structuredData: {
            softwareName: string;
            softwareDescription: string;
            applicationCategory: string;
            operatingSystem: string;
            features: Record<string, string>;
        };
    };

    return (
        <>
            <StructuredData locale={locale} seoData={seoMessages} />
            <NextIntlClientProvider locale={locale} messages={messages}>
                {children}
            </NextIntlClientProvider>
        </>
    );
}