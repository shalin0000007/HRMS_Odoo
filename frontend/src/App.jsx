// Import React Query for fetching and caching backend data
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import our custom application router that handles all page navigation
import AppRouter from './router/AppRouter';

// Initialize a new QueryClient instance to manage the global cache
const queryClient = new QueryClient();

function App() {
  return (
    // Wrap the entire application in the QueryClientProvider
    // This allows any component to use useQuery or useMutation
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  );
}

export default App;
