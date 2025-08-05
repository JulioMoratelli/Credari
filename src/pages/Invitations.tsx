import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, Check, X, Clock, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GroupInvitation {
  id: string;
  invited_email: string;
  status: string;
  created_at: string;
  expires_at: string;
  groups: {
    id: string;
    name: string;
    description: string;
  };
}

export default function Invitations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    try {
      setLoading(true);

      // Buscar email do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Carregar convites para o email do usuário
      const { data: invitationsData, error } = await supabase
        .from('group_invitations')
        .select(`
          id,
          invited_email,
          status,
          created_at,
          expires_at,
          groups (
            id,
            name,
            description
          )
        `)
        .eq('invited_email', profileData.email)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvitations(invitationsData || []);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os convites.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setSubmitting(true);

      const { data, error } = await supabase.rpc('accept_group_invitation', {
        invitation_id: invitationId
      });

      if (error) throw error;

      if (data) {
        toast({
          title: 'Sucesso',
          description: 'Convite aceito! Você agora é membro do grupo.',
        });
        loadInvitations();
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível aceitar o convite. Verifique se ainda é válido.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aceitar o convite.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Convite rejeitado',
        description: 'O convite foi rejeitado.',
      });

      loadInvitations();
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar o convite.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired && status === 'pending') {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
      case 'accepted':
        return <Badge variant="default"><Check className="mr-1 h-3 w-3" />Aceito</Badge>;
      case 'rejected':
        return <Badge variant="secondary"><X className="mr-1 h-3 w-3" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canRespond = (status: string, expiresAt: string) => {
    return status === 'pending' && new Date(expiresAt) > new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando convites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Convites de Grupo</h1>
          <p className="text-muted-foreground">
            Gerencie os convites para participar de grupos
          </p>
        </div>
        <Button onClick={() => navigate('/group-members')} className="w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Convidar Membros</span>
          <span className="sm:hidden">Convidar</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus Convites ({invitations.length})</CardTitle>
          <CardDescription>
            Convites recebidos para participar de grupos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <Mail className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{invitation.groups.name}</p>
                    {invitation.groups.description && (
                      <p className="text-sm text-muted-foreground truncate">{invitation.groups.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Recebido em {new Date(invitation.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(invitation.status, invitation.expires_at)}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {invitation.status === 'pending' && (
                    <p className="text-sm text-muted-foreground">
                      Expira em {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  
                  {canRespond(invitation.status, invitation.expires_at) && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={submitting}
                        className="w-full sm:w-auto"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Aceitar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={submitting} className="w-full sm:w-auto">
                            <X className="mr-1 h-4 w-4" />
                            Rejeitar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Rejeitar convite</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja rejeitar este convite para o grupo "{invitation.groups.name}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRejectInvitation(invitation.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Rejeitar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {invitations.length === 0 && (
              <div className="text-center py-8">
                <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum convite recebido.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}