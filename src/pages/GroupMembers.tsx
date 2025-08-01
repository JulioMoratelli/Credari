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
import { Users, UserPlus, Trash2, Copy, Crown } from 'lucide-react';

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

export default function GroupMembers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
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

  const handleAddMember = async () => {
    if (!addMemberEmail.trim() || !group) return;

    try {
      setSubmitting(true);

      // Buscar usuário pelo email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', addMemberEmail.trim())
        .single();

      if (profileError) {
        toast({
          title: 'Erro',
          description: 'Usuário não encontrado. Verifique se o email está correto.',
          variant: 'destructive',
        });
        return;
      }

      // Verificar se já é membro
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

      // Adicionar membro
      const { error: insertError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: profileData.user_id,
          permission_level: 'member'
        });

      if (insertError) throw insertError;

      toast({
        title: 'Sucesso',
        description: 'Membro adicionado com sucesso!',
      });

      setAddMemberEmail('');
      setIsAddMemberOpen(false);
      loadGroupData();
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o membro.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
              <p className="text-muted-foreground">
                Você precisa criar um grupo primeiro para gerenciar membros.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Membros do Grupo</h1>
          <p className="text-muted-foreground">{group.name}</p>
        </div>
        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Membro</DialogTitle>
              <DialogDescription>
                Digite o email do usuário que deseja adicionar ao grupo.
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
                onClick={handleAddMember} 
                disabled={submitting || !addMemberEmail.trim()}
              >
                {submitting ? 'Adicionando...' : 'Adicionar'}
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
          <div className="flex items-center space-x-2">
            <Input 
              value={group.invite_code || ''} 
              readOnly 
              className="font-mono"
            />
            <Button variant="outline" onClick={copyInviteCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">{member.profiles.display_name || 'Sem nome'}</p>
                    <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
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
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-muted-foreground">
                    Entrou em {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                  </p>
                  {member.user_id !== group.admin_id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
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