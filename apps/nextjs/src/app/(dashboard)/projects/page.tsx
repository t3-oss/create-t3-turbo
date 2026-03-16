"use client";

import { useState } from "react";

import { Badge } from "@gmacko/ui/badge";
import { Button } from "@gmacko/ui/button";
import { AlertDialog } from "@gmacko/ui/alert-dialog";
import { PageHeader } from "@gmacko/ui/page-header";
import { DataTable } from "@gmacko/ui/data-table";
import type { Column } from "@gmacko/ui/data-table";
import { toast } from "@gmacko/ui/toast";

/**
 * Projects page — CRUD list example with DataTable.
 *
 * This is the reference pattern for building list views:
 * 1. DataTable with columns, search, sort, pagination
 * 2. AlertDialog for destructive actions
 * 3. Badge for status display
 * 4. PageHeader with breadcrumbs and action button
 * 5. Toast notifications for feedback
 *
 * Replace mock data with tRPC queries:
 *   const { data } = trpc.project.list.useQuery();
 *   const deleteProject = trpc.project.delete.useMutation();
 */

interface Project {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  members: number;
}

const MOCK_PROJECTS: Project[] = [
  { id: "1", name: "Marketing Website", status: "active", updatedAt: "2026-02-28", members: 4 },
  { id: "2", name: "Mobile App v2", status: "active", updatedAt: "2026-02-27", members: 6 },
  { id: "3", name: "API Gateway", status: "archived", updatedAt: "2026-02-20", members: 3 },
  { id: "4", name: "Design System", status: "active", updatedAt: "2026-02-25", members: 2 },
  { id: "5", name: "Analytics Dashboard", status: "draft", updatedAt: "2026-02-15", members: 1 },
  { id: "6", name: "Customer Portal", status: "active", updatedAt: "2026-02-26", members: 5 },
  { id: "7", name: "Internal Tools", status: "archived", updatedAt: "2026-01-10", members: 2 },
  { id: "8", name: "Email Service", status: "active", updatedAt: "2026-02-24", members: 3 },
  { id: "9", name: "Payment Integration", status: "draft", updatedAt: "2026-02-18", members: 2 },
  { id: "10", name: "Search Microservice", status: "active", updatedAt: "2026-02-22", members: 4 },
  { id: "11", name: "Notification Hub", status: "active", updatedAt: "2026-02-21", members: 3 },
  { id: "12", name: "Data Pipeline", status: "draft", updatedAt: "2026-02-12", members: 1 },
];

const statusColors: Record<string, string> = {
  active: "default",
  draft: "secondary",
  archived: "outline",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    toast.success("Project deleted");
  }

  const columns: Column<Project>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      className: "w-64 font-medium",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant={statusColors[row.status] as "default" | "secondary" | "outline"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "members",
      header: "Members",
      sortable: true,
      render: (row) => <span>{row.members}</span>,
    },
    {
      key: "updatedAt",
      header: "Last Updated",
      sortable: true,
    },
    {
      key: "id",
      header: "",
      render: (row) => (
        <div className="flex justify-end">
          <AlertDialog
            trigger={
              <Button variant="ghost" size="sm" className="text-destructive">
                Delete
              </Button>
            }
            title={`Delete "${row.name}"?`}
            description="This action cannot be undone. The project and all its data will be permanently removed."
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={() => handleDelete(row.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage your projects and their settings."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Projects" },
        ]}
        actions={
          <Button
            onClick={() =>
              toast.info("Create project", {
                description: "Wire this to a create project form/modal.",
              })
            }
          >
            New Project
          </Button>
        }
      />

      <DataTable
        data={projects as unknown as Record<string, unknown>[]}
        columns={columns as Column<Record<string, unknown>>[]}
        searchKey="name"
        searchPlaceholder="Search projects..."
        pageSize={8}
        emptyState={{
          title: "No projects yet",
          description: "Create your first project to get started.",
          action: (
            <Button
              onClick={() =>
                toast.info("Create project", {
                  description: "Wire this to a create project form/modal.",
                })
              }
            >
              New Project
            </Button>
          ),
        }}
      />
    </div>
  );
}
