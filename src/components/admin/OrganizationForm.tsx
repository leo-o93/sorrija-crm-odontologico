import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';

const organizationSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  evolution_instance: z.string().optional(),
  settings: z.string().optional(),
  active: z.boolean().default(true),
  // Campos para criar admin
  createAdmin: z.boolean().default(true),
  adminFullName: z.string().optional(),
  adminEmail: z.string().optional(),
  adminPassword: z.string().optional(),
}).refine((data) => {
  if (data.createAdmin) {
    if (!data.adminFullName || data.adminFullName.length < 2) return false;
    if (!data.adminEmail || !data.adminEmail.includes('@')) return false;
    if (!data.adminPassword || data.adminPassword.length < 8) return false;
  }
  return true;
}, {
  message: 'Preencha todos os campos do administrador corretamente',
  path: ['createAdmin'],
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  initialValues?: Partial<OrganizationFormValues>;
  onSubmit: (values: OrganizationFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function OrganizationForm({ initialValues, onSubmit, onCancel, isSubmitting = false }: OrganizationFormProps) {
  const isEditing = !!initialValues?.name;

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      evolution_instance: '',
      settings: '{}',
      active: true,
      createAdmin: !isEditing,
      adminFullName: '',
      adminEmail: '',
      adminPassword: '',
      ...initialValues,
    },
  });

  const createAdmin = form.watch('createAdmin');

  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name || '',
        evolution_instance: initialValues.evolution_instance || '',
        settings: initialValues.settings || '{}',
        active: initialValues.active ?? true,
        createAdmin: false,
        adminFullName: '',
        adminEmail: '',
        adminPassword: '',
      });
    }
  }, [form, initialValues]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Organização</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Clínica Sorrija" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="evolution_instance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instância Evolution</FormLabel>
              <FormControl>
                <Input placeholder="Ex: sorrija_leads" {...field} />
              </FormControl>
              <FormDescription>
                Identificador único para integração com WhatsApp
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="settings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Configurações (JSON)</FormLabel>
              <FormControl>
                <Input placeholder="{}" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <div>
                <FormLabel>Status</FormLabel>
                <FormDescription>Ativar organização</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Seção de criação de admin - apenas ao criar nova organização */}
        {!isEditing && (
          <>
            <Separator className="my-4" />
            <h3 className="text-sm font-semibold text-foreground">Administrador da Organização</h3>
            
            <FormField
              control={form.control}
              name="createAdmin"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel>Criar usuário admin</FormLabel>
                    <FormDescription>
                      Criar um usuário administrador para esta organização
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createAdmin && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                <FormField
                  control={form.control}
                  name="adminFullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo do admin</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do admin</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Ex: joao@clinica.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha inicial (mín. 8 caracteres)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormDescription>
                        O administrador poderá alterar a senha após o primeiro login
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar organização'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
