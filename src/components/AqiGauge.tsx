import { BANDS } from "@/lib/aqi";

const WIDTH = 300;
const HEIGHT = 16;
const SCALE_MAX = 300;
const COLORS = ["#2f855a", "#b7a100", "#c05621", "#b91c1c", "#6b21a8", "#6b21a8"] as const;

const toX = (value: number) => (Math.min(value, SCALE_MAX) / SCALE_MAX) * WIDTH;

interface Props {
  aqi: number;
  label: string;
}

/** SVG gauge. Uses presentation attributes only, so it works under a strict style-src CSP. */
export function AqiGauge({ aqi, label }: Props) {
  const markerX = toX(aqi);
  return (
    <svg className="gauge" viewBox={`0 0 ${WIDTH} ${HEIGHT + 12}`} role="img" aria-label={`AQI ${aqi}, ${label}`}>
      {BANDS.slice(0, -1).map((band, i) => {
        const from = i === 0 ? 0 : toX(BANDS[i - 1]!.max);
        return <rect key={band.id} x={from} y={6} width={toX(band.max) - from} height={HEIGHT} fill={COLORS[i]} />;
      })}
      <rect
        x={markerX - 3}
        y={0}
        width={6}
        height={HEIGHT + 12}
        rx={3}
        fill="#17262b"
        stroke="#ffffff"
        strokeWidth={2}
      />
    </svg>
  );
}
