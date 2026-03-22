// frontend/src/pages/recipes.tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Search, Upload, RefreshCw } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useRecipes, useImportBeerXML, useStartBrewFromRecipe } from '@/hooks/use-recipes'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import type { Recipe } from '@/lib/types'

export default function RecipesPage() {
  const { setActivePage } = useUIStore()
  useEffect(() => { setActivePage('recipes') }, [setActivePage])

  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { data: recipes = [], isLoading } = useRecipes(search || undefined)
  const importBeerXML = useImportBeerXML()
  const startBrew = useStartBrewFromRecipe()

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    importBeerXML.mutate(file, {
      onSuccess: (imported: Recipe[]) => toast.success(`${imported.length} receta(s) importada(s)`),
      onError: () => toast.error('Error al importar BeerXML'),
    })
    e.target.value = ''
  }, [importBeerXML])

  const handleStartBrew = (recipeId: string) => {
    startBrew.mutate(Number(recipeId), {
      onSuccess: ({ session_id }: { session_id: number }) => {
        toast.success('¡Sesión de elaboración iniciada!')
        navigate({ to: '/brewing' })
      },
      onError: () => toast.error('Error al iniciar elaboración'),
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold amber-text">Recetas</h1>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xml"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-600"
            onClick={() => fileRef.current?.click()}
            disabled={importBeerXML.isPending}
          >
            {importBeerXML.isPending
              ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              : <Upload className="w-4 h-4 mr-1" />}
            Importar BeerXML
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Buscar recetas…"
          className="pl-9 bg-zinc-900 border-zinc-700"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_: unknown, i: number) => (
            <div key={i} className="h-48 rounded-xl bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="mb-3">{search ? `Sin resultados para «${search}»` : 'No tienes recetas aún.'}</p>
          {!search && (
            <p className="text-sm text-zinc-600">Importa un archivo BeerXML o créalas desde el asistente IA.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe: Recipe, i: number) => (
            <div key={recipe.id} className="relative group">
              <RecipeCard recipe={recipe} index={i} />
              {/* Hover actions */}
              <div className="absolute bottom-3 right-3 gap-2 hidden group-hover:flex">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500 text-amber-400 text-xs"
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); handleStartBrew(recipe.id) }}
                >
                  Elaborar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
