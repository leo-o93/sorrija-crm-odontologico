import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const organizationSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  evolution_instance: z.string().optional(),
  settings: z.string().optional(),
  active: z.boolean().default(true),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  initialValues?: OrganizationFormValues;
  onSubmit: (values: OrganizationFormValues) => void;
  onCancel: () => void;
}

export function OrganizationForm({ initialValues, onSubmit, onCancel }: OrganizationFormProps) {
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: initialValues || {
      name: '',
      evolution_instance: '',
      settings: '{}',
      active: true,
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
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
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="settings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Settings (JSON)</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <p className="text-xs text-muted-foreground">Ativar organização</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
