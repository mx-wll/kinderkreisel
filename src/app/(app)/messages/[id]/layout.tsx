export default function ConversationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-dvh bg-background">{children}</div>;
}
