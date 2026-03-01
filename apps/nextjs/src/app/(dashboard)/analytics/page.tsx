import { PageHeader } from "@gmacko/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@gmacko/ui/tabs";

/**
 * Analytics page — Dashboard-style metrics with tabs.
 *
 * This is the reference pattern for:
 * 1. Tabs component for switching between views
 * 2. Stat cards with trend indicators
 * 3. Chart placeholder areas (wire to your charting library)
 * 4. Server Component with static data (replace with tRPC)
 *
 * For real charts, use recharts or @tremor/react:
 *   import { AreaChart } from "recharts";
 */

const MOCK_STATS = [
  { label: "Total Users", value: "2,847", change: "+12.5%", up: true },
  { label: "Active Projects", value: "164", change: "+8.2%", up: true },
  { label: "API Requests", value: "1.2M", change: "+23.1%", up: true },
  { label: "Error Rate", value: "0.12%", change: "-0.04%", up: false },
];

const MOCK_TOP_PAGES = [
  { path: "/dashboard", views: "12,847", unique: "8,234" },
  { path: "/projects", views: "8,392", unique: "5,108" },
  { path: "/settings", views: "3,291", unique: "2,847" },
  { path: "/team", views: "2,108", unique: "1,892" },
  { path: "/pricing", views: "1,847", unique: "1,623" },
];

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Monitor your application performance and usage."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Analytics" },
        ]}
      />

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_STATS.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-6">
            <p className="text-muted-foreground text-sm font-medium">
              {stat.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-bold">{stat.value}</p>
              <span
                className={`text-xs font-medium ${
                  stat.up ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs with chart areas */}
      <div className="mt-8">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traffic">Traffic</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Chart placeholder */}
              <div className="rounded-lg border p-6 lg:col-span-2">
                <h3 className="mb-4 font-semibold">Users Over Time</h3>
                <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">
                      Chart placeholder
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Wire to recharts, @tremor/react, or similar
                    </p>
                  </div>
                </div>
              </div>

              {/* Top pages */}
              <div className="rounded-lg border p-6">
                <h3 className="mb-4 font-semibold">Top Pages</h3>
                <div className="space-y-3">
                  {MOCK_TOP_PAGES.map((page) => (
                    <div
                      key={page.path}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground font-mono">
                        {page.path}
                      </span>
                      <span className="font-medium">{page.views}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="mt-4">
            <div className="rounded-lg border p-6">
              <h3 className="mb-4 font-semibold">Traffic Sources</h3>
              <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
                <p className="text-muted-foreground text-sm">
                  Bar chart placeholder — breakdown by referrer, direct, social
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <div className="rounded-lg border p-6">
              <h3 className="mb-4 font-semibold">Recent Events</h3>
              <div className="space-y-3">
                {[
                  { event: "user.signed_up", count: "234", time: "Last 24h" },
                  { event: "project.created", count: "89", time: "Last 24h" },
                  { event: "api.key_generated", count: "45", time: "Last 24h" },
                  { event: "subscription.upgraded", count: "12", time: "Last 24h" },
                  { event: "file.uploaded", count: "167", time: "Last 24h" },
                ].map((e) => (
                  <div
                    key={e.event}
                    className="flex items-center justify-between rounded-md border px-4 py-3 text-sm"
                  >
                    <span className="font-mono">{e.event}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{e.time}</span>
                      <span className="font-medium">{e.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
