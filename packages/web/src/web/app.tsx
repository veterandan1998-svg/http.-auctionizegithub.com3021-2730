import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { ProtectedRoute } from "./components/protected-route";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

import Index from "./pages/index";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import ListingsPage from "./pages/listings";
import ListingDetailPage from "./pages/listing-detail";
import SellPage from "./pages/sell";
import MessagesPage from "./pages/messages";
import SellerDashboard from "./pages/seller-dashboard";
import BuyerDashboard from "./pages/buyer-dashboard";
import AdminPage from "./pages/admin";
import ProfilePage from "./pages/profile";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/sign-up" component={SignUpPage} />
        <Route path="/listings" component={ListingsPage} />
        <Route path="/listings/:id">
          {(params) => <ListingDetailPage id={params.id!} />}
        </Route>
        <Route path="/sell">
          <ProtectedRoute><SellPage /></ProtectedRoute>
        </Route>
        <Route path="/messages">
          <ProtectedRoute><MessagesPage /></ProtectedRoute>
        </Route>
        <Route path="/dashboard/seller">
          <ProtectedRoute><SellerDashboard /></ProtectedRoute>
        </Route>
        <Route path="/dashboard/buyer">
          <ProtectedRoute><BuyerDashboard /></ProtectedRoute>
        </Route>
        <Route path="/admin">
          <ProtectedRoute><AdminPage /></ProtectedRoute>
        </Route>
        <Route path="/profile/:id">
          {(params) => <ProfilePage id={params.id!} />}
        </Route>
        {/* Fallback */}
        <Route>
          <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 80 }}>404</div>
            <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 32, color: "white" }}>Page not found</div>
            <a href="/" style={{ color: "var(--primary)", fontFamily: "Inter", fontSize: 16 }}>← Go home</a>
          </div>
        </Route>
      </Switch>
      {import.meta.env.DEV && <AgentFeedback />}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
