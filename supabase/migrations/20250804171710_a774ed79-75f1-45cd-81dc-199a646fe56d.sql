-- Corrigir recursão infinita na política RLS da tabela groups
-- Primeiro, criar função de segurança para evitar referência circular
CREATE OR REPLACE FUNCTION public.user_can_view_group(group_id_param uuid)
RETURNS boolean AS $$
BEGIN
  -- Usuário pode ver o grupo se for admin ou membro
  RETURN EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id_param AND admin_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_id_param AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Remover política problemática
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

-- Criar nova política usando a função
CREATE POLICY "Users can view groups they are members of" 
ON public.groups 
FOR SELECT 
USING (public.user_can_view_group(id));