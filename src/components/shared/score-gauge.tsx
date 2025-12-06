export function ScoreGauge({
  score,
  label,
}: {
  score: number
  label: string
}) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 10) * circumference
  
  let colorClass = "stroke-accent"
  if (label === "Bias") {
    if (score > 7) colorClass = "stroke-destructive"
    else if (score > 4) colorClass = "stroke-yellow-500"
  } else {
    if (score < 4) colorClass = "stroke-destructive"
    else if (score < 7) colorClass = "stroke-yellow-500"
  }


  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{score}</span>
            <span className="text-sm text-muted-foreground">/10</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  )
}
