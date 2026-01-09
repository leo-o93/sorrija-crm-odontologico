import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const timezones = ['America/Sao_Paulo', 'America/Fortaleza', 'America/Manaus', 'America/Recife'];

export function GeneralSettings() {
  const { currentOrganization, refreshOrganization } = useOrganization();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    logo_url: '',
    trade_name: '',
    document: '',
    phone: '',
    email: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip: '',
    },
    business_hours: '{}',
    timezone: 'America/Sao_Paulo',
    welcome_message: '',
    message_signature: '',
  });

  useEffect(() => {
    if (!currentOrganization?.id) return;

    supabase
      .from('organizations')
      .select('*')
      .eq('id', currentOrganization.id)
      .single()
      .then(({ data }) => {
        if (!data) return;

        const address = (data.address as any) || {};
        const businessHours = data.business_hours ? JSON.stringify(data.business_hours, null, 2) : '{}';

        setFormState({
          logo_url: data.logo_url || '',
          trade_name: data.trade_name || '',
          document: data.document || '',
          phone: data.phone || '',
          email: data.email || '',
          address: {
            street: address.street || '',
            number: address.number || '',
            complement: address.complement || '',
            neighborhood: address.neighborhood || '',
            city: address.city || '',
            state: address.state || '',
            zip: address.zip || '',
          },
          business_hours: businessHours,
          timezone: data.timezone || 'America/Sao_Paulo',
          welcome_message: data.welcome_message || '',
          message_signature: data.message_signature || '',
        });
      });
  }, [currentOrganization?.id]);

  const handleLogoChange = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setFormState((prev) => ({ ...prev, logo_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!currentOrganization?.id) return;

    let businessHours: Record<string, any> = {};
    try {
      businessHours = JSON.parse(formState.business_hours || '{}');
    } catch (error) {
      toast.error('Horário de funcionamento inválido (JSON)');
      return;
    }

    const { error } = await supabase
      .from('organizations')
      .update({
        logo_url: formState.logo_url,
        trade_name: formState.trade_name,
        document: formState.document,
        phone: formState.phone,
        email: formState.email,
        address: formState.address,
        business_hours: businessHours,
        timezone: formState.timezone,
        welcome_message: formState.welcome_message,
        message_signature: formState.message_signature,
      })
      .eq('id', currentOrganization.id);

    if (error) {
      toast.error('Erro ao salvar configurações');
      return;
    }

    toast.success('Configurações atualizadas');
    refreshOrganization();
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Logo da organização</Label>
          <Input type="file" accept="image/*" onChange={(event) => handleLogoChange(event.target.files?.[0])} />
          {logoPreview && <img src={logoPreview} alt="Preview logo" className="h-16 object-contain" />}
        </div>
        <div className="space-y-2">
          <Label>Nome fantasia</Label>
          <Input value={formState.trade_name} onChange={(e) => setFormState({ ...formState, trade_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>CNPJ</Label>
          <Input value={formState.document} onChange={(e) => setFormState({ ...formState, document: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Telefone principal</Label>
          <Input value={formState.phone} onChange={(e) => setFormState({ ...formState, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Email institucional</Label>
          <Input value={formState.email} onChange={(e) => setFormState({ ...formState, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Fuso horário</Label>
          <Select value={formState.timezone} onValueChange={(value) => setFormState({ ...formState, timezone: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((timezone) => (
                <SelectItem key={timezone} value={timezone}>
                  {timezone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Rua</Label>
          <Input
            value={formState.address.street}
            onChange={(e) => setFormState({ ...formState, address: { ...formState.address, street: e.target.value } })}
          />
        </div>
        <div className="space-y-2">
          <Label>Número</Label>
          <Input
            value={formState.address.number}
            onChange={(e) => setFormState({ ...formState, address: { ...formState.address, number: e.target.value } })}
          />
        </div>
        <div className="space-y-2">
          <Label>Complemento</Label>
          <Input
            value={formState.address.complement}
            onChange={(e) => setFormState({ ...formState, address: { ...formState.address, complement: e.target.value } })}
          />
        </div>
        <div className="space-y-2">
          <Label>Bairro</Label>
          <Input
            value={formState.address.neighborhood}
            onChange={(e) => setFormState({ ...formState, address: { ...formState.address, neighborhood: e.target.value } })}
          />
        </div>
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input
            value={formState.address.city}
            onChange={(e) => setFormState({ ...formState, address: { ...formState.address, city: e.target.value } })}
          />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Input
            value={formState.address.state}
            onChange={(e) => setFormState({ ...formState, address: { ...formState.address, state: e.target.value } })}
          />
        </div>
        <div className="space-y-2">
          <Label>CEP</Label>
          <Input
            value={formState.address.zip}
            onChange={(e) => setFormState({ ...formState, address: { ...formState.address, zip: e.target.value } })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Horário de funcionamento (JSON)</Label>
        <Textarea
          rows={4}
          value={formState.business_hours}
          onChange={(e) => setFormState({ ...formState, business_hours: e.target.value })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Mensagem de boas-vindas</Label>
          <Textarea
            value={formState.welcome_message}
            onChange={(e) => setFormState({ ...formState, welcome_message: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Assinatura de mensagens</Label>
          <Textarea
            value={formState.message_signature}
            onChange={(e) => setFormState({ ...formState, message_signature: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Salvar configurações</Button>
      </div>
    </Card>
  );
}
