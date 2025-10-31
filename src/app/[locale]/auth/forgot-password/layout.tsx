import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forgot Password - Ratio Tuta",
    description: "Reset your Ratio Tuta account password securely. Enter your email address to receive password reset instructions and regain access to your business management account.",
    keywords: [
        "forgot password",
        "password reset",
        "account recovery",
        "reset password",
        "login help",
        "account access",
        "password recovery",
        "secure login"
    ],
    openGraph: {
        title: "Forgot Password - Ratio Tuta",
        description: "Reset your account password securely. Enter your email to receive password reset instructions and regain access to your account.",
        type: "website",
    },
};

export default function ForgotPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}