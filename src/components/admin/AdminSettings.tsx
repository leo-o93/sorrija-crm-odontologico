import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { toast } from 'sonner';

export function AdminSettings() {
  const { settings, upsertSettings, isLoading } = useAdminSettings();
  const [supportEmail, setSupportEmail] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [allowNewOrganizations, setAllowNewOrganizations] = useState(true);

  useEffect(() => {
    if (settings) {
      setSupportEmail(settings.support_email || '');
      setTimezone(settings.default_timezone || 'America/Sao_Paulo');
      setAllowNewOrganizations(settings.allow_new_organizations ?? true);
    }
  }, [settings]);

  const handleSave = async () => {
    await upsertSettings.mutateAsync({
      support_email: supportEmail,
      default_timezone: timezone,
      allow_new_organizations: allowNewOrganizations,
    });
    toast.success('Configurações atualizadas');
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <Label>Email de suporte</Label>
        <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} disabled={isLoading} />
      </div>
      <div className="space-y-2">
        <Label>Fuso horário padrão</Label>
        <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} disabled={isLoading} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>Permitir novas organizações</Label>
          <p className="text-xs text-muted-foreground">Controla a criação de novas instâncias.</p>
        </div>
        <Switch checked={allowNewOrganizations} onCheckedChange={setAllowNewOrganizations} />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsertSettings.isPending}>
          Salvar
        </Button>
      </div>
    </Card>
  );
}
