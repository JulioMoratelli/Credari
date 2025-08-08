-- Corrigir a política de criação de grupos
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;

-- Nova política mais permissiva para criação de grupos
CREATE POLICY "Authenticated users can create groups" 
ON public.groups 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = admin_id);

-- Verificar se a política de visualização também está correta
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

CREATE POLICY "Users can view groups they are members of" 
ON public.groups 
FOR SELECT 
TO authenticated
USING (user_can_view_group(id));