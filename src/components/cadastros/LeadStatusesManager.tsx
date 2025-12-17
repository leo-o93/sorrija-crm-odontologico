import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Plus, Pencil, Trash2, Star, GripVertical, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { useLeadStatuses, useDeleteLeadStatus, useSetDefaultStatus, useReorderLeadStatuses, useReactivateLeadStatus, LeadStatus } from "@/hooks/useLeadStatuses";
import { LeadStatusForm } from "./LeadStatusForm";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SortableStatusItemProps {
  status: LeadStatus;
  onEdit: (status: LeadStatus) => void;
  onDelete: (status: LeadStatus) => void;
  onSetDefault: (status: LeadStatus) => void;
}

function SortableStatusItem({ status, onEdit, onDelete, onSetDefault }: SortableStatusItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <button
          className="cursor-grab hover:bg-muted p-1 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className={`w-4 h-4 rounded-full ${status.color}`} />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{status.title}</span>
            {status.is_default && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Padrão
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{status.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!status.is_default && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSetDefault(status)}
            title="Definir como padrão"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(status)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(status)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function LeadStatusesManager() {
  const { data: activeStatuses, isLoading: isLoadingActive } = useLeadStatuses(false);
  const { data: allStatuses, isLoading: isLoadingAll } = useLeadStatuses(true);
  const deleteStatus = useDeleteLeadStatus();
  const setDefaultStatus = useSetDefaultStatus();
  const reorderStatuses = useReorderLeadStatuses();
  const reactivateStatus = useReactivateLeadStatus();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LeadStatus | null>(null);
  const [deletingStatus, setDeletingStatus] = useState<LeadStatus | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const inactiveStatuses = allStatuses?.filter(s => !s.active) || [];
  const isLoading = isLoadingActive || isLoadingAll;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !activeStatuses) return;

    const oldIndex = activeStatuses.findIndex((s) => s.id === active.id);
    const newIndex = activeStatuses.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(activeStatuses, oldIndex, newIndex);
      const updates = newOrder.map((status, index) => ({
        id: status.id,
        position: index,
      }));
      reorderStatuses.mutate(updates);
    }
  };

  const handleReactivate = (status: LeadStatus) => {
    reactivateStatus.mutate(status.id);
  };

  const handleDelete = async () => {
    if (deletingStatus) {
      await deleteStatus.mutateAsync(deletingStatus.id);
      setDeletingStatus(null);
    }
  };

  const handleSetDefault = (status: LeadStatus) => {
    setDefaultStatus.mutate(status.id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status de Leads (Kanban)</CardTitle>
              <CardDescription>
                Configure as colunas do Kanban no CRM. Arraste para reordenar.
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Status</DialogTitle>
                </DialogHeader>
                <LeadStatusForm
                  onSuccess={() => setIsCreateDialogOpen(false)}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeStatuses && activeStatuses.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeStatuses.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {activeStatuses.map((status) => (
                    <SortableStatusItem
                      key={status.id}
                      status={status}
                      onEdit={setEditingStatus}
                      onDelete={setDeletingStatus}
                      onSetDefault={handleSetDefault}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum status cadastrado. Clique em "Novo Status" para começar.
            </div>
          )}

          {/* Seção de Status Inativos */}
          {inactiveStatuses.length > 0 && (
            <Collapsible open={showInactive} onOpenChange={setShowInactive}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-muted-foreground">
                  <span>Status inativos ({inactiveStatuses.length})</span>
                  {showInactive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {inactiveStatuses.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between p-3 bg-muted/50 border border-dashed rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${status.color}`} />
                      <div>
                        <span className="font-medium">{status.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">({status.name})</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReactivate(status)}
                      disabled={reactivateStatus.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reativar
                    </Button>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingStatus} onOpenChange={(open) => !open && setEditingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Status</DialogTitle>
          </DialogHeader>
          {editingStatus && (
            <LeadStatusForm
              status={editingStatus}
              onSuccess={() => setEditingStatus(null)}
              onCancel={() => setEditingStatus(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deletingStatus}
        onOpenChange={(open) => !open && setDeletingStatus(null)}
        onConfirm={handleDelete}
        title="Excluir Status"
        description={`Tem certeza que deseja excluir o status "${deletingStatus?.title}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}
