export default function HomePage() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Kinderkreisel</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Secondhand Kinderartikel in deiner Nachbarschaft.
      </p>

      <div className="mt-12 flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground">Noch keine Artikel vorhanden.</p>
      </div>
    </div>
  );
}
