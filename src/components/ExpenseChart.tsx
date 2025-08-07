import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  income?: number;
  expense?: number;
}

export default function ExpenseChart() {
  const { user } = useAuth();
  const [chartType, setChartType] = useState<'monthly' | 'category' | 'trend'>('monthly');
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChartData();
    }
  }, [user, chartType]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      switch (chartType) {
        case 'monthly':
          await loadMonthlyData();
          break;
        case 'category':
          await loadCategoryData();
          break;
        case 'trend':
          await loadTrendData();
          break;
      }
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, transaction_date')
      .eq('user_id', user?.id)
      .gte('transaction_date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (transactions) {
      const monthlyData: Record<string, { income: number; expense: number }> = {};
      
      transactions.forEach(t => {
        const month = new Date(t.transaction_date).toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit' 
        });
        
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expense: 0 };
        }
        
        if (t.type === 'income') {
          monthlyData[month].income += Number(t.amount);
        } else {
          monthlyData[month].expense += Number(t.amount);
        }
      });

      const chartData = Object.entries(monthlyData).map(([month, values]) => ({
        name: month,
        income: values.income,
        expense: values.expense,
        value: values.expense // Para compatibilidade
      }));

      setData(chartData);
    }
  };

  const loadCategoryData = async () => {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, category')
      .eq('user_id', user?.id)
      .eq('type', 'expense')
      .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (transactions) {
      const categoryData: Record<string, number> = {};
      
      transactions.forEach(t => {
        const category = t.category || 'Outros';
        categoryData[category] = (categoryData[category] || 0) + Number(t.amount);
      });

      const chartData = Object.entries(categoryData)
        .map(([category, amount]) => ({
          name: category,
          value: amount
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 categorias

      setData(chartData);
    }
  };

  const loadTrendData = async () => {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, transaction_date')
      .eq('user_id', user?.id)
      .gte('transaction_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('transaction_date');

    if (transactions) {
      const dailyData: Record<string, number> = {};
      
      transactions.forEach(t => {
        const date = new Date(t.transaction_date).toLocaleDateString('pt-BR', { 
          day: '2-digit',
          month: '2-digit'
        });
        
        if (!dailyData[date]) {
          dailyData[date] = 0;
        }
        
        if (t.type === 'expense') {
          dailyData[date] += Number(t.amount);
        }
      });

      const chartData = Object.entries(dailyData).map(([date, amount]) => ({
        name: date,
        value: amount
      }));

      setData(chartData);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const COLORS = [
    'hsl(262, 83%, 58%)',
    'hsl(314, 86%, 60%)',
    'hsl(142, 71%, 45%)',
    'hsl(48, 96%, 53%)',
    'hsl(0, 84%, 60%)',
    'hsl(200, 94%, 50%)',
    'hsl(280, 65%, 60%)',
    'hsl(30, 85%, 55%)'
  ];

  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Carregando gráfico...</div>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-muted-foreground">Sem dados para exibir</div>
            <div className="text-sm text-muted-foreground">
              Adicione algumas transações para ver os gráficos
            </div>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'monthly':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'income' ? 'Receitas' : 'Despesas'
                ]}
              />
              <Bar dataKey="income" fill="hsl(142, 71%, 45%)" name="Receitas" />
              <Bar dataKey="expense" fill="hsl(0, 84%, 60%)" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'category':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'trend':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(262, 83%, 58%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(262, 83%, 58%)', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="hover-glow transition-all duration-300">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <CardTitle className="flex items-center space-x-2">
            {chartType === 'monthly' && <BarChart3 className="h-5 w-5 text-primary" />}
            {chartType === 'category' && <PieChartIcon className="h-5 w-5 text-primary" />}
            {chartType === 'trend' && <TrendingUp className="h-5 w-5 text-primary" />}
            <span>
              {chartType === 'monthly' && 'Receitas vs Despesas'}
              {chartType === 'category' && 'Gastos por Categoria'}
              {chartType === 'trend' && 'Tendência de Gastos'}
            </span>
          </CardTitle>
          <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">📊 Mensal</SelectItem>
              <SelectItem value="category">🍕 Por Categoria</SelectItem>
              <SelectItem value="trend">📈 Tendência</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}