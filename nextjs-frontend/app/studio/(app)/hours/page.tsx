import { HoursEditor } from "@/components/studio/HoursEditor";
import { fetchExceptions, fetchRules } from "@/lib/studio-data";

export default async function HoursPage() {
  const [rules, exceptions] = await Promise.all([
    fetchRules(),
    fetchExceptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Business hours</h1>
        <p className="text-muted-foreground">
          Set your standard weekly hours and slot length, then add custom days
          or blackout dates. These drive your public booking calendar.
        </p>
      </div>
      <HoursEditor rules={rules} exceptions={exceptions} />
    </div>
  );
}
