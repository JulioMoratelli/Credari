import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Trash2, ArrowLeft, Edit, Target } from "lucide-react";
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
import GoalForm from "@/components/GoalForm";
import { Progress } from "@/components/ui/progress";



interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  status: string;
}

export default function Goals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const loadData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error loading goals:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as metas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleDelete = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalId)
        .eq("user_id", user?.id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Meta excluída com sucesso!" });
      loadData();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a meta.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Metas</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="gradient-bg hover:opacity-90"
              onClick={() => {
                setEditingGoal(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <GoalForm
              editingGoal={editingGoal}
              onSuccess={() => {
                setIsDialogOpen(false);
                setEditingGoal(null);
                loadData();
              }}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingGoal(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhuma meta encontrada</h3>
            <p className="text-muted-foreground">
              Comece criando sua primeira meta financeira.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <Card
              key={goal.id}
              className="shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl border border-muted/30"
            >
              <CardHeader className="pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
                  <Badge
                    variant={
                      goal.status === "completed"
                        ? "default"
                        : goal.status === "canceled"
                          ? "destructive"
                          : "secondary"
                    }
                    className="uppercase px-2 py-1 text-xs font-medium"
                  >
                    {goal.status === "completed"
                      ? "✅ Concluída"
                      : goal.status === "in_progress"
                        ? "🚀 Em Progresso"
                        : "❌ Cancelada"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                {/* Lado esquerdo - informações principais */}
                <div className="space-y-3 flex-1">
                  <p className="text-sm text-muted-foreground">{goal.description}</p>

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatCurrency(goal.current_amount)}{" "}
                      <span className="text-muted-foreground">/</span>{" "}
                      {formatCurrency(goal.target_amount)}
                    </p>
                    <Progress
                      value={(goal.current_amount / goal.target_amount) * 100}
                      className="h-2 mt-1 rounded-full"
                    />
                  </div>

                  {goal.deadline && (
                    <p className="flex items-center text-xs text-muted-foreground mt-2">
                      <Calendar className="mr-1.5 h-4 w-4 text-muted-foreground" />
                      Prazo:{" "}
                      <span className="ml-1 font-medium text-foreground">
                        {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                      </span>
                    </p>
                  )}
                </div>

                {/* Lado direito - status e ações */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setEditingGoal(goal)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir meta</AlertDialogTitle>
                        <AlertDialogDescription>
                          Você tem certeza de que deseja excluir esta meta? Esta ação não pode
                          ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(goal.id)}
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
          ))}
        </div>
      )}
    </div>
  );
}
