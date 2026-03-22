// src/components/recipes/recipe-card.tsx
import { motion } from "framer-motion";
import { Beaker, Droplets, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CanBrewBadge } from "./can-brew-badge";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
  index?: number;
}

function srmToHex(srm: number): string {
  // SRM to approximate hex colour (simplified Morey equation palette)
  const clamp = Math.min(Math.max(Math.round(srm), 1), 40);
  const palette: Record<number, string> = {
    1: "#F3F993", 2: "#F5F75C", 3: "#F6F513", 4: "#EAE510",
    5: "#E0D01B", 6: "#D5BC26", 7: "#CDAA37", 8: "#C1963C",
    9: "#BE8C3A", 10: "#BE823A", 11: "#BE7732", 12: "#BE6B25",
    13: "#BE611D", 14: "#BE5716", 15: "#BE4E0F", 16: "#BE430A",
    17: "#B03A05", 18: "#8E2D04", 19: "#701D05", 20: "#5A0F05",
    21: "#4F0E03", 22: "#430C03", 23: "#390A03", 24: "#300802",
    25: "#280702", 26: "#200601", 27: "#180501", 28: "#100300",
    29: "#0C0200", 30: "#080100", 31: "#060100", 32: "#040000",
    33: "#030000", 34: "#020000", 35: "#010000", 40: "#010000",
  };
  return palette[clamp] ?? "#A06010";
}

export function RecipeCard({ recipe, index = 0 }: RecipeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div>
        <Card className="group bg-zinc-900/80 border-zinc-700 hover:border-amber-500/60 transition-colors h-full">
          {/* SRM colour bar */}
          {recipe.srm != null && (
            <div
              className="h-1.5 rounded-t-lg"
              style={{ background: srmToHex(recipe.srm) }}
            />
          )}

          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-tight group-hover:text-amber-400 transition-colors line-clamp-2">
                {recipe.name}
              </h3>
              <CanBrewBadge recipeId={Number(recipe.id)} compact />
            </div>

            {recipe.style && (
              <Badge variant="outline" className="w-fit text-xs mt-1 border-zinc-600 text-zinc-400">
                {recipe.style}
              </Badge>
            )}
          </CardHeader>

          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {recipe.abv != null && (
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>ABV {recipe.abv.toFixed(1)}%</span>
                </div>
              )}
              {recipe.ibu != null && (
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Beaker className="w-3 h-3 text-green-400" />
                  <span>IBU {Math.round(recipe.ibu)}</span>
                </div>
              )}
              {recipe.batch_size_liters && (
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  <span>{recipe.batch_size_liters} L</span>
                </div>
              )}
            </div>

            {/* Ingredient chip count */}
            <p className="mt-2 text-xs text-zinc-500">
              {(recipe.fermentables?.length ?? 0) + (recipe.hops?.length ?? 0) + (recipe.yeasts?.length ?? 0) + (recipe.adjuncts?.length ?? 0)} ingredientes
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
