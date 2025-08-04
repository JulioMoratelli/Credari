-- Criar tabela de convites para grupos
CREATE TABLE public.group_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Adicionar índices para performance
CREATE INDEX idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX idx_group_invitations_email ON public.group_invitations(invited_email);
CREATE INDEX idx_group_invitations_status ON public.group_invitations(status);

-- Criar índice único para evitar convites duplicados
CREATE UNIQUE INDEX idx_group_invitations_unique_pending 
ON public.group_invitations(group_id, invited_email) 
WHERE status = 'pending';

-- Habilitar RLS
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para convites
-- Admins do grupo podem ver todos os convites do grupo
CREATE POLICY "Group admins can view invitations" 
ON public.group_invitations 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT admin_id FROM public.groups 
    WHERE id = group_invitations.group_id
  )
);

-- Usuários podem ver convites enviados para o seu email
CREATE POLICY "Users can view their own invitations" 
ON public.group_invitations 
FOR SELECT 
USING (
  invited_email IN (
    SELECT email FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Admins do grupo podem criar convites
CREATE POLICY "Group admins can create invitations" 
ON public.group_invitations 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT admin_id FROM public.groups 
    WHERE id = group_invitations.group_id
  )
  AND auth.uid() = invited_by
);

-- Usuários podem atualizar convites enviados para eles
CREATE POLICY "Users can respond to their invitations" 
ON public.group_invitations 
FOR UPDATE 
USING (
  invited_email IN (
    SELECT email FROM public.profiles 
    WHERE user_id = auth.uid()
  )
  AND status = 'pending'
  AND expires_at > now()
);

-- Admins podem cancelar convites do seu grupo
CREATE POLICY "Group admins can cancel invitations" 
ON public.group_invitations 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT admin_id FROM public.groups 
    WHERE id = group_invitations.group_id
  )
);

-- Função para aceitar convite automaticamente
CREATE OR REPLACE FUNCTION public.accept_group_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
  user_email TEXT;
BEGIN
  -- Buscar email do usuário atual
  SELECT email INTO user_email 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Buscar convite válido
  SELECT * INTO invitation_record
  FROM public.group_invitations
  WHERE id = invitation_id
    AND invited_email = user_email
    AND status = 'pending'
    AND expires_at > now();
    
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se já é membro
  IF EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = invitation_record.group_id 
    AND user_id = auth.uid()
  ) THEN
    -- Atualizar status mesmo se já for membro
    UPDATE public.group_invitations
    SET status = 'accepted', responded_at = now()
    WHERE id = invitation_id;
    RETURN TRUE;
  END IF;
  
  -- Adicionar como membro
  INSERT INTO public.group_members (group_id, user_id, permission_level)
  VALUES (invitation_record.group_id, auth.uid(), 'member');
  
  -- Atualizar status do convite
  UPDATE public.group_invitations
  SET status = 'accepted', responded_at = now()
  WHERE id = invitation_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;