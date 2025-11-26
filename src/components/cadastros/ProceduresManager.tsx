import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useProcedures, useDeleteProcedure, Procedure } from "@/hooks/useProcedures";
import { ProcedureForm } from "./ProcedureForm";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Badge } from "@/components/ui/badge";

export function ProceduresManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);

  const { data: procedures, isLoading } = useProcedures(true);
  const deleteProcedure = useDeleteProcedure();

  const handleDelete = () => {
    if (procedureToDelete) {
      deleteProcedure.mutate(procedureToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setProcedureToDelete(null);
        },
      });
    }
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingProcedure(null);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Procedimentos</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Procedimento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {procedures?.map((procedure) => (
          <Card key={procedure.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{procedure.name}</h3>
                  <p className="text-sm text-muted-foreground">{procedure.category}</p>
                  {procedure.default_price && (
                    <p className="text-sm font-medium mt-1">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(procedure.default_price)}
                    </p>
                  )}
                </div>
                <Badge variant={procedure.active ? "default" : "secondary"}>
                  {procedure.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              {procedure.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {procedure.description}
                </p>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditingProcedure(procedure)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setProcedureToDelete(procedure);
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Procedimento</DialogTitle>
          </DialogHeader>
          <ProcedureForm onSuccess={handleCloseDialog} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProcedure} onOpenChange={() => setEditingProcedure(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Procedimento</DialogTitle>
          </DialogHeader>
          {editingProcedure && (
            <ProcedureForm 
              procedure={editingProcedure} 
              onSuccess={handleCloseDialog} 
              onCancel={handleCloseDialog} 
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={procedureToDelete?.name}
        title="Excluir Procedimento"
      />
    </div>
  );
}