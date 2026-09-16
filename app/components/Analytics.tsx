"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fires a beacon on first load and every client-side navigation. No
// cookies/consent UI here — the visitor id set by middleware is
// anonymous and only ever used to count visits, not to identify anyone.
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
