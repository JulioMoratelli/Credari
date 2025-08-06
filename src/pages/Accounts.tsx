import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, DollarSign, ArrowLeft } from 'lucide-react';

interface BankAccount {
  id: string;
  name: string;
  description: string;
  initial_balance: number;
  current_balance: number;
  created_at: string;
}

export default function Accounts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initial_balance: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as contas bancárias.',
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
      const initialBalance = parseFloat(formData.initial_balance) || 0;
      
      const { error } = await supabase
        .from('bank_accounts')
        .insert({
          name: formData.name,
          description: formData.description,
          initial_balance: initialBalance,
          current_balance: initialBalance,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Conta bancária criada com sucesso!',
      });

      setFormData({ name: '', description: '', initial_balance: '' });
      setIsDialogOpen(false);
      loadAccounts();
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a conta bancária.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Contas Bancárias</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            <h1 className="text-2xl md:text-3xl font-bold">Contas Bancárias</h1>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nova Conta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Conta Corrente Banco X"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da conta..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="initial_balance">Saldo Inicial</Label>
                <Input
                  id="initial_balance"
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Criando...' : 'Criar Conta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Nenhuma conta cadastrada</h3>
                <p className="text-muted-foreground">
                  Comece criando sua primeira conta bancária para gerenciar suas finanças.
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Conta
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                  <Badge variant="outline">
                    <CreditCard className="mr-1 h-3 w-3" />
                    Ativa
                  </Badge>
                </div>
                {account.description && (
                  <p className="text-sm text-muted-foreground">{account.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Saldo Atual</span>
                    <div className="flex items-center">
                      <DollarSign className="mr-1 h-4 w-4 text-green-600" />
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(Number(account.current_balance))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Saldo Inicial</span>
                    <span className="text-sm">
                      {formatCurrency(Number(account.initial_balance))}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Criada em</span>
                    <span className="text-sm">
                      {new Date(account.created_at).toLocaleDateString('pt-BR')}
                    </span>
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