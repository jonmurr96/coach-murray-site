import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";

const OnboardingForm = lazy(() => import("./pages/OnboardingForm"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ClientDashboard = lazy(() => import("./pages/dashboard/ClientDashboard"));

function DefaultRoute() {
  const params = new URLSearchParams(window.location.search);
  const requested = import.meta.env.DEV ? params.get("route") : null;
  const destination =
    requested === "dashboard"
      ? "/dashboard"
      : requested === "admin"
        ? "/admin"
        : "/onboarding";
  return <Redirect to={`${destination}${window.location.search}`} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Suspense
        fallback={
          <main
            id="main-content"
            className="flex min-h-screen items-center justify-center text-sm text-[var(--cm-text-muted)]"
          >
            Loading Coach Murray…
          </main>
        }
      >
        <Switch>
          <Route path="/onboarding" component={OnboardingForm} />
          <Route path="/dashboard" component={ClientDashboard} />
          <Route path="/portal">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/admin" component={AdminDashboard} />
          <Route>
            <DefaultRoute />
          </Route>
        </Switch>
      </Suspense>
      <Toaster theme="dark" richColors closeButton position="top-right" />
    </ErrorBoundary>
  );
}
