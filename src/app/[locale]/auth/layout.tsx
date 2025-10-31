import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In / Sign Up - Ratio Tuta",
    description: "Access your inventory management account or create a new one. Secure login to your business dashboard with team collaboration, real-time stock tracking, and comprehensive reporting tools.",
    keywords: [
        "login",
        "sign in",
        "sign up",
        "user authentication",
        "create account",
        "business login",
        "inventory system access",
        "secure authentication"
    ],
    openGraph: {
        title: "Sign In / Sign Up - Ratio Tuta",
        description: "Access your inventory management account or create a new one. Secure login to your business dashboard and team collaboration tools.",
        type: "website",
    },
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}