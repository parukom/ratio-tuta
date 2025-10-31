import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing Plans - Ratio Tuta",
    description: "Choose the perfect plan for your business needs. From free tier for small operations to premium packages for growing businesses. Transparent pricing with no hidden fees. Start with our free plan today.",
    keywords: [
        "pricing plans",
        "subscription tiers",
        "business plans",
        "inventory management pricing",
        "free inventory software",
        "affordable POS system",
        "small business pricing",
        "team management plans"
    ],
    openGraph: {
        title: "Pricing Plans - Ratio Tuta",
        description: "Choose the perfect plan for your business needs. From free tier to premium packages for growing businesses. Transparent pricing with no hidden fees.",
        type: "website",
    },
};

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}