import { SignUp } from "@clerk/nextjs";

export default function StudioRegisterPage() {
  return (
    <div className="flex justify-center">
      <SignUp
        routing="hash"
        signInUrl="/studio/login"
        fallbackRedirectUrl="/studio"
      />
    </div>
  );
}
