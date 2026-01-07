import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, MessageSquare, Info } from "lucide-react";
import { useMessageTemplates, useDeleteMessageTemplate, MessageTemplate, TEMPLATE_CATEGORIES, TEMPLATE_VARIABLES, TemplateCategory } from "@/hooks/useMessageTemplates";
import { MessageTemplateForm } from "./MessageTemplateForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function TemplateCard({ 
  template, 
  onEdit, 
  onDelete 
}: { 
  template: MessageTemplate; 
  onEdit: (t: MessageTemplate) => void; 
  onDelete: (t: MessageTemplate) => void;
}) {
  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-medium">{template.name}</span>
            {template.attempt_number && (
              <Badge variant="outline" className="text-xs">
                {template.attempt_number}ª tentativa
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {template.content}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(template)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(template)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MessageTemplatesManager() {
  const { data: templates, isLoading } = useMessageTemplates(undefined, true);
  const deleteTemplate = useDeleteMessageTemplate();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<MessageTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('welcome');

  const activeTemplates = templates?.filter(t => t.active) || [];

  const getTemplatesByCategory = (category: TemplateCategory) => {
    return activeTemplates.filter(t => t.category === category);
  };

  const handleDelete = async () => {
    if (deletingTemplate) {
      await deleteTemplate.mutateAsync(deletingTemplate.id);
      setDeletingTemplate(null);
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
            <Skeleton key={i} className="h-20 w-full" />
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
                <MessageSquare className="h-5 w-5 text-primary" />
                Templates de Mensagem
              </CardTitle>
              <CardDescription>
                Configure mensagens pré-definidas para automação e uso rápido.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="font-medium mb-2">Variáveis disponíveis:</p>
                    <ul className="text-xs space-y-1">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <li key={v.variable}>
                          <code className="bg-muted px-1 rounded">{v.variable}</code> - {v.description}
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Novo Template de Mensagem</DialogTitle>
                  </DialogHeader>
                  <MessageTemplateForm
                    onSuccess={() => setIsCreateDialogOpen(false)}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TemplateCategory)}>
            <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value} className="flex-1 min-w-[100px]">
                  {cat.label}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getTemplatesByCategory(cat.value).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {TEMPLATE_CATEGORIES.map((cat) => (
              <TabsContent key={cat.value} value={cat.value} className="space-y-3 mt-4">
                {getTemplatesByCategory(cat.value).length > 0 ? (
                  getTemplatesByCategory(cat.value).map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={setEditingTemplate}
                      onDelete={setDeletingTemplate}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum template de {cat.label.toLowerCase()} cadastrado.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <MessageTemplateForm
              template={editingTemplate}
              onSuccess={() => setEditingTemplate(null)}
              onCancel={() => setEditingTemplate(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => !open && setDeletingTemplate(null)}
        onConfirm={handleDelete}
        title="Excluir Template"
        description={`Tem certeza que deseja excluir o template "${deletingTemplate?.name}"?`}
      />
    </>
  );
}
