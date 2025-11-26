import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useSources, useDeleteSource, Source } from "@/hooks/useSources";
import { SourceForm } from "./SourceForm";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Badge } from "@/components/ui/badge";

export function SourcesManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);

  const { data: sources, isLoading } = useSources(true);
  const deleteSource = useDeleteSource();

  const handleDelete = () => {
    if (sourceToDelete) {
      deleteSource.mutate(sourceToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSourceToDelete(null);
        },
      });
    }
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingSource(null);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fontes de Leads</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Fonte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sources?.map((source) => (
          <Card key={source.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{source.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{source.channel}</p>
                </div>
                <Badge variant={source.active ? "default" : "secondary"}>
                  {source.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditingSource(source)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSourceToDelete(source);
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
            <DialogTitle>Nova Fonte</DialogTitle>
          </DialogHeader>
          <SourceForm onSuccess={handleCloseDialog} onCancel={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSource} onOpenChange={() => setEditingSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Fonte</DialogTitle>
          </DialogHeader>
          {editingSource && (
            <SourceForm source={editingSource} onSuccess={handleCloseDialog} onCancel={handleCloseDialog} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={sourceToDelete?.name}
        title="Excluir Fonte"
      />
    </div>
  );
}