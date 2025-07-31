import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import Dashboard from './Dashboard';
import Home from './Home';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Home />;
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default Index;
