-- Verificar as políticas atuais e corrigir o problema de criação de grupos
-- Primeiro, vamos remover todas as políticas da tabela groups e recriar

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can delete their groups" ON public.groups;

-- Política para criação de grupos - mais simples e direta
CREATE POLICY "Enable insert for authenticated users" 
ON public.groups 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = admin_id);

-- Política para visualização de grupos
CREATE POLICY "Enable select for group members" 
ON public.groups 
FOR SELECT 
TO authenticated
USING (user_can_view_group(id));

-- Política para atualização de grupos
CREATE POLICY "Enable update for group admins" 
ON public.groups 
FOR UPDATE 
TO authenticated
USING (auth.uid() = admin_id);

-- Política para exclusão de grupos
CREATE POLICY "Enable delete for group admins" 
ON public.groups 
FOR DELETE 
TO authenticated
USING (auth.uid() = admin_id);