import { Suspense } from "react";
import { AuthForm } from "@/app/components/AuthForm";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
