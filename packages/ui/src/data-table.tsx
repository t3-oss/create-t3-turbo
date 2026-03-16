"use client";

import { useState } from "react";

import { cn } from "@gmacko/ui";
import { Button } from "@gmacko/ui/button";
import { Input } from "@gmacko/ui/input";
import { EmptyState } from "@gmacko/ui/empty-state";

/**
 * DataTable — Reusable table with sorting, filtering, and pagination.
 *
 * Usage:
 *   <DataTable
 *     data={users}
 *     columns={[
 *       { key: "name", header: "Name", sortable: true },
 *       { key: "email", header: "Email", sortable: true },
 *       { key: "role", header: "Role", render: (row) => <Badge>{row.role}</Badge> },
 *     ]}
 *     searchKey="name"
 *     searchPlaceholder="Search users..."
 *     pageSize={10}
 *     emptyState={{ title: "No users", description: "Invite someone to get started." }}
 *   />
 */

type SortDirection = "asc" | "desc";

export interface Column<T> {
  /** Key to access the data field */
  key: string;
  /** Column header text */
  header: string;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Custom render function for the cell */
  render?: (row: T) => React.ReactNode;
  /** Column width class (e.g., "w-48") */
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  /** Key to search/filter by */
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  /** Empty state when no data matches */
  emptyState?: { title: string; description?: string; action?: React.ReactNode };
  /** Optional actions bar (e.g., "Create New" button) */
  actions?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search...",
  pageSize = 10,
  emptyState,
  actions,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);

  // Filter
  const filtered = searchKey
    ? data.filter((row) => {
        const value = row[searchKey];
        if (typeof value === "string") {
          return value.toLowerCase().includes(search.toLowerCase());
        }
        return true;
      })
    : data;

  // Sort
  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null || bVal == null) return 0;
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      {(searchKey || actions) && (
        <div className="flex items-center justify-between gap-4">
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="max-w-sm"
            />
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table */}
      {paginated.length === 0 ? (
        <EmptyState
          title={emptyState?.title ?? "No results"}
          description={
            search
              ? `No results for "${search}". Try a different search term.`
              : emptyState?.description
          }
          action={emptyState?.action}
        />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left font-medium",
                      col.sortable && "cursor-pointer select-none hover:bg-muted",
                      col.className,
                    )}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        <SortIcon direction={sortDir} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, i) => (
                <tr key={i} className="hover:bg-muted/30 border-t transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3", col.className)}>
                      {col.render
                        ? col.render(row)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of{" "}
            {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
    >
      {direction === "asc" ? (
        <path d="m5 12 7-7 7 7" />
      ) : (
        <path d="m19 12-7 7-7-7" />
      )}
    </svg>
  );
}
