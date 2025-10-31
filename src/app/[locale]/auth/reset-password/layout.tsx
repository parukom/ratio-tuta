import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reset Password - Ratio Tuta",
    description: "Complete your password reset process for your Ratio Tuta account. Create a new secure password to regain full access to your business management dashboard and tools.",
    keywords: [
        "reset password",
        "new password",
        "password change",
        "account security",
        "secure password",
        "login recovery",
        "account access",
        "password update"
    ],
    openGraph: {
        title: "Reset Password - Ratio Tuta",
        description: "Complete your password reset process. Create a new secure password to regain access to your business management account.",
        type: "website",
    },
};

export default function ResetPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}