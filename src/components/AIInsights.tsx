import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Lightbulb,
  Sparkles
} from 'lucide-react';

interface AIInsightData {
  monthlySpendingTrend: number;
  topCategory: string;
  savingsOpportunity: number;
  budgetAlert: boolean;
  nextMonthPrediction: number;
}

export default function AIInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateInsights();
    }
  }, [user]);

  const generateInsights = async () => {
    try {
      // Buscar dados dos últimos 3 meses
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type, category, transaction_date')
        .eq('user_id', user?.id)
        .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0]);

      if (transactions && transactions.length > 0) {
        // Calcular insights básicos
        const currentMonth = new Date().toISOString().slice(0, 7);
        const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
        
        const currentMonthExpenses = transactions
          .filter(t => t.type === 'expense' && t.transaction_date.startsWith(currentMonth))
          .reduce((sum, t) => sum + Number(t.amount), 0);
          
        const lastMonthExpenses = transactions
          .filter(t => t.type === 'expense' && t.transaction_date.startsWith(lastMonth))
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const monthlyTrend = lastMonthExpenses > 0 
          ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
          : 0;

        // Categoria mais gasta
        const categoryTotals: Record<string, number> = {};
        transactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            categoryTotals[t.category || 'Outros'] = (categoryTotals[t.category || 'Outros'] || 0) + Number(t.amount);
          });

        const topCategory = Object.entries(categoryTotals)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Sem dados';

        // Oportunidade de economia (gastos acima da média)
        const averageExpense = currentMonthExpenses > 0 ? currentMonthExpenses / 30 : 0;
        const savingsOpportunity = Math.max(0, averageExpense * 0.15); // 15% de economia potencial

        setInsights({
          monthlySpendingTrend: monthlyTrend,
          topCategory,
          savingsOpportunity,
          budgetAlert: monthlyTrend > 20,
          nextMonthPrediction: currentMonthExpenses * (1 + (monthlyTrend / 100))
        });
      }
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
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
      <Card className="hover-glow transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            <span>Insights Inteligentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="hover-glow transition-all duration-300">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">Insights em Desenvolvimento</h3>
              <p className="text-muted-foreground">
                Adicione mais transações para receber insights personalizados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-glow transition-all duration-300 shadow-elegant">
      <CardHeader className="gradient-bg text-white">
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 animate-bounce-subtle" />
          <span>Insights Inteligentes</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Trend de Gastos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {insights.monthlySpendingTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm font-medium">Tendência de Gastos</span>
            </div>
            <Badge variant={insights.monthlySpendingTrend > 20 ? "destructive" : "default"}>
              {insights.monthlySpendingTrend > 0 ? '+' : ''}{insights.monthlySpendingTrend.toFixed(1)}%
            </Badge>
          </div>
          <Progress 
            value={Math.min(Math.abs(insights.monthlySpendingTrend), 100)} 
            className="h-2"
          />
        </div>

        {/* Categoria Principal */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm">Maior Gasto</span>
          </div>
          <Badge variant="outline">{insights.topCategory}</Badge>
        </div>

        {/* Alerta de Orçamento */}
        {insights.budgetAlert && (
          <div className="flex items-center space-x-3 p-3 bg-warning/10 border-l-4 border-warning rounded-r-lg">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-medium">Alerta de Orçamento</p>
              <p className="text-xs text-muted-foreground">
                Seus gastos aumentaram mais de 20% este mês
              </p>
            </div>
          </div>
        )}

        {/* Sugestão de Economia */}
        <div className="space-y-3 p-4 gradient-success rounded-lg text-white">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span className="text-sm font-medium">Oportunidade de Economia</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(insights.savingsOpportunity)}</p>
          <p className="text-xs opacity-90">
            Reduzindo 15% dos gastos em {insights.topCategory}
          </p>
        </div>

        {/* Previsão */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Previsão para próximo mês</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(insights.nextMonthPrediction)}
          </p>
        </div>

        <Button 
          onClick={generateInsights}
          variant="outline" 
          className="w-full"
          size="sm"
        >
          <Brain className="h-4 w-4 mr-2" />
          Atualizar Insights
        </Button>
      </CardContent>
    </Card>
  );
}