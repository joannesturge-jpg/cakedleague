import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="relative flex items-center justify-center px-10 py-14 min-h-[calc(100vh-62px)] overflow-hidden">
      <div
        className="absolute -top-44 left-1/2 -ml-96 w-[760px] h-[560px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(123,44,245,.38), transparent 66%)" }}
      />

      <div className="relative w-full max-w-[452px]">
        <div className="flex items-baseline justify-center gap-3 mb-6">
          <span className="font-display text-5xl tracking-wide">CAKED</span>
          <span className="font-script text-4xl text-pink">leagues</span>
        </div>

        <div className="bg-card border border-cream/10 rounded-3xl px-9 py-9 shadow-2xl">
          <h1 className="font-display text-4xl tracking-wide text-center mt-1 mb-6">NEW PASSWORD</h1>
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
