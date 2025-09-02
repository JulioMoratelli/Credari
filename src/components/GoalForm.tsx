import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Target, Tag, DollarSign } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';



interface GoalFormProps {
  editingGoal?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GoalForm({
  editingGoal,
  onSuccess,
  onCancel,
}: GoalFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: editingGoal?.title || "",
    description: editingGoal?.description || "",
    target_amount: editingGoal?.target_amount || "",
    current_amount: editingGoal?.current_amount || "",
    deadline: editingGoal?.deadline || new Date().toISOString().split("T")[0],
    status: editingGoal?.status || "in_progress",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pega usuário logado
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      // Cria meta com user_id
      const { error } = await supabase.from("goals").insert({
        ...formData,
        user_id: user.id, // obrigatório na tabela
      });

      if (error) throw error;

      onSuccess();
    } catch (err) {
      console.error("Erro ao salvar meta:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    // Lógica para atualizar a meta
    const { error } = await supabase.from("goals").update(formData).eq("id", editingGoal.id);

    if (error) {
      console.error("Erro ao atualizar meta:", error);
    } else {
      onSuccess();
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-elegant">
      <CardHeader className="gradient-bg text-white">
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>{editingGoal ? "Editar Meta" : "Nova Meta"}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={editingGoal ? handleUpdate : handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <span>Título</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ex: Comprar Carro"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Detalhes sobre a meta..."
              rows={3}
            />
          </div>

          {/* Valores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="target_amount"
                className="flex items-center space-x-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Valor Alvo</span>
              </Label>
              <Input
                id="target_amount"
                type="number"
                step="0.01"
                value={formData.target_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_amount: e.target.value,
                  }))
                }
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="current_amount"
                className="flex items-center space-x-2"
              >
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Valor Atual</span>
              </Label>
              <Input
                id="current_amount"
                type="number"
                step="0.01"
                value={formData.current_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    current_amount: e.target.value,
                  }))
                }
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Prazo */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Prazo</span>
            </Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deadline: e.target.value }))
              }
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">🚀 Em Andamento</SelectItem>
                <SelectItem value="completed">✅ Concluída</SelectItem>
                <SelectItem value="canceled">❌ Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gradient-bg hover:opacity-90"
            >
              {loading
                ? "Salvando..."
                : editingGoal
                  ? "Atualizar Meta"
                  : "Criar Meta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
