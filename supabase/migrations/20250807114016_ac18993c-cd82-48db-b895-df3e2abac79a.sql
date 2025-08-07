-- Adicionar nova coluna para transações compartilhadas
ALTER TABLE public.transactions 
ADD COLUMN is_shared BOOLEAN DEFAULT false;

-- Adicionar nova coluna para grupo_id em transações
ALTER TABLE public.transactions 
ADD COLUMN group_id UUID REFERENCES public.groups(id);

-- Criar nova tabela para metas financeiras
CREATE TABLE public.financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id),
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  target_date DATE,
  category TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para metas financeiras
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;

-- Políticas para metas financeiras
CREATE POLICY "Users can view their own goals" 
ON public.financial_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.financial_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.financial_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.financial_goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_financial_goals_updated_at
BEFORE UPDATE ON public.financial_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Atualizar políticas das transações para suportar transações compartilhadas
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  (group_id IS NOT NULL AND auth.uid() IN (
    SELECT user_id FROM public.group_members WHERE group_id = transactions.group_id
  ))
);

-- Atualizar política de criação de transações para suportar grupos
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (
    (bank_account_id IS NOT NULL AND auth.uid() IN (
      SELECT ba.user_id FROM bank_accounts ba WHERE ba.id = transactions.bank_account_id
    )) OR
    (group_id IS NOT NULL AND auth.uid() IN (
      SELECT gm.user_id FROM group_members gm WHERE gm.group_id = transactions.group_id
    ))
  )
);