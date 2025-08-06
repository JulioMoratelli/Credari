import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Calendar, Filter, Trash2, ArrowLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  transaction_date: string;
  bank_account: { name: string };
}

interface BankAccount {
  id: string;
  name: string;
}

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: '',
    category: '',
    bank_account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Carregar contas
      const { data: accountsData, error: accountsError } = await supabase
        .from('bank_accounts')
        .select('id, name')
        .eq('user_id', user?.id);

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Carregar transações
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          description,
          amount,
          type,
          category,
          transaction_date,
          bank_accounts!inner(name)
        `)
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false });

      if (transactionsError) throw transactionsError;

      setTransactions(transactionsData?.map(t => ({
        ...t,
        bank_account: t.bank_accounts
      })) || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          description: formData.description,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          bank_account_id: formData.bank_account_id,
          transaction_date: formData.transaction_date,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Transação criada com sucesso!',
      });

      setFormData({
        description: '',
        amount: '',
        type: '',
        category: '',
        bank_account_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a transação.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Transação excluída com sucesso!',
      });

      loadData();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a transação.',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const categories = [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Compras',
    'Salário',
    'Freelance',
    'Investimentos',
    'Outros',
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Transações</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Transações</h1>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nova Transação</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Transação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Compra no supermercado"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bank_account_id">Conta Bancária</Label>
                  <Select value={formData.bank_account_id} onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transaction_date">Data</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting || accounts.length === 0}>
                    {submitting ? 'Criando...' : 'Criar Transação'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Nenhuma conta encontrada</h3>
                <p className="text-muted-foreground">
                  Você precisa criar pelo menos uma conta bancária antes de registrar transações.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Nenhuma transação encontrada</h3>
                <p className="text-muted-foreground">
                  Comece registrando sua primeira transação.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="font-medium truncate">{transaction.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                      <span className="truncate">{transaction.bank_account.name}</span>
                      <span className="truncate">{transaction.category}</span>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                   <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                     <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className="self-start sm:self-center">
                       {transaction.type === 'income' ? (
                         <TrendingUp className="mr-1 h-3 w-3" />
                       ) : (
                         <TrendingDown className="mr-1 h-3 w-3" />
                       )}
                       {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                     </Badge>
                     <div className="flex items-center justify-between sm:justify-start gap-3">
                       <p className={`text-lg font-bold ${
                         transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                       }`}>
                         {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                       </p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir transação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(transaction.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                   </div>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}