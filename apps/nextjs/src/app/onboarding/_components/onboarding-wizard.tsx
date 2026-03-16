"use client";

import { useState } from "react";

import { Button } from "@gmacko/ui/button";
import { Input } from "@gmacko/ui/input";

const STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "profile", title: "Your Profile" },
  { id: "workspace", title: "Workspace" },
  { id: "ready", title: "You're Ready" },
] as const;

type Step = (typeof STEPS)[number]["id"];

export function OnboardingWizard({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [formData, setFormData] = useState({
    displayName: userName,
    role: "",
    companyName: "",
    teamSize: "",
  });

  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  function nextStep() {
    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]!.id);
    }
  }

  function prevStep() {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]!.id);
    }
  }

  return (
    <div className="rounded-lg border p-6 shadow-sm">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="bg-muted mb-2 h-1.5 w-full rounded-full">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Step {currentIndex + 1} of {STEPS.length}
        </p>
      </div>

      {/* Step content */}
      {currentStep === "welcome" && (
        <div className="space-y-4">
          <h2 className="text-foreground text-xl font-bold">
            Welcome, {userName}!
          </h2>
          <p className="text-muted-foreground text-sm">
            Let's get you set up. This will only take a minute.
          </p>
          <Button onClick={nextStep} className="w-full">
            Get Started
          </Button>
        </div>
      )}

      {currentStep === "profile" && (
        <div className="space-y-4">
          <h2 className="text-foreground text-xl font-bold">
            Your Profile
          </h2>
          <p className="text-muted-foreground text-sm">
            Tell us a bit about yourself.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Display Name
              </label>
              <Input
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Email
              </label>
              <Input value={userEmail} disabled />
            </div>
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Your Role
              </label>
              <Input
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                placeholder="e.g., Developer, Designer, PM"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={prevStep} className="flex-1">
              Back
            </Button>
            <Button onClick={nextStep} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {currentStep === "workspace" && (
        <div className="space-y-4">
          <h2 className="text-foreground text-xl font-bold">
            Set Up Your Workspace
          </h2>
          <p className="text-muted-foreground text-sm">
            Create your first organization or skip to use your personal account.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Company / Team Name
              </label>
              <Input
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Team Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["1-5", "6-20", "20+"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFormData({ ...formData, teamSize: size })}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      formData.teamSize === size
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={prevStep} className="flex-1">
              Back
            </Button>
            <Button onClick={nextStep} className="flex-1">
              {formData.companyName ? "Create Workspace" : "Skip for Now"}
            </Button>
          </div>
        </div>
      )}

      {currentStep === "ready" && (
        <div className="space-y-4 text-center">
          <div className="bg-primary/10 text-primary mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-foreground text-xl font-bold">
            You're All Set!
          </h2>
          <p className="text-muted-foreground text-sm">
            Your account is ready. Head to the dashboard to start building.
          </p>
          <Button asChild className="w-full">
            <a href="/settings">Go to Dashboard</a>
          </Button>
        </div>
      )}
    </div>
  );
}
