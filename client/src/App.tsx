import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Homepage from "@/pages/homepage";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import NetCalculator from "@/pages/net-calculator";
import Timer from "@/pages/timer";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/tasks" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/net-calculator" component={NetCalculator} />
      <Route path="/timer" component={Timer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
