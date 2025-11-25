// Reference: blueprint:javascript_log_in_with_replit
import { Switch, Route, Redirect } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';

// Pages
import Dashboard from '@/pages/Dashboard';
import Inventory from '@/pages/Inventory';
import Scanner from '@/pages/Scanner';
import Reports from '@/pages/Reports';
import ItemDetail from '@/pages/ItemDetail';
import Warehouses from '@/pages/Warehouses';
import Items from '@/pages/Items';
import Landing from '@/pages/Landing';
import NotFound from '@/pages/not-found';
import Login from './pages/login';
import Signup from './pages/Signup';

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  /* ------------ LOADING STATE ----------- */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {!isAuthenticated && <Route path="/" component={Landing} />}

      {!isAuthenticated && <Route path="/dashboard" component={() => <Redirect to="/login" />} />}

      {isAuthenticated && (
        <>
          <Route path="/" component={() => <Redirect to="/dashboard" />} />

          <Route path="/dashboard" component={Dashboard} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/items" component={Items} />
          <Route path="/warehouses" component={Warehouses} />
          <Route path="/scan" component={Scanner} />
          <Route path="/reports" component={Reports} />
          <Route path="/item/:id" component={ItemDetail} />
        </>
      )}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
