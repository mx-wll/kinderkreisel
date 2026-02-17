export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden p-6">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://unsplash.com/photos/39-eX2QWaq4/download?force=true&w=2000')",
        }}
      />
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1.5px]" />

      <div className="relative z-10 w-full max-w-sm">{children}</div>

      <a
        href="https://unsplash.com/photos/39-eX2QWaq4"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 z-10 rounded-full bg-black/45 px-3 py-1 text-xs text-white/90 transition hover:bg-black/60"
      >
        Foto: Unsplash
      </a>
    </div>
  );
}
