
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { LandingPage } from './pages/LandingPage';
import { AdminPage } from './pages/AdminPage';
import { useHashRoute } from './lib/useHashRoute';

export function App() {
  const hash = useHashRoute();
  const isAdminRoute = hash.startsWith('#/admin');
  return (
    <ThemeProvider>
      <DataProvider>{isAdminRoute ? <AdminPage /> : <LandingPage />}</DataProvider>
    </ThemeProvider>
  );
}
