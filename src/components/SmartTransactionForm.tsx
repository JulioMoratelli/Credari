import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  User,
  Sparkles,
  Calculator,
  Calendar,
  Tag
} from 'lucide-react';

interface SmartTransactionFormProps {
  accounts: Array<{ id: string; name: string }>;
  // groups: Array<{ id: string; name: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SmartTransactionForm({
  accounts,
  // groups, 
  onSuccess,
  onCancel
}: SmartTransactionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: '',
    category: '',
    bank_account_id: '',
    // group_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    is_shared: false,
  });

  const categories = [
    { value: 'Alimentação', emoji: '🍕' },
    { value: 'Transporte', emoji: '🚗' },
    { value: 'Moradia', emoji: '🏠' },
    { value: 'Saúde', emoji: '⚕️' },
    { value: 'Educação', emoji: '📚' },
    { value: 'Lazer', emoji: '🎬' },
    { value: 'Compras', emoji: '🛍️' },
    { value: 'Salário', emoji: '💰' },
    { value: 'Freelance', emoji: '💻' },
    { value: 'Investimentos', emoji: '📈' },
    { value: 'Outros', emoji: '📝' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const transactionData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        bank_account_id: formData.bank_account_id,
        // group_id: formData.is_shared ? formData.group_id : null,
        transaction_date: formData.transaction_date,
        // is_shared: formData.is_shared,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: `Transação criada com sucesso!`,
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a transação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedCategory = (description: string) => {
    const text = description.toLowerCase();
    if (text.includes('supermercado') || text.includes('restaurante') || text.includes('comida')) {
      return 'Alimentação';
    }
    if (text.includes('uber') || text.includes('gasolina') || text.includes('transporte')) {
      return 'Transporte';
    }
    if (text.includes('aluguel') || text.includes('condomínio') || text.includes('casa')) {
      return 'Moradia';
    }
    if (text.includes('farmácia') || text.includes('médico') || text.includes('hospital')) {
      return 'Saúde';
    }
    return '';
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));

    // Sugestão inteligente de categoria
    const suggestedCategory = getSuggestedCategory(value);
    if (suggestedCategory && !formData.category) {
      setFormData(prev => ({ ...prev, category: suggestedCategory }));
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-elegant">
      <CardHeader className="gradient-bg text-white">
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5" />
          <span>Novo Lançamento Inteligente</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Transação */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Tipo de Transação</Label>
            <div className="flex items-center space-x-4">
              {/* <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_shared}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, is_shared: checked }))
                  }
                />
                <div className="flex items-center space-x-2">
                  {formData.is_shared ? (
                    <>
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Compartilhada</span>
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Pessoal</span>
                    </>
                  )}
                </div>
              </div> */}
              <Badge variant={formData.is_shared ? "default" : "secondary"}>
                {formData.is_shared ? "Grupo" : "Individual"}
              </Badge>
            </div>
          </div>

          {/* Descrição com sugestão inteligente */}
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <span>Descrição</span>
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Ex: Compra no supermercado, Aluguel..."
              className="transition-all duration-200 focus:shadow-md"
              required
            />
          </div>

          {/* Valor e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Valor</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
                className="text-lg font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Receita ou Despesa</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">💰 Receita</SelectItem>
                  <SelectItem value="expense">💸 Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categoria com emojis */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <span className="flex items-center space-x-2">
                      <span>{category.emoji}</span>
                      <span>{category.value}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conta ou Grupo */}
          <div className="space-y-2">
            <Label>
              {formData.is_shared ? 'Grupo' : 'Conta Bancária'}
            </Label>
            {formData.is_shared ? (
              <Select
                value={formData.group_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <span className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{group.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                value={formData.bank_account_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, bank_account_id: value }))}
              >
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
            )}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Data</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
              required
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (formData.is_shared ? groups.length === 0 : accounts.length === 0)}
              className="gradient-bg hover:opacity-90"
            >
              {loading ? 'Criando...' : 'Criar Lançamento'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}