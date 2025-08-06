import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Trash2, Copy, Crown, Mail, X, ArrowLeft } from 'lucide-react';

interface GroupMember {
  id: string;
  user_id: string;
  permission_level: string;
  joined_at: string;
  profiles: {
    display_name: string;
    email: string;
  };
}

interface Group {
  id: string;
  name: string;
  admin_id: string;
  invite_code: string;
  description: string;
}

interface GroupInvitation {
  id: string;
  invited_email: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function GroupMembers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadGroupData();
    }
  }, [user]);

  const loadGroupData = async () => {
    try {
      setLoading(true);

      // Carregar grupo do usuário
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('admin_id', user?.id)
        .single();

      if (groupError) {
        if (groupError.code === 'PGRST116') {
          // Usuário não tem grupo
          return;
        }
        throw groupError;
      }

      setGroup(groupData);

      // Carregar membros do grupo
      if (groupData) {
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select(`
            id,
            user_id,
            permission_level,
            joined_at
          `)
          .eq('group_id', groupData.id);

        if (membersError) throw membersError;

        // Buscar perfis separadamente
        if (membersData && membersData.length > 0) {
          const userIds = membersData.map(m => m.user_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, display_name, email')
            .in('user_id', userIds);

          if (profilesError) throw profilesError;

          const membersWithProfiles = membersData.map(member => ({
            ...member,
            profiles: profilesData?.find(p => p.user_id === member.user_id) || {
              display_name: '',
              email: ''
            }
          }));

          setMembers(membersWithProfiles);
        } else {
          setMembers([]);
        }

        // Carregar convites pendentes
        await loadInvitations();
      }
    } catch (error) {
      console.error('Erro ao carregar dados do grupo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do grupo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!addMemberEmail.trim() || !group) return;

    try {
      setSubmitting(true);

      // Verificar se já existe convite pendente
      const { data: existingInvitation } = await supabase
        .from('group_invitations')
        .select('id')
        .eq('group_id', group.id)
        .eq('invited_email', addMemberEmail.trim())
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        toast({
          title: 'Erro',
          description: 'Já existe um convite pendente para este email.',
          variant: 'destructive',
        });
        return;
      }

      // Verificar se usuário já é membro
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', addMemberEmail.trim())
        .single();

      if (profileData) {
        const { data: existingMember } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', profileData.user_id)
          .single();

        if (existingMember) {
          toast({
            title: 'Erro',
            description: 'Este usuário já é membro do grupo.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Criar convite
      const { error: insertError } = await supabase
        .from('group_invitations')
        .insert({
          group_id: group.id,
          invited_email: addMemberEmail.trim(),
          invited_by: user?.id
        });

      if (insertError) throw insertError;

      toast({
        title: 'Sucesso',
        description: 'Convite enviado com sucesso!',
      });

      setAddMemberEmail('');
      setIsAddMemberOpen(false);
      loadInvitations();
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o convite.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const loadInvitations = async () => {
    if (!group) return;

    try {
      const { data: invitationsData, error } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvitations(invitationsData || []);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Convite cancelado com sucesso!',
      });

      loadInvitations();
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar o convite.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Membro removido com sucesso!',
      });

      loadGroupData();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o membro.',
        variant: 'destructive',
      });
    }
  };

  const copyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      toast({
        title: 'Sucesso',
        description: 'Código de convite copiado!',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Você precisa criar um grupo primeiro para gerenciar membros.
            </p>
            <Button asChild>
              <a href="/create-group">Criar Grupo</a>
            </Button>
          </div>
          </CardContent>
        </Card>
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
            <h1 className="text-2xl md:text-3xl font-bold">Membros do Grupo</h1>
            <p className="text-muted-foreground">{group.name}</p>
          </div>
        </div>
        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Adicionar Membro</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Convite</DialogTitle>
              <DialogDescription>
                Digite o email do usuário que deseja convidar para o grupo. Um convite será enviado e o usuário precisará aceitar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="email@exemplo.com"
                value={addMemberEmail}
                onChange={(e) => setAddMemberEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSendInvitation} 
                disabled={submitting || !addMemberEmail.trim()}
              >
                {submitting ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Código de Convite</CardTitle>
          <CardDescription>
            Compartilhe este código para que outros usuários possam se juntar ao grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Input 
              value={group.invite_code || ''} 
              readOnly 
              className="font-mono flex-1"
            />
            <Button variant="outline" onClick={copyInviteCode} className="w-full sm:w-auto">
              <Copy className="h-4 w-4 mr-2 sm:mr-0" />
              <span className="sm:hidden">Copiar Código</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {invitations.filter(inv => inv.status === 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Convites Pendentes ({invitations.filter(inv => inv.status === 'pending').length})</CardTitle>
            <CardDescription>
              Convites enviados aguardando resposta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations
                .filter(invitation => invitation.status === 'pending')
                .map((invitation) => (
                  <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                      <Mail className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{invitation.invited_email}</p>
                        <p className="text-sm text-muted-foreground">
                          Enviado em {new Date(invitation.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">Pendente</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <p className="text-sm text-muted-foreground">
                        Expira em {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <X className="h-4 w-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">Cancelar</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar convite</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja cancelar este convite?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Cancelar Convite
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Membros ({members.length})</CardTitle>
          <CardDescription>
            Gerencie os membros do seu grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{member.profiles.display_name || 'Sem nome'}</p>
                    <p className="text-sm text-muted-foreground truncate">{member.profiles.email}</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {member.user_id === group.admin_id && (
                      <Badge variant="default">
                        <Crown className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                    {member.permission_level === 'member' && member.user_id !== group.admin_id && (
                      <Badge variant="secondary">Membro</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <p className="text-sm text-muted-foreground">
                    Entrou em {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                  </p>
                  {member.user_id !== group.admin_id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Trash2 className="h-4 w-4 sm:mr-0 mr-2" />
                          <span className="sm:hidden">Remover</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover membro</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover este membro do grupo?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveMember(member.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum membro no grupo ainda.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}