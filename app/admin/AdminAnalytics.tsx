export type AdminAnalyticsData = {
  totalUsers: number;
  usersWhoCreatedLeague: number;
  usersWhoJoinedOthers: number;
  usersActivated: number;
  signupsByWeekday: number[];
  leagueCreationsByWeekday: number[];
  joinsByWeekday: number[];
  signupsThisWeek: number;
  signupsLastWeek: number;
  leaguesThisWeek: number;
  leaguesLastWeek: number;
  notifySignupTotal: number;
  notifySignupConverted: number;
  totalLeaguesCreated: number;
  activeLeagues: number;
  inactiveLeagues: number;
  deletedLeagues: number;
  publicLeagues: number;
  privateLeagues: number;
  avgMembersPerLeague: number;
  topTemplates: { name: string; count: number }[];
  weeklyTop3MemberCount: number;
  weeklyPicksSubmitted: number;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function AdminAnalytics({ data }: { data: AdminAnalyticsData }) {
  const notActivated = data.totalUsers - data.usersActivated;
  const notifyConversion = pct(data.notifySignupConverted, data.notifySignupTotal);
  const signupsDelta = data.signupsThisWeek - data.signupsLastWeek;
  const leaguesDelta = data.leaguesThisWeek - data.leaguesLastWeek;

  return (
    <div>
      <div className="flex items-end justify-between gap-5 flex-wrap mb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide">ANALYTICS</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Derived from account, league, and pick activity — there&apos;s no page-view tracking wired up yet, so
            &quot;days with the most traffic&quot; here means signups, league creations, and joins by day of week.
          </p>
        </div>
      </div>

      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <StatTile label="Total users" value={String(data.totalUsers)} />
        <StatTile
          label="Activated (joined or created)"
          value={`${pct(data.usersActivated, data.totalUsers)}%`}
          sub={`${data.usersActivated} of ${data.totalUsers}`}
        />
        <StatTile
          label="Created a league"
          value={`${pct(data.usersWhoCreatedLeague, data.totalUsers)}%`}
          sub={`${data.usersWhoCreatedLeague} users`}
        />
        <StatTile
          label="Joined another's league"
          value={`${pct(data.usersWhoJoinedOthers, data.totalUsers)}%`}
          sub={`${data.usersWhoJoinedOthers} users`}
        />
        <StatTile label="Never joined or created" value={`${pct(notActivated, data.totalUsers)}%`} sub={`${notActivated} users`} />
        <StatTile label="Avg members per league" value={data.avgMembersPerLeague.toFixed(1)} />
      </div>

      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <TrendTile label="Signups this week" value={data.signupsThisWeek} delta={signupsDelta} prior={data.signupsLastWeek} />
        <TrendTile
          label="Leagues created this week"
          value={data.leaguesThisWeek}
          delta={leaguesDelta}
          prior={data.leaguesLastWeek}
        />
        <StatTile
          label="Notify-me → signed up"
          value={`${notifyConversion}%`}
          sub={`${data.notifySignupConverted} of ${data.notifySignupTotal} emails`}
        />
      </div>

      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <WeekdayCard title="Signups by day of week" counts={data.signupsByWeekday} color="#7B2CF5" />
        <WeekdayCard title="Leagues created by day of week" counts={data.leagueCreationsByWeekday} color="#E85BAE" />
        <WeekdayCard title="Joins by day of week" counts={data.joinsByWeekday} color="#1E7B45" />
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <div className="bg-white border border-[#E2E4E9] rounded-lg p-[18px]">
          <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-3">LEAGUE HEALTH</div>
          <div className="flex flex-col gap-2 mb-4">
            <StatRow label="Active" value={data.activeLeagues} tone="good" />
            <StatRow label="Inactive" value={data.inactiveLeagues} />
            <StatRow label="Deleted" value={data.deletedLeagues} tone="bad" />
            <StatRow label="Public" value={data.publicLeagues} />
            <StatRow label="Private" value={data.privateLeagues} />
          </div>
          <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-2">MOST POPULAR TEMPLATES</div>
          {data.topTemplates.length === 0 ? (
            <p className="text-sm text-[#8A909B]">No leagues built from a template yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {data.topTemplates.map((t) => (
                <div key={t.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#16181D]">{t.name}</span>
                  <span className="font-semibold text-[#5B6270]">{t.count} league{t.count === 1 ? "" : "s"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E2E4E9] rounded-lg p-[18px]">
          <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-3">DWTS WEEKLY ENGAGEMENT</div>
          <p className="text-sm text-[#5B6270] mb-1">
            {data.weeklyTop3MemberCount === 0
              ? "No WEEKLY_TOP3 (DWTS-style) league members yet."
              : `${data.weeklyPicksSubmitted} weekly picks submitted across ${data.weeklyTop3MemberCount} members`}
          </p>
          <p className="text-xs text-[#8A909B]">
            Total submissions ÷ total DWTS-format members — a rough gauge of how often people are coming back to
            submit picks, not a per-week percentage (weeks don&apos;t have a stored start date yet to divide by).
          </p>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#E2E4E9] rounded-lg p-[18px]">
      <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-1.5">{label.toUpperCase()}</div>
      <div className="font-display text-2xl tracking-wide">{value}</div>
      {sub && <div className="text-xs text-[#8A909B] mt-0.5">{sub}</div>}
    </div>
  );
}

function TrendTile({ label, value, delta, prior }: { label: string; value: number; delta: number; prior: number }) {
  const positive = delta > 0;
  const flat = delta === 0;
  return (
    <div className="bg-white border border-[#E2E4E9] rounded-lg p-[18px]">
      <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-1.5">{label.toUpperCase()}</div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl tracking-wide">{value}</span>
        <span
          className={`text-xs font-bold ${flat ? "text-[#8A909B]" : positive ? "text-[#1E7B45]" : "text-[#C2314E]"}`}
        >
          {flat ? "±0" : `${positive ? "+" : ""}${delta}`}
        </span>
      </div>
      <div className="text-xs text-[#8A909B] mt-0.5">vs {prior} the week before</div>
    </div>
  );
}

function StatRow({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "text-[#1E7B45]" : tone === "bad" ? "text-[#C2314E]" : "text-[#16181D]";
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[#5B6270]">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function WeekdayCard({ title, counts, color }: { title: string; counts: number[]; color: string }) {
  const max = Math.max(1, ...counts);
  return (
    <div className="bg-white border border-[#E2E4E9] rounded-lg p-[18px]">
      <div className="text-[10.5px] tracking-widest text-[#8A909B] font-bold mb-3">{title.toUpperCase()}</div>
      <div className="flex flex-col gap-1.5">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className="w-8 text-xs font-semibold text-[#8A909B] flex-none">{label}</span>
            <div className="flex-1 h-4 rounded bg-[#F4F5F7] overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${(counts[i] / max) * 100}%`, background: color, minWidth: counts[i] > 0 ? "3px" : 0 }}
              />
            </div>
            <span className="w-6 text-xs font-semibold text-[#16181D] text-right flex-none">{counts[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
