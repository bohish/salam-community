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
    <div className="w-full h-56">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <PolarAngleAxis dataKey="k" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10.5, fontWeight: 600, letterSpacing: 1 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="v"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            fill="hsl(var(--primary))"
            fillOpacity={0.18}
            isAnimationActive
            animationDuration={700}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatRadar;
