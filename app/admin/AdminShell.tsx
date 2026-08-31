"use client";
import { useState } from "react";
import { LogoutButton } from "@/app/components/LogoutButton";
import { AdminUsers, type AdminUserRow } from "./AdminUsers";
import { AdminTemplates, type AdminTemplateRow } from "./AdminTemplates";
import { AdminMarketing, type NotifySignupRow } from "./AdminMarketing";
import { AdminLeagues, type AdminLeagueRow } from "./AdminLeagues";

export function AdminShell({
  adminEmail,
  users,
  templates,
  notifySignups,
  publicLeagueByTemplate,
  leagues,
}: {
  adminEmail: string;
  users: AdminUserRow[];
  templates: AdminTemplateRow[];
  notifySignups: NotifySignupRow[];
  publicLeagueByTemplate: Record<string, string>;
  leagues: AdminLeagueRow[];
}) {
  const [tab, setTab] = useState<"users" | "templates" | "leagues" | "marketing">("users");

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
        <TabButton active={tab === "leagues"} onClick={() => setTab("leagues")}>
          Leagues
        </TabButton>
        <TabButton active={tab === "marketing"} onClick={() => setTab("marketing")}>
          Marketing
        </TabButton>
      </div>

      <div className="px-4 sm:px-8 py-6 pb-16">
        {tab === "users" && <AdminUsers users={users} />}
        {tab === "templates" && (
          <AdminTemplates templates={templates} publicLeagueByTemplate={publicLeagueByTemplate} />
        )}
        {tab === "leagues" && <AdminLeagues leagues={leagues} />}
        {tab === "marketing" && <AdminMarketing signups={notifySignups} />}
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
