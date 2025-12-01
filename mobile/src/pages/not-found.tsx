import { Button } from "../components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Page Not Found
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button onClick={() => (window.location.href = "/")} data-testid="button-go-home">
          <Home className="w-4 h-4 mr-2" />
          Go back home
        </Button>
        <Button variant="ghost" onClick={() => window.history.back()} data-testid="button-go-back">
          Go back
        </Button>
      </div>
    </div>
  );
}
