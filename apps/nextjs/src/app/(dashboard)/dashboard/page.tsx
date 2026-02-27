import { PageHeader } from "@gmacko/ui/page-header";
import { CardSkeleton } from "@gmacko/ui/skeleton";

/**
 * Main dashboard page — example of the standard page pattern.
 *
 * Pattern for every dashboard page:
 * 1. PageHeader with breadcrumbs, title, description, optional actions
 * 2. Content section with cards/tables/charts
 * 3. Server Component by default, "use client" only for interactive parts
 * 4. Suspense boundaries around async data
 */
export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your application."
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Dashboard" }]}
      />

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Users" value="1,234" change="+12%" />
        <StatCard title="Active Projects" value="23" change="+3" />
        <StatCard title="API Calls" value="45.2K" change="+8%" />
      </div>

      {/* Recent activity placeholder */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Replace these skeletons with real data from your tRPC procedures.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) {
  return (
    <div className="rounded-lg border p-6">
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="text-muted-foreground mt-1 text-xs">{change} from last month</p>
    </div>
  );
}
