import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from "recharts";
import type { Player } from "@/types/player";

const StatRadar = ({ player }: { player: Player }) => {
  const data = player.isGK
    ? [
        { k: "DIV", v: +player.raw["GK Diving"] || 0 },
        { k: "HAN", v: +player.raw["GK Handling"] || 0 },
        { k: "KIC", v: +player.raw["GK Kicking"] || 0 },
        { k: "REF", v: +player.raw["GK Reflexes"] || 0 },
        { k: "SPD", v: player.pace },
        { k: "POS", v: +player.raw["GK Positioning"] || 0 },
      ]
    : [
        { k: "PAC", v: player.pace },
        { k: "SHO", v: player.shooting },
        { k: "PAS", v: player.passing },
        { k: "DRI", v: player.dribbling },
        { k: "DEF", v: player.defending },
        { k: "PHY", v: player.physical },
      ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="78%">
          <defs>
            <radialGradient id="radarFill">
              <stop offset="0%" stopColor="hsl(var(--primary-glow))" stopOpacity={0.55} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
            </radialGradient>
          </defs>
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <PolarAngleAxis dataKey="k" tick={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 800 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#radarFill)" isAnimationActive animationDuration={900} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatRadar;
