// src/components/shop/price-table.tsx — v3 glass design
import { useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Store } from 'lucide-react'
import { SUPPLIER_MAP, COUNTRY_FLAGS } from '@/data/suppliers'
import type { PriceRecord } from '@/lib/types'

interface PriceTableProps {
  records: PriceRecord[]
  isLoading?: boolean
}

const col = createColumnHelper<PriceRecord>()

const columns = [
  col.accessor('ingredient_name', {
    header: 'Ingrediente',
    cell: info => <span className="font-medium text-text-primary">{info.getValue()}</span>,
  }),
  col.accessor('shop_name', {
    header: 'Tienda',
    cell: info => {
      const key = info.getValue().toLowerCase().replace(/\s+/g, '')
      const supplier = SUPPLIER_MAP.get(key)
      const flag = supplier ? COUNTRY_FLAGS[supplier.country] ?? '' : ''
      return (
        <span className="flex items-center gap-1.5 text-text-secondary">
          <Store size={12} style={{ color: supplier?.color ?? '#F5A623' }} />
          {flag} {info.getValue()}
        </span>
      )
    },
  }),
  col.accessor('price', {
    header: 'Precio',
    cell: info => (
      <span className="font-semibold font-mono text-accent-amber">
        {info.getValue().toFixed(2)} €
      </span>
    ),
  }),
  col.accessor('unit', {
    header: 'Unidad',
    cell: info => <span className="text-text-tertiary">{info.getValue()}</span>,
  }),
  col.accessor('in_stock', {
    header: 'Stock',
    cell: info => (
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
          info.getValue()
            ? 'border-green-500/30 text-green-400 bg-green-500/10'
            : 'border-red-500/30 text-red-400 bg-red-500/10'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${info.getValue() ? 'bg-green-400' : 'bg-red-400'}`} />
        {info.getValue() ? 'Stock' : 'Agotado'}
      </span>
    ),
  }),
  col.accessor('scraped_at', {
    header: 'Actualizado',
    cell: info => {
      const v = info.getValue()
      return <span className="text-xs text-text-tertiary">{v ? new Date(v).toLocaleDateString('es-ES') : '—'}</span>
    },
  }),
  col.display({
    id: 'link',
    header: '',
    cell: info => (
      <a
        href={info.row.original.product_url || info.row.original.shop_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-text-tertiary hover:text-accent-amber transition-colors"
        onClick={e => e.stopPropagation()}
      >
        <ExternalLink size={14} />
      </a>
    ),
  }),
]

export function PriceTable({ records, isLoading = false }: PriceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: records,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id} className="border-b border-white/[0.06]">
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider"
                >
                  {header.isPlaceholder ? null : (
                    <button
                      className="flex items-center gap-1 hover:text-text-primary transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() &&
                        (header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp size={12} />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown size={12} />
                        ) : (
                          <ArrowUpDown size={12} className="opacity-40" />
                        ))}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              className="border-t border-white/[0.04] hover:bg-white/[0.03] transition-colors"
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-text-tertiary">
                No se encontraron resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
