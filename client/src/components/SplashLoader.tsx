import { CalendarDays } from "lucide-react"

export default function SplashLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] w-full bg-background animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 shadow-soft mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <CalendarDays className="h-8 w-8 text-primary animate-pulse" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Loading Smart Study...</h2>
      <p className="text-sm text-muted-foreground">Preparing your personalized dashboard</p>
    </div>
  )
}
