import Link from "next/link";
import { verifyUnsubscribeToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ searchParams }: { searchParams: { token?: string } }) {
  const userId = searchParams.token ? await verifyUnsubscribeToken(searchParams.token) : null;

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-10 py-24 text-center">
        <h1 className="font-display text-3xl tracking-wide">LINK EXPIRED</h1>
        <p className="text-cream/60 max-w-sm">
          That unsubscribe link isn&apos;t valid. You can manage your email preferences from Settings instead.
        </p>
        <Link
          href="/settings"
          className="px-6 py-3 rounded-full bg-purple text-cream font-bold text-sm hover:bg-[#8f47ff] transition"
        >
          Go to settings
        </Link>
      </div>
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { notifyPicksDue: false, notifyScoring: false, notifyInvites: false },
  });

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-10 py-24 text-center">
      <h1 className="font-display text-3xl tracking-wide">YOU&apos;RE UNSUBSCRIBED</h1>
      <p className="text-cream/60 max-w-sm">
        We&apos;ve turned off picks-due, scoring, and invite emails for your account. You&apos;ll still get
        essential emails like password resets and league confirmations.
      </p>
      <Link
        href="/settings"
        className="px-6 py-3 rounded-full border border-cream/22 text-cream font-semibold text-sm hover:border-cream transition"
      >
        Manage preferences
      </Link>
    </div>
  );
}
