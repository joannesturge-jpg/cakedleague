import { AdminDashboard } from "@/app/admin/AdminDashboard";

// This is the Scoring tab's URL in the admin panel. AdminDashboard itself
// 404s this on the main site (see its own host check) so there's no need
// to duplicate that guard here.
export default function ScoringPage() {
  return <AdminDashboard initialTab="scoring" />;
}
