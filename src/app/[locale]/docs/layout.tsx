import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Documentation - Ratio Tuta",
    description: "Comprehensive documentation for Ratio Tuta inventory and financial management system. Learn how to set up your business, manage inventory, process sales, and collaborate with your team effectively.",
    keywords: [
        "documentation",
        "user guide",
        "inventory management tutorial",
        "POS system guide",
        "business setup guide",
        "team management documentation",
        "how to use ratio tuta",
        "inventory software help"
    ],
    openGraph: {
        title: "Documentation - Ratio Tuta",
        description: "Comprehensive documentation for Ratio Tuta inventory and financial management system. Learn how to set up and manage your business effectively.",
        type: "website",
    },
};

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}