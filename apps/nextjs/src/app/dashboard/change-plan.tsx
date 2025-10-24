import { useId, useState } from "react";
import { ArrowUpFromLine, CreditCard, RefreshCcw } from "lucide-react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Label } from "@acme/ui/label";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";

function Component(props: { currentPlan?: string; isTrial?: boolean }) {
  const [selectedPlan, setSelectedPlan] = useState("plus");
  const id = useId();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={!props.currentPlan ? "default" : "outline"}
          size="sm"
          className={cn(
            "gap-2",
            !props.currentPlan &&
              "bg-linear-to-br from-purple-100 to-stone-300",
          )}
        >
          {props.currentPlan ? (
            <RefreshCcw className="opacity-80" size={14} strokeWidth={2} />
          ) : (
            <ArrowUpFromLine className="opacity-80" size={14} strokeWidth={2} />
          )}
          {props.currentPlan ? "Change Plan" : "Upgrade Plan"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="mb-2 flex flex-col gap-2">
          <div
            className="border-border flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            {props.currentPlan ? (
              <RefreshCcw className="opacity-80" size={16} strokeWidth={2} />
            ) : (
              <CreditCard className="opacity-80" size={16} strokeWidth={2} />
            )}
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">
              {!props.currentPlan ? "Upgrade" : "Change"} your plan
            </DialogTitle>
            <DialogDescription className="text-left">
              Pick one of the following plans.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <RadioGroup
            className="gap-2"
            defaultValue="2"
            value={selectedPlan}
            onValueChange={(value) => setSelectedPlan(value)}
          >
            <div className="border-input has-data-[state=checked]:border-ring has-data-[state=checked]:bg-accent relative flex w-full items-center gap-2 rounded-lg border px-4 py-3 shadow-sm shadow-black/5">
              <RadioGroupItem
                value="plus"
                id={`${id}-1`}
                aria-describedby={`${id}-1-description`}
                className="order-1 after:absolute after:inset-0"
              />
              <div className="grid grow gap-1">
                <Label htmlFor={`${id}-1`}>Plus</Label>
                <p
                  id={`${id}-1-description`}
                  className="text-muted-foreground text-xs"
                >
                  $20/month
                </p>
              </div>
            </div>
            <div className="border-input has-data-[state=checked]:border-ring has-data-[state=checked]:bg-accent relative flex w-full items-center gap-2 rounded-lg border px-4 py-3 shadow-sm shadow-black/5">
              <RadioGroupItem
                value="pro"
                id={`${id}-2`}
                aria-describedby={`${id}-2-description`}
                className="order-1 after:absolute after:inset-0"
              />
              <div className="grid grow gap-1">
                <Label htmlFor={`${id}-2`}>Pro</Label>
                <p
                  id={`${id}-2-description`}
                  className="text-muted-foreground text-xs"
                >
                  $200/month
                </p>
              </div>
            </div>
            <div className="border-input has-data-[state=checked]:border-ring has-data-[state=checked]:bg-accent relative flex w-full items-center gap-2 rounded-lg border px-4 py-3 shadow-sm shadow-black/5">
              <RadioGroupItem
                value="enterprise"
                id={`${id}-3`}
                aria-describedby={`${id}-3-description`}
                className="order-1 after:absolute after:inset-0"
              />
              <div className="grid grow gap-1">
                <Label htmlFor={`${id}-3`}>Enterprise</Label>
                <p
                  id={`${id}-3-description`}
                  className="text-muted-foreground text-xs"
                >
                  Contact our sales team
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className="space-y-3">
            <p className="text-center text-xs text-white/70">
              note: all upgrades takes effect immediately and you'll be charged
              the new amount on your next billing cycle.
            </p>
          </div>

          {/* <div className="grid gap-2">
            <Button
              type="button"
              className="w-full"
              disabled={
                selectedPlan === props.currentPlan?.toLowerCase() &&
                !props.isTrial
              }
              onClick={async () => {
                if (selectedPlan === "enterprise") {
                  return;
                }
                await client.subscription.upgrade(
                  {
                    plan: selectedPlan,
                  },
                  {
                    onError: (ctx) => {
                      toast.error(ctx.error.message);
                    },
                  },
                );
              }}
            >
              {selectedPlan === props.currentPlan?.toLowerCase()
                ? props.isTrial
                  ? "Upgrade"
                  : "Current Plan"
                : selectedPlan === "plus"
                  ? !props.currentPlan
                    ? "Upgrade"
                    : "Downgrade"
                  : selectedPlan === "pro"
                    ? "Upgrade"
                    : "Contact us"}
            </Button>
            {props.currentPlan && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={async () => {
                  await client.subscription.cancel(
                    {
                      returnUrl: "/dashboard",
                    },
                    {
                      onError: (ctx) => {
                        toast.error(ctx.error.message);
                      },
                    },
                  );
                }}
              >
                Cancel Plan
              </Button>
            )}
          </div> */}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { Component };
