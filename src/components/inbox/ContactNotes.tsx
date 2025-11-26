import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUpdateLead } from '@/hooks/useLeads';
import { useUpdatePatient } from '@/hooks/usePatients';
import { Loader2, Save } from 'lucide-react';

interface ContactNotesProps {
  contactId: string;
  contactType: 'lead' | 'patient';
  initialNotes: string | null;
}

export function ContactNotes({ contactId, contactType, initialNotes }: ContactNotesProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isEditing, setIsEditing] = useState(false);

  const updateLead = useUpdateLead();
  const updatePatient = useUpdatePatient();

  const handleSave = async () => {
    if (contactType === 'lead') {
      await updateLead.mutateAsync({
        id: contactId,
        notes,
      });
    } else {
      await updatePatient.mutateAsync({
        id: contactId,
        notes,
      });
    }
    setIsEditing(false);
  };

  const isPending = updateLead.isPending || updatePatient.isPending;

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setIsEditing(true);
        }}
        placeholder="Adicione observações sobre o contato..."
        rows={4}
        className="resize-none"
      />
      {isEditing && (
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Observações
        </Button>
      )}
    </div>
  );
}
