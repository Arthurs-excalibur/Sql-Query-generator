import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Workspace } from './pages/Workspace';
import { Setup } from './pages/Setup';
import { SchemaPage } from './pages/Schema';
import { HistoryPage } from './pages/History';
import { SettingsPage } from './pages/Settings';
import { SavedQueriesPage } from './pages/SavedQueries';
import { DocumentationPage } from './pages/Documentation';
import { PlaceholderPage } from './pages/Placeholder';
import { UploadedFilesPage } from './pages/UploadedFiles';
import { MainLayout } from './components/MainLayout';
import { Bookmark, LifeBuoy } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';

import { useQueryStore } from './store/queryStore';
import { useEffect } from 'react';

function App() {
  const theme = useQueryStore(s => s.theme);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toast />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Setup />} />
            <Route path="/setup" element={<Navigate to="/" replace />} />
          
          <Route path="/workspace" element={<MainLayout><Workspace /></MainLayout>} />
          <Route path="/schema" element={<MainLayout><SchemaPage /></MainLayout>} />
          <Route path="/history" element={<MainLayout><HistoryPage /></MainLayout>} />
          <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
          <Route path="/saved" element={<MainLayout><SavedQueriesPage /></MainLayout>} />
          <Route path="/uploads" element={<MainLayout><UploadedFilesPage /></MainLayout>} />
          <Route path="/docs" element={<MainLayout><DocumentationPage /></MainLayout>} />
          <Route path="/support" element={<MainLayout><PlaceholderPage title="Support" icon={<LifeBuoy size={32} />} /></MainLayout>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
