import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
// import GroupMembers from "./pages/GroupMembers";
// import CreateGroup from "./pages/CreateGroup";
// import Invitations from "./pages/Invitations";
import NotFound from "./pages/NotFound";
import { SpeedInsights } from "@vercel/speed-insights/react"

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SpeedInsights />
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/accounts" element={
                <Layout>
                  <Accounts />
                </Layout>
              } />
              <Route path="/transactions" element={
                <Layout>
                  <Transactions />
                </Layout>
              } />
              <Route path="/profile" element={
                <Layout>
                  <Profile />
                </Layout>
              } />
              {/* <Route path="/group-members" element={
                <Layout>
                  <GroupMembers />
                </Layout>
              } />
              <Route path="/create-group" element={
                <Layout>
                  <CreateGroup />
                </Layout>
              } />
              <Route path="/invitations" element={
                <Layout>
                  <Invitations />
                </Layout>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
