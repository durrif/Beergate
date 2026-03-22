// src/components/shop/price-table.tsx
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PriceRecord } from "@/lib/types";

interface PriceTableProps {
  records: PriceRecord[];
  isLoading?: boolean;
}

const col = createColumnHelper<PriceRecord>();

const columns = [
  col.accessor("ingredient_name", {
    header: "Ingrediente",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  col.accessor("shop_name", {
    header: "Tienda",
    cell: (info) => info.getValue(),
  }),
  col.accessor("price", {
    header: "Precio",
    cell: (info) => (
      <span className="font-semibold text-amber-400">
        {info.getValue().toFixed(2)} €
      </span>
    ),
  }),
  col.accessor("unit", {
    header: "Unidad",
    cell: (info) => info.getValue(),
  }),
  col.accessor("in_stock", {
    header: "Stock",
    cell: (info) => (
      <Badge
        variant="outline"
        className={
          info.getValue()
            ? "border-green-600 text-green-400"
            : "border-red-600 text-red-400"
        }
      >
        {info.getValue() ? "Disponible" : "Sin stock"}
      </Badge>
    ),
  }),
  col.accessor("scraped_at", {
    header: "Actualizado",
    cell: (info) => {
      const v = info.getValue();
      return v ? new Date(v).toLocaleDateString("es-ES") : "—";
    },
  }),
  col.display({
    id: "link",
    header: "",
    cell: (info) => (
      <a
        href={info.row.original.shop_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-400 hover:text-amber-400 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    ),
  }),
];

export function PriceTable({ records, isLoading = false }: PriceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded bg-zinc-800 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-700">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/80">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider"
                >
                  {header.isPlaceholder ? null : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 hover:text-white"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() &&
                        (header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className="ml-1 w-3 h-3" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className="ml-1 w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="ml-1 w-3 h-3 opacity-40" />
                        ))}
                    </Button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-zinc-200">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}

          {records.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-zinc-500"
              >
                No se encontraron resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
