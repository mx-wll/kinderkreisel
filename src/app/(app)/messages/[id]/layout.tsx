export default function ConversationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Override the app layout's pb-20 and hide the BottomNav
  // by rendering children in a full-screen container
  return (
    <div className="fixed inset-0 z-50 bg-background">
      {children}
    </div>
  );
}
