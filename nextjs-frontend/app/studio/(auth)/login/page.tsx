import { SignIn } from "@clerk/nextjs";

export default function StudioLoginPage() {
  return (
    <div className="flex justify-center">
      <SignIn
        routing="hash"
        signUpUrl="/studio/register"
        fallbackRedirectUrl="/studio"
      />
    </div>
  );
}
