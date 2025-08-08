import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Plus, PlusCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import AIInsights from '@/components/AIInsights';

interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  accountsCount: number;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: string;
    transaction_date: string;
    bank_account: { name: string };
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    accountsCount: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Buscar contas bancárias
      const { data: accounts, error: accountsError } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('user_id', user?.id);

      if (accountsError) throw accountsError;

      // Buscar transações recentes
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          description,
          amount,
          type,
          transaction_date,
          bank_accounts!inner(name)
        `)
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false })
        .limit(5);

      if (transactionsError) throw transactionsError;

      // Buscar totais de receitas e despesas do mês atual
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user?.id)
        .gte('transaction_date', `${currentMonth}-01`);

      if (monthlyError) throw monthlyError;

      // Calcular totais
      const totalBalance = accounts?.reduce((sum, account) => sum + Number(account.current_balance), 0) || 0;
      const totalIncome = monthlyData?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalExpenses = monthlyData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      setData({
        totalBalance,
        totalIncome,
        totalExpenses,
        accountsCount: accounts?.length || 0,
        recentTransactions: transactions?.map(t => ({
          ...t,
          bank_account: t.bank_accounts
        })) || [],
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold gradient-bg bg-clip-text text-transparent">
            Dashboard Inteligente
          </h1>
          <p className="text-muted-foreground flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Bem-vindo, {user?.user_metadata?.display_name || user?.email}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Link to="/accounts" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Criar Conta</span>
              <span className="sm:hidden">Nova Conta</span>
            </Button>
          </Link>
          <Link to="/transactions" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Fazer Lançamento</span>
              <span className="sm:hidden">Novo Lançamento</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-glow transition-all duration-300 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gradient-bg bg-clip-text text-transparent">
              {formatCurrency(data.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Em {data.accountsCount} conta{data.accountsCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-glow transition-all duration-300 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(data.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card className="hover-glow transition-all duration-300 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(data.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card className="hover-glow transition-all duration-300 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.accountsCount}</div>
            <p className="text-xs text-muted-foreground">Cadastradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Insights */}
      <div className="grid gap-6 lg:grid-cols-1">
        <AIInsights />
      </div>

      <Card className="hover-glow transition-all duration-300 shadow-elegant">
        <CardHeader className="gradient-bg text-white">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Transações Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {data.recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma transação encontrada.
                </p>
              </div>
            ) : (
              data.recentTransactions.map((transaction, index) => (
                <div 
                  key={transaction.id} 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-medium truncate">{transaction.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
                      <span className="truncate">
                        {transaction.bank_account.name}
                      </span>
                      <span>
                        {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Badge 
                      variant={transaction.type === 'income' ? 'default' : 'destructive'} 
                      className="self-start sm:self-center"
                    >
                      {transaction.type === 'income' ? '💰 Receita' : '💸 Despesa'}
                    </Badge>
                    <p className={`text-lg font-bold ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}