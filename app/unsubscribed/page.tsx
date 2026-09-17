import { AdminDashboard } from "@/app/admin/AdminDashboard";

// This is the Unsubscribed tab's URL in the admin panel. AdminDashboard
// itself 404s this on the main site (see its own host check) so there's
// no need to duplicate that guard here.
export default function UnsubscribedPage() {
  return <AdminDashboard initialTab="unsubscribed" />;
}
