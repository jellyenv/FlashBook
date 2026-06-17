import { UserProfile } from "@clerk/nextjs";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Security & account</h1>
        <p className="text-muted-foreground">
          Manage your password, two-factor authentication, and connected accounts.
        </p>
      </div>
      <div className="flex justify-center">
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
