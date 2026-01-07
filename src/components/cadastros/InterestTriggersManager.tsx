import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Plus, Pencil, Trash2, GripVertical, Zap, TestTube2, ChevronDown, ChevronUp } from "lucide-react";
import { useInterestTriggers, useDeleteInterestTrigger, useReorderInterestTriggers, InterestTrigger, testTriggerCondition } from "@/hooks/useInterestTriggers";
import { useProcedures } from "@/hooks/useProcedures";
import { useSources } from "@/hooks/useSources";
import { InterestTriggerForm } from "./InterestTriggerForm";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

interface SortableTriggerItemProps {
  trigger: InterestTrigger;
  procedureName?: string;
  sourceName?: string;
  onEdit: (trigger: InterestTrigger) => void;
  onDelete: (trigger: InterestTrigger) => void;
  onTest: (trigger: InterestTrigger) => void;
}

function SortableTriggerItem({ trigger, procedureName, sourceName, onEdit, onDelete, onTest }: SortableTriggerItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: trigger.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getOperatorLabel = (op: string) => {
    const labels: Record<string, string> = {
      contains: 'contém',
      not_contains: 'não contém',
      equals: '=',
      not_equals: '≠',
      starts_with: 'começa com',
      ends_with: 'termina com',
      regex: 'regex',
      is_empty: 'vazio',
      is_not_empty: 'não vazio',
    };
    return labels[op] || op;
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      first_message: '1ª mensagem',
      any_message: 'mensagem',
      push_name: 'nome',
      source_name: 'fonte',
    };
    return labels[field] || field;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          className="cursor-grab hover:bg-muted p-1 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <Zap className="h-4 w-4 text-yellow-500" />
        
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{trigger.name}</span>
            <Badge variant="outline" className="text-xs">
              {getFieldLabel(trigger.condition_field)} {getOperatorLabel(trigger.condition_operator)} "{trigger.condition_value}"
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {procedureName && (
              <Badge variant="secondary" className="text-xs">
                Interesse: {procedureName}
              </Badge>
            )}
            {sourceName && (
              <Badge variant="secondary" className="text-xs">
                Fonte: {sourceName}
              </Badge>
            )}
            {trigger.action_set_temperature && (
              <Badge variant="secondary" className="text-xs">
                Temp: {trigger.action_set_temperature}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTest(trigger)}
          title="Testar gatilho"
        >
          <TestTube2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(trigger)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(trigger)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function InterestTriggersManager() {
  const { data: triggers, isLoading } = useInterestTriggers(true);
  const { data: procedures } = useProcedures();
  const { data: sources } = useSources();
  const deleteTrigger = useDeleteInterestTrigger();
  const reorderTriggers = useReorderInterestTriggers();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<InterestTrigger | null>(null);
  const [deletingTrigger, setDeletingTrigger] = useState<InterestTrigger | null>(null);
  const [testingTrigger, setTestingTrigger] = useState<InterestTrigger | null>(null);
  const [testValue, setTestValue] = useState("");
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const activeTriggers = triggers?.filter(t => t.active) || [];
  const inactiveTriggers = triggers?.filter(t => !t.active) || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const getProcedureName = (id: string | null) => {
    if (!id) return undefined;
    return procedures?.find(p => p.id === id)?.name;
  };

  const getSourceName = (id: string | null) => {
    if (!id) return undefined;
    return sources?.find(s => s.id === id)?.name;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !activeTriggers) return;

    const oldIndex = activeTriggers.findIndex((t) => t.id === active.id);
    const newIndex = activeTriggers.findIndex((t) => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(activeTriggers, oldIndex, newIndex);
      const updates = newOrder.map((trigger, index) => ({
        id: trigger.id,
        priority: index,
      }));
      reorderTriggers.mutate(updates);
    }
  };

  const handleDelete = async () => {
    if (deletingTrigger) {
      await deleteTrigger.mutateAsync(deletingTrigger.id);
      setDeletingTrigger(null);
    }
  };

  const handleTest = () => {
    if (testingTrigger && testValue) {
      const result = testTriggerCondition(testingTrigger, testValue);
      setTestResult(result);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
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
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Gatilhos de Interesse
              </CardTitle>
              <CardDescription>
                Configure regras para detectar automaticamente o interesse do lead com base nas mensagens.
                Arraste para definir a prioridade (primeiro gatilho que corresponder será aplicado).
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Gatilho
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Gatilho de Interesse</DialogTitle>
                </DialogHeader>
                <InterestTriggerForm
                  onSuccess={() => setIsCreateDialogOpen(false)}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTriggers.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeTriggers.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {activeTriggers.map((trigger) => (
                    <SortableTriggerItem
                      key={trigger.id}
                      trigger={trigger}
                      procedureName={getProcedureName(trigger.action_set_interest_id)}
                      sourceName={getSourceName(trigger.action_set_source_id)}
                      onEdit={setEditingTrigger}
                      onDelete={setDeletingTrigger}
                      onTest={setTestingTrigger}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum gatilho cadastrado. Clique em "Novo Gatilho" para começar.
            </div>
          )}

          {inactiveTriggers.length > 0 && (
            <Collapsible open={showInactive} onOpenChange={setShowInactive}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-muted-foreground">
                  <span>Gatilhos inativos ({inactiveTriggers.length})</span>
                  {showInactive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {inactiveTriggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="flex items-center justify-between p-3 bg-muted/50 border border-dashed rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{trigger.name}</span>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTrigger} onOpenChange={(open) => !open && setEditingTrigger(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Gatilho</DialogTitle>
          </DialogHeader>
          {editingTrigger && (
            <InterestTriggerForm
              trigger={editingTrigger}
              onSuccess={() => setEditingTrigger(null)}
              onCancel={() => setEditingTrigger(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={!!testingTrigger} onOpenChange={(open) => {
        if (!open) {
          setTestingTrigger(null);
          setTestValue("");
          setTestResult(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testar Gatilho: {testingTrigger?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mensagem de teste</label>
              <Input
                placeholder="Digite uma mensagem para testar..."
                value={testValue}
                onChange={(e) => {
                  setTestValue(e.target.value);
                  setTestResult(null);
                }}
              />
            </div>
            
            <Button onClick={handleTest} className="w-full">
              <TestTube2 className="h-4 w-4 mr-2" />
              Testar
            </Button>

            {testResult !== null && (
              <div className={`p-4 rounded-lg ${testResult ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                {testResult ? (
                  <span>✅ Gatilho ATIVARIA para esta mensagem!</span>
                ) : (
                  <span>❌ Gatilho NÃO ativaria para esta mensagem.</span>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deletingTrigger}
        onOpenChange={(open) => !open && setDeletingTrigger(null)}
        onConfirm={handleDelete}
        title="Excluir Gatilho"
        description={`Tem certeza que deseja excluir o gatilho "${deletingTrigger?.name}"?`}
      />
    </>
  );
}
