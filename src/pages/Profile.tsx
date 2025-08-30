import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Trash2,
  Edit,
  Phone,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    phones: [] as { id?: string; number: string }[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // busca perfil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, email, created_at")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      // busca telefones
      const { data: phonesData, error: phonesError } = await supabase
        .from("phones")
        .select("id, number")
        .eq("user_id", user.id);

      if (phonesError) throw phonesError;

      setProfile(profileData);
      setFormData({
        display_name: profileData.display_name || "Usuário",
        email: profileData.email || user.email,
        phones: phonesData || [],
      });
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // atualiza perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: formData.display_name,
          email: formData.email,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // salva telefones (update se tem id, insert se é novo)
      for (const phone of formData.phones) {
        if (phone.id) {
          const { error: phoneError } = await supabase
            .from("phones")
            .update({ number: phone.number })
            .eq("id", phone.id);

          if (phoneError) throw phoneError;
        } else {
          const { error: phoneError } = await supabase
            .from("phones")
            .insert({ number: phone.number, user_id: user.id });

          if (phoneError) throw phoneError;
        }
      }

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
      setIsDialogOpen(false);
      loadProfile();
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso.",
      });
      navigate("/");
    } catch (err) {
      console.error("Erro ao excluir conta:", err);
      toast({
        title: "Erro",
        description: "Não foi possível excluir sua conta.",
        variant: "destructive",
      });
    }
  };

  const addPhoneField = () => {
    setFormData({
      ...formData,
      phones: [...formData.phones, { number: "" }],
    });
  };

  const handleDeletePhone = async (index: number) => {
  const phoneToDelete = formData.phones[index];

  try {
    if (phoneToDelete.id) {
      const { error } = await supabase
        .from("phones")
        .delete()
        .eq("id", phoneToDelete.id)
        .eq("user_id", user.id); // garante que só pode deletar o próprio telefone

      if (error) throw error;
    }

    // Remove do estado local
    setFormData({
      ...formData,
      phones: formData.phones.filter((_, i) => i !== index),
    });

    toast({
      title: "Telefone removido",
      description: "O telefone foi excluído com sucesso.",
    });
  } catch (err) {
    console.error("Erro ao excluir telefone:", err);
    toast({
      title: "Erro",
      description: "Não foi possível excluir o telefone.",
      variant: "destructive",
    });
  }
};

  if (loading) {
    return <p>Carregando perfil...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Meu Perfil</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">
              {profile?.display_name || "Sem nome"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span>{profile?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span>
              Conta criada em{" "}
              {new Date(profile?.created_at).toLocaleDateString("pt-BR")}
            </span>
          </div>
          <div className="space-y-2">
            {formData.phones?.map((phone) => (
              <div
                key={phone.id || Math.random()}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <Phone className="h-5 w-5" />
                <span>{phone.number}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-bg">
                  <Edit className="mr-2 h-4 w-4" /> Editar Perfil
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={formData.display_name}
                      onChange={(e) =>
                        setFormData({ ...formData, display_name: e.target.value })
                      }
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefones</label>
                    {formData.phones.map((phone, index) => (
                      <div key={phone.id || index} className="flex items-center gap-2">
                        <Input
                          value={phone.number}
                          onChange={(e) => {
                            const updatedPhones = [...formData.phones];
                            updatedPhones[index].number = e.target.value;
                            setFormData({ ...formData, phones: updatedPhones });
                          }}
                          placeholder="Digite o número"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePhone(index)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remover
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPhoneField}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Adicionar Telefone
                    </Button>
                  </div>
                  <Button type="submit" disabled={saving} className="w-full">
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              {/* <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir Conta
                </Button>
              </AlertDialogTrigger> */}
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Essa ação não pode ser desfeita. Todos os seus dados serão
                    apagados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
