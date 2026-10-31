"use client";
import * as React from "react";
import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const adminTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns,
  sortFns,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminColumnDef<TData extends RowData> = ColumnDef<typeof adminTableFeatures, TData, any>;

export interface FilterConfig {
  columnId: string;
  label: string;
  options: { value: string; label: string }[];
}

export function AdminDataTable<TData extends RowData>({
  data,
  columns,
  searchPlaceholder = "Search…",
  filters = [],
  emptyText = "No records found.",
  pageSize = 15,
}: {
  data: TData[];
  columns: AdminColumnDef<TData>[];
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  emptyText?: string;
  pageSize?: number;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize });

  const table = useTable({
    features: adminTableFeatures,
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[230px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-steel-400" aria-hidden />
          <input
            type="search"
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="field !py-2 pl-9 text-sm"
          />
        </div>
        {filters.map((f) => {
          const col = table.getColumn(f.columnId);
          if (!col) return null;
          const val = (col.getFilterValue() as string) ?? "";
          return (
            <select
              key={f.columnId}
              aria-label={f.label}
              value={val}
              onChange={(e) => col.setFilterValue(e.target.value || undefined)}
              className="field !w-auto !py-2 text-sm"
            >
              <option value="">{f.label}: All</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          );
        })}
        <p className="ml-auto text-xs font-semibold text-steel-500">
          {table.getFilteredRowModel().rows.length} {table.getFilteredRowModel().rows.length === 1 ? "record" : "records"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-steel-200 bg-white shadow-card">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-steel-200 bg-steel-50 text-xs font-bold uppercase tracking-wider text-steel-600">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <th key={header.id} scope="col" className="px-4 py-3.5">
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider hover:text-navy-900"
                        >
                          <table.FlexRender header={header} />
                          <ArrowUpDown className="size-3.5 text-steel-400" aria-hidden />
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-steel-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-steel-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-steel-50/70">
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5 align-middle">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-xs text-steel-600">
          <span>
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft /> Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
