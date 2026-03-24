// src/components/fermentation/ispindel-card.tsx
import { useTranslation } from 'react-i18next'
import { Wifi, WifiOff, Battery, Thermometer, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { ISpindelReading } from "@/lib/types";

interface ISpindelCardProps {
  reading: ISpindelReading | null;
  online?: boolean;
  name?: string;
}

function batteryColor(pct: number) {
  if (pct > 60) return "text-green-400";
  if (pct > 30) return "text-amber-400";
  return "text-red-400";
}

// iSpindel battery voltage → percentage (3.0–4.2V range)
function voltageToPct(v: number) {
  return Math.min(100, Math.max(0, Math.round(((v - 3.0) / 1.2) * 100)));
}

export function ISpindelCard({ reading, online = false, name }: ISpindelCardProps) {
  const { t, i18n } = useTranslation('common')
  const batPct = reading ? voltageToPct(reading.battery) : null;
  const dateFnsLocale = i18n.language === 'en' ? enUS : es;

  return (
    <Card className="bg-zinc-900/80 border-zinc-700">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {online ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-zinc-500" />
          )}
          {name ?? reading?.name ?? "iSpindel"}
        </CardTitle>
        <Badge variant={online ? "default" : "secondary"} className="text-xs">
          {online ? t('fermentation.online') : t('fermentation.offline')}
        </Badge>
      </CardHeader>

      <CardContent>
        {reading ? (
          <div className="grid grid-cols-2 gap-3">
            {/* Gravity */}
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-zinc-400">{t('fermentation.gravity')}</p>
                <p className="font-semibold">{reading.gravity.toFixed(3)}</p>
              </div>
            </div>

            {/* Temperature */}
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs text-zinc-400">{t('fermentation.temperature')}</p>
                <p className="font-semibold">{reading.temperature.toFixed(1)} °C</p>
              </div>
            </div>

            {/* Angle */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-sm shrink-0">°</span>
              <div>
                <p className="text-xs text-zinc-400">{t('fermentation.angle')}</p>
                <p className="font-semibold">{reading.angle.toFixed(1)}°</p>
              </div>
            </div>

            {/* Battery */}
            <div className="flex items-center gap-2">
              <Battery className={`w-4 h-4 shrink-0 ${batteryColor(batPct ?? 0)}`} />
              <div>
                <p className="text-xs text-zinc-400">{t('fermentation.battery')}</p>
                <p className={`font-semibold ${batteryColor(batPct ?? 0)}`}>
                  {batPct}% ({reading.battery.toFixed(2)}V)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 text-center py-4">
            {t('fermentation.no_recent_data')}
          </p>
        )}

        {reading && (
          <p className="text-xs text-zinc-500 mt-3 text-right">
            {formatDistanceToNow(new Date(reading.timestamp), {
              locale: dateFnsLocale,
              addSuffix: true,
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
