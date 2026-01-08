import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { TemperatureRuleForm } from "./TemperatureRuleForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  useTemperatureRules,
  useCreateTemperatureRule,
  useUpdateTemperatureRule,
  useDeleteTemperatureRule,
  useReorderTemperatureRules,
  TemperatureTransitionRule,
  CreateRuleInput,
} from "@/hooks/useTemperatureRules";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  Thermometer,
  ArrowRight,
  Timer,
  MessageCircle,
  AlertCircle,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const TRIGGER_LABELS: Record<string, { label: string; icon: typeof Timer }> = {
  inactivity_timer: { label: "Inatividade", icon: Timer },
  substatus_timeout: { label: "Timeout Substatus", icon: Clock },
  no_response: { label: "Sem Resposta", icon: MessageCircle },
};

const TEMPERATURE_COLORS: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  quente: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  frio: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
};

interface SortableRuleItemProps {
  rule: TemperatureTransitionRule;
  index: number;
  onEdit: (rule: TemperatureTransitionRule) => void;
  onDelete: (rule: TemperatureTransitionRule) => void;
  onToggleActive: (rule: TemperatureTransitionRule) => void;
}

function SortableRuleItem({ rule, index, onEdit, onDelete, onToggleActive }: SortableRuleItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rule.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const TriggerIcon = TRIGGER_LABELS[rule.trigger_event]?.icon || Timer;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <button
        className="cursor-grab hover:bg-muted p-1 rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <span className="font-mono text-sm text-muted-foreground w-6">{index + 1}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{rule.name}</span>
          <div className="flex items-center gap-1.5">
            <TriggerIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {TRIGGER_LABELS[rule.trigger_event]?.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {rule.from_temperature ? (
            <Badge variant="outline" className={`text-xs ${TEMPERATURE_COLORS[rule.from_temperature]}`}>
              {rule.from_temperature.toUpperCase()}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Qualquer</Badge>
          )}
          {rule.from_substatus && (
            <Badge variant="secondary" className="text-xs">
              {rule.from_substatus === "em_conversa" ? "Em Conversa" : "Aguardando"}
            </Badge>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-mono">{formatTime(rule.timer_minutes)}</span>
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          {rule.action_set_temperature && (
            <Badge className={`text-xs ${TEMPERATURE_COLORS[rule.action_set_temperature]}`}>
              {rule.action_set_temperature.toUpperCase()}
            </Badge>
          )}
          {rule.action_clear_substatus && (
            <Badge variant="outline" className="text-xs">Limpar substatus</Badge>
          )}
        </div>
      </div>

      <Switch
        checked={rule.active}
        onCheckedChange={() => onToggleActive(rule)}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(rule)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDelete(rule)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function TemperatureRulesManager() {
  const { data: rules, isLoading } = useTemperatureRules();
  const createRule = useCreateTemperatureRule();
  const updateRule = useUpdateTemperatureRule();
  const deleteRule = useDeleteTemperatureRule();
  const reorderRules = useReorderTemperatureRules();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TemperatureTransitionRule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<TemperatureTransitionRule | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const activeRules = rules?.filter(r => r.active) || [];
  const inactiveRules = rules?.filter(r => !r.active) || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleCreate = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  const handleEdit = (rule: TemperatureTransitionRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  const handleSubmit = (data: CreateRuleInput) => {
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...data }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      createRule.mutate(data, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleToggleActive = (rule: TemperatureTransitionRule) => {
    updateRule.mutate({ id: rule.id, active: !rule.active });
  };

  const handleDelete = (rule: TemperatureTransitionRule) => {
    setRuleToDelete(rule);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteRule.mutate(ruleToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setRuleToDelete(null);
        },
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !activeRules) return;

    const oldIndex = activeRules.findIndex((r) => r.id === active.id);
    const newIndex = activeRules.findIndex((r) => r.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(activeRules, oldIndex, newIndex);
      const orderedIds = newOrder.map((rule) => rule.id);
      reorderRules.mutate(orderedIds);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-primary" />
              <CardTitle>Regras de Transição de Temperatura</CardTitle>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>
          <CardDescription>
            Configure regras condicionais para transição automática de temperatura dos leads.
            Arraste para definir a prioridade (regras são processadas em ordem).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeRules.length === 0 && inactiveRules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma regra configurada</p>
              <p className="text-sm">Crie regras para automatizar a transição de temperatura dos leads.</p>
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Regra
              </Button>
            </div>
          ) : (
            <>
              {activeRules.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={activeRules.map((r) => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {activeRules.map((rule, index) => (
                        <SortableRuleItem
                          key={rule.id}
                          rule={rule}
                          index={index}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onToggleActive={handleToggleActive}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma regra ativa. Ative uma regra existente ou crie uma nova.</p>
                </div>
              )}

              {inactiveRules.length > 0 && (
                <Collapsible open={showInactive} onOpenChange={setShowInactive}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between text-muted-foreground">
                      <span>Regras inativas ({inactiveRules.length})</span>
                      {showInactive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {inactiveRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 border border-dashed rounded-lg opacity-60"
                      >
                        <div className="w-6" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{rule.name}</span>
                          </div>
                        </div>
                        <Switch
                          checked={rule.active}
                          onCheckedChange={() => handleToggleActive(rule)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(rule)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(rule)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TemperatureRuleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editingRule={editingRule}
        isSubmitting={createRule.isPending || updateRule.isPending}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Excluir Regra"
        itemName={ruleToDelete?.name}
      />
    </>
  );
}
