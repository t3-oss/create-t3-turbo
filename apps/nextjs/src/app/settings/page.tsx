import { ApiKeysSection } from "./_components/api-keys";
import { PreferencesSection } from "./_components/preferences";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage your preferences, notifications, and API keys.
      </p>

      <div className="space-y-8">
        <PreferencesSection />
        <ApiKeysSection />
      </div>
    </div>
  );
}
