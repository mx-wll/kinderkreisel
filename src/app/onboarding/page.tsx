import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { getCurrentSession } from "@/lib/auth/server";
import { convexQuery } from "@/lib/convex/server";

export default async function OnboardingPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  if (!session.needsOnboarding) {
    redirect("/");
  }

  const profile = await convexQuery<{
    zipCode?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
  } | null>("profiles:getById", {
    id: session.profileId,
  });

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md items-center px-4 py-8">
      <OnboardingFlow
        initialZipCode={profile?.zipCode}
        initialPhone={profile?.phone}
        initialAddressLine1={profile?.addressLine1}
        initialAddressLine2={profile?.addressLine2}
      />
    </div>
  );
}
