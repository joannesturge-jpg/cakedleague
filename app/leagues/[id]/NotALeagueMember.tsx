export function NotALeagueMember() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-10 py-24 text-center">
      <h1 className="font-display text-3xl tracking-wide">NOT A MEMBER</h1>
      <p className="text-cream/60 max-w-sm">You need an invite link to see this league. Ask the commissioner for one.</p>
    </div>
  );
}
