import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");

  return (
    <SettingsForm
      name={user.name}
      email={user.email}
      notifyPicksDue={user.notifyPicksDue}
      notifyScoring={user.notifyScoring}
      notifyInvites={user.notifyInvites}
    />
  );
}
