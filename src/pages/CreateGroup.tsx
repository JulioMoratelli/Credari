import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';

export default function CreateGroup() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session || !formData.name.trim()) return;

    try {
      setLoading(true);

      // Debug: verificar estado da autenticação
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Estado da sessão:', { session, sessionError });
      console.log('Usuário atual:', user);
      console.log('Session user:', session?.user);

      if (!session?.user) {
        throw new Error('Usuário não está autenticado. Faça login novamente.');
      }

      // Garantir que o token está atualizado
      await supabase.auth.refreshSession();

      console.log('Tentando criar grupo para usuário:', user.id);
      console.log('Dados do grupo:', {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        admin_id: user.id
      });

      // Verificar se o usuário tem perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao verificar perfil:', profileError);
        throw new Error('Erro ao verificar perfil do usuário');
      }

      if (!profile) {
        console.log('Criando perfil para o usuário...');
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0]
          });

        if (createProfileError) {
          console.error('Erro ao criar perfil:', createProfileError);
          throw new Error('Erro ao criar perfil do usuário');
        }
      }

      // Criar o grupo
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          admin_id: user.id
        })
        .select()
        .single();

      if (groupError) {
        console.error('Erro ao criar grupo:', groupError);
        throw groupError;
      }

      console.log('Grupo criado com sucesso:', groupData);

      // Adicionar o admin como membro do grupo
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          permission_level: 'admin'
        });

      if (memberError) {
        console.error('Erro ao adicionar membro:', memberError);
        // Não falhar se não conseguir adicionar como membro, pois ele já é admin
        console.warn('Aviso: Não foi possível adicionar usuário como membro, mas o grupo foi criado');
      }

      toast({
        title: 'Sucesso!',
        description: 'Grupo criado com sucesso!',
      });

      navigate('/group-members');
    } catch (error: any) {
      console.error('Erro completo ao criar grupo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o grupo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

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
            <h1 className="text-2xl md:text-3xl font-bold">Criar Grupo</h1>
            <p className="text-muted-foreground">Configure seu novo grupo financeiro</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Novo Grupo</CardTitle>
            </div>
            <CardDescription>
              Crie um grupo para gerenciar finanças em conjunto com outras pessoas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Grupo *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Família Silva, Apartamento 101..."
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o propósito do grupo..."
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="w-full sm:w-auto"
                >
                  {loading ? 'Criando...' : 'Criar Grupo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}