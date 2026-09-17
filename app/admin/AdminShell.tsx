"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutButton } from "@/app/components/LogoutButton";
import { AdminUsers, type AdminUserRow } from "./AdminUsers";
import { AdminTemplates, type AdminTemplateRow } from "./AdminTemplates";
import { AdminMarketing, type NotifySignupRow } from "./AdminMarketing";
import { AdminLeagues, type AdminLeagueRow } from "./AdminLeagues";
import { AdminScoring } from "./AdminScoring";
import { AdminAnalytics, type AdminAnalyticsData } from "./AdminAnalytics";
import type { AdminTab } from "./AdminDashboard";

// "users" is the default tab and lives at the bare admin root rather than
// /users, so refreshing admin.<domain> still lands on it.
const TAB_PATHS: Record<AdminTab, string> = {
  users: "/",
  templates: "/templates",
  scoring: "/scoring",
  leagues: "/leagues",
  marketing: "/marketing",
  analytics: "/analytics",
};

export function AdminShell({
  initialTab,
  adminEmail,
  users,
  templates,
  notifySignups,
  publicLeagueByTemplate,
  leagues,
  analytics,
}: {
  initialTab: AdminTab;
  adminEmail: string;
  users: AdminUserRow[];
  templates: AdminTemplateRow[];
  notifySignups: NotifySignupRow[];
  publicLeagueByTemplate: Record<string, string>;
  leagues: AdminLeagueRow[];
  analytics: AdminAnalyticsData;
}) {
  const router = useRouter();
  const [tab, setTabState] = useState<AdminTab>(initialTab);
  const templateNameById = Object.fromEntries(templates.map((t) => [t.id, t.name]));

  function setTab(next: AdminTab) {
    setTabState(next);
    router.replace(TAB_PATHS[next], { scroll: false });
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#16181D] font-sans">
      <div className="flex items-center justify-between gap-5 flex-wrap px-4 sm:px-8 py-4 bg-white border-b border-[#E2E4E9]">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[22px] tracking-wide">CAKED</span>
          <span className="font-script text-[22px] text-purple">admin</span>
        </div>
        <div className="flex items-center gap-3.5">
          <span className="text-[13.5px] text-[#6B7280]">{adminEmail}</span>
          <LogoutButton className="px-3.5 py-1.5 rounded-full border border-[#D6D9E0] text-[13px] font-semibold text-[#16181D] hover:border-purple hover:text-purple transition" />
        </div>
      </div>

      <div className="flex gap-0.5 px-4 sm:px-8 bg-white overflow-x-auto border-b border-[#E2E4E9]">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          Users
        </TabButton>
        <TabButton active={tab === "templates"} onClick={() => setTab("templates")}>
          League Templates
        </TabButton>
        <TabButton active={tab === "scoring"} onClick={() => setTab("scoring")}>
          Scoring
        </TabButton>
        <TabButton active={tab === "leagues"} onClick={() => setTab("leagues")}>
          Leagues
        </TabButton>
        <TabButton active={tab === "marketing"} onClick={() => setTab("marketing")}>
          Marketing
        </TabButton>
        <TabButton active={tab === "analytics"} onClick={() => setTab("analytics")}>
          Analytics
        </TabButton>
      </div>

      <div className="px-4 sm:px-8 py-6 pb-16">
        {tab === "users" && <AdminUsers users={users} />}
        {tab === "templates" && (
          <AdminTemplates templates={templates} publicLeagueByTemplate={publicLeagueByTemplate} />
        )}
        {tab === "scoring" && <AdminScoring templates={templates} />}
        {tab === "leagues" && <AdminLeagues leagues={leagues} templateNameById={templateNameById} />}
        {tab === "marketing" && <AdminMarketing signups={notifySignups} />}
        {tab === "analytics" && <AdminAnalytics data={analytics} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
        active ? "border-purple text-[#16181D]" : "border-transparent text-[#8A909B] hover:text-[#16181D]"
      }`}
    >
      {children}
    </button>
  );
}
