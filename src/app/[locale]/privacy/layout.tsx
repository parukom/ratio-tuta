import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy - Ratio Tuta",
    description: "Our commitment to protecting your privacy and data security. Learn how Ratio Tuta collects, uses, and safeguards your business information in compliance with data protection regulations.",
    keywords: [
        "privacy policy",
        "data protection",
        "privacy rights",
        "data security",
        "GDPR compliance",
        "information security",
        "data handling",
        "user privacy"
    ],
    openGraph: {
        title: "Privacy Policy - Ratio Tuta",
        description: "Our commitment to protecting your privacy and data security. Learn how we safeguard your business information in compliance with regulations.",
        type: "website",
    },
};

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}