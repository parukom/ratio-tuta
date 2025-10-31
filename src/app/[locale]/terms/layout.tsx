import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service - Ratio Tuta",
    description: "Read the terms of service and user agreement for Ratio Tuta inventory management system. Understanding your rights and responsibilities when using our business management platform.",
    keywords: [
        "terms of service",
        "user agreement",
        "legal terms",
        "service conditions",
        "user rights",
        "business terms",
        "software license agreement",
        "platform terms"
    ],
    openGraph: {
        title: "Terms of Service - Ratio Tuta",
        description: "Read the terms of service and user agreement for Ratio Tuta inventory management system. Understanding your rights and responsibilities.",
        type: "website",
    },
};

export default function TermsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}