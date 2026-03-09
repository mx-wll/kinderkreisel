import { SignUpForm } from "@/components/sign-up-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ via?: string }>;
}) {
  const { via } = await searchParams;
  return <SignUpForm invited={via === "invite"} />;
}
