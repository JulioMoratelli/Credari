-- Corrigir política RLS da tabela groups para permitir que usuários vejam grupos onde são administradores
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

CREATE POLICY "Users can view groups they are members of" 
ON public.groups 
FOR SELECT 
USING (
  (auth.uid() = admin_id) OR 
  (auth.uid() IN (
    SELECT group_members.user_id
    FROM group_members
    WHERE group_members.group_id = groups.id
  ))
);