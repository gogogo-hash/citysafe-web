import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/auth/AuthContext";
import SignInScreen from "@/auth/SignInScreen";
import AddIncidentScreen from "@/incidents/AddIncidentScreen";
import MapScreen from "@/map/MapScreen";
import RootLayout from "@/app/RootLayout";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/sign-in" element={<SignInScreen />} />
            <Route path="/" element={<RootLayout />}>
              <Route index element={<MapScreen />} />
              <Route path="add" element={<AddIncidentScreen />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
