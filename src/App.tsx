
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainNav } from "./components/MainNav";
import Index from "./pages/Index";
import MyQueue from "./pages/MyQueue";
import AllQueues from "./pages/AllQueues";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <header className="border-b">
            <div className="container py-4">
              <h1 className="text-2xl font-bold text-hospital-700">ระบบจองคิวโรงพยาบาล</h1>
            </div>
          </header>
          <MainNav />
          <main className="flex-1 container py-6 animate-fadeIn">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/my-queue" element={<MyQueue />} />
              <Route path="/all-queues" element={<AllQueues />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
