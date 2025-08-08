-- Primeiro, vamos verificar se o usuário tem um perfil criado
-- Se não tiver, vamos garantir que ele seja criado automaticamente

-- Atualizar a política de criação de grupos para ser mais permissiva
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;

CREATE POLICY "Users can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = admin_id
);

-- Também vamos garantir que a política de criação de membros está correta
DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;

CREATE POLICY "Group admins can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() IN (
      SELECT g.admin_id 
      FROM public.groups g 
      WHERE g.id = group_members.group_id
    ) OR
    auth.uid() = user_id
  )
);