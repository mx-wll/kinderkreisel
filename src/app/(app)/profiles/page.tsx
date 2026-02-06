export default function ProfilesPage() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Nachbarn</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Schau, wer noch dabei ist.
      </p>

      <div className="mt-12 flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground">Noch keine Nutzer registriert.</p>
      </div>
    </div>
  );
}
