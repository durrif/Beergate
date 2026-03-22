// frontend/src/pages/shop.tsx
import { useEffect, useState } from 'react'
import { Search, RefreshCw, Bell, BellPlus } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { usePriceSearch, usePriceAlerts, useCreatePriceAlert, useDeletePriceAlert, useTriggerScrape } from '@/hooks/use-prices'
import type { PriceRecord, PriceAlert } from '@/lib/types'
import { PriceCard } from '@/components/shop/price-card'
import { PriceTable } from '@/components/shop/price-table'
import { PriceAlertBadge } from '@/components/shop/price-alert-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function ShopPage() {
  const { setActivePage } = useUIStore()
  useEffect(() => { setActivePage('shop') }, [setActivePage])

  const [query, setQuery] = useState('')
  const [alertName, setAlertName] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const { data: results = [], isFetching } = usePriceSearch(query)
  const { data: alerts = [] } = usePriceAlerts()
  const createAlert = useCreatePriceAlert()
  const deleteAlert = useDeletePriceAlert()
  const scrape = useTriggerScrape()

  const bestPrice = results.length > 0
    ? results.reduce((best: PriceRecord, r: PriceRecord) => r.price < best.price ? r : best)
    : null

  const handleCreateAlert = () => {
    if (!alertName || !alertPrice) return
    createAlert.mutate(
      { ingredient_name: alertName, threshold_price: parseFloat(alertPrice) },
      {
        onSuccess: () => {
          toast.success('Alerta creada')
          setAlertName('')
          setAlertPrice('')
        },
        onError: () => toast.error('Error al crear alerta'),
      }
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold amber-text">Comparador de Precios</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode((v: 'cards' | 'table') => v === 'cards' ? 'table' : 'cards')}
            className="border-zinc-600"
          >
            {viewMode === 'cards' ? 'Ver tabla' : 'Ver tarjetas'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Buscar ingrediente (ej: Cascade, Pale Ale Malt…)"
          className="pl-9 bg-zinc-900 border-zinc-700"
        />
        {isFetching && (
          <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 animate-spin" />
        )}
      </div>

      <Tabs defaultValue="results">
        <TabsList className="bg-zinc-900 border border-zinc-700">
          <TabsTrigger value="results">Resultados ({results.length})</TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="w-3.5 h-3.5 mr-1" />
            Alertas ({alerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          {results.length === 0 && !isFetching && query.length > 2 && (
            <div className="text-center py-12 text-zinc-500">
              <p>Sin resultados para «{query}».</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-amber-500 text-amber-400"
                onClick={() => scrape.mutate(0)}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Actualizar precios
              </Button>
            </div>
          )}

          {results.length > 0 && (
            viewMode === 'cards' ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r: PriceRecord, i: number) => (
                  <PriceCard
                    key={`${r.shop_name}-${r.product_name}-${i}`}
                    record={r}
                    isBest={bestPrice?.shop_name === r.shop_name && bestPrice?.product_name === r.product_name}
                  />
                ))}
              </div>
            ) : (
              <PriceTable records={results} />
            )
          )}

          {results.length === 0 && query.length <= 2 && (
            <p className="text-center text-zinc-500 py-12">
              Escribe al menos 3 caracteres para buscar
            </p>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-4">
          {/* Create alert */}
          <div className="flex gap-2 flex-wrap">
            <Input
              value={alertName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlertName(e.target.value)}
              placeholder="Ingrediente…"
              className="bg-zinc-900 border-zinc-700 flex-1 min-w-[150px]"
            />
            <Input
              value={alertPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlertPrice(e.target.value)}
              placeholder="Precio máx (€)"
              type="number"
              min="0"
              step="0.01"
              className="bg-zinc-900 border-zinc-700 w-36"
            />
            <Button
              onClick={handleCreateAlert}
              disabled={!alertName || !alertPrice || createAlert.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <BellPlus className="w-4 h-4 mr-1" />
              Crear alerta
            </Button>
          </div>

          {/* Alert list */}
          <div className="flex flex-wrap gap-2">
            {alerts.map((a: PriceAlert) => (
              <PriceAlertBadge
                key={a.id}
                alert={a}
                onDelete={id => deleteAlert.mutate(id)}
              />
            ))}
            {alerts.length === 0 && (
              <p className="text-sm text-zinc-500">Sin alertas activas.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
