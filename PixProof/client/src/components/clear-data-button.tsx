import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function ClearDataButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/clear-all-data', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear data');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dados limpos com sucesso",
        description: "Agora você pode fazer upload dos seus documentos sem histórico",
      });
      // Invalidate all queries to refresh the UI
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast({
        title: "Erro ao limpar dados",
        description: "Tente novamente",
        variant: "destructive",
      });
    },
  });

  return (
    <Button 
      onClick={() => clearDataMutation.mutate()}
      variant="destructive"
      size="sm"
      disabled={clearDataMutation.isPending}
      className="flex items-center gap-2"
    >
      <Trash2 className="h-4 w-4" />
      {clearDataMutation.isPending ? "Limpando..." : "Limpar Histórico"}
    </Button>
  );
}