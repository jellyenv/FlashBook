import { Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PERKS = [
  "Unlimited bookings & calendar",
  "Public booking page + page editor",
  "Portfolio, flash & merch storefronts",
  "Client contacts & campaigns",
  "Custom theming",
];

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$20",
    cadence: "/month",
    note: "Billed monthly",
    highlight: false,
  },
  {
    id: "annual",
    name: "Annual",
    price: "$192",
    cadence: "/year",
    note: "20% off — 2 months free",
    highlight: true,
  },
];

export default function MembershipPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Membership</h1>
        <p className="text-muted-foreground">
          One simple plan for everything FlashBook. Pick monthly or save 20%
          annually.
        </p>
      </div>

      <Card className="fb-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="font-medium">Early access — free during setup</p>
          </div>
          <Badge variant="secondary" className="bg-accent-3/15 text-accent-3">
            Active
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "fb-card relative",
              plan.highlight && "border-brand ring-1 ring-brand",
            )}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-foreground">
                <Sparkles className="h-3 w-3" /> Best value
              </span>
            )}
            <CardHeader>
              <CardTitle className="font-display">{plan.name}</CardTitle>
              <CardDescription>{plan.note}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <span className="font-display text-3xl">{plan.price}</span>
                <span className="text-muted-foreground">{plan.cadence}</span>
              </p>
              <ul className="space-y-1.5">
                {PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 text-brand" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "brand" : "outline"}
                className="w-full"
                disabled
              >
                Choose {plan.name}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Activates when payments are connected
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
