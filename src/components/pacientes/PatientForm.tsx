import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Patient, useCreatePatient, useUpdatePatient } from "@/hooks/usePatients";
import { Loader2 } from "lucide-react";

const isValidCpf = (value: string) => {
  const cpf = value.replace(/[^\d]+/g, '');
  if (!cpf || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  rev = rev >= 10 ? 0 : rev;
  if (rev !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }
  rev = 11 - (sum % 11);
  rev = rev >= 10 ? 0 : rev;
  return rev === Number(cpf[10]);
};

const patientFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "Telefone é obrigatório"),
  birth_date: z.string().optional().refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "Data inválida",
  }),
  cpf: z
    .string()
    .optional()
    .refine((value) => !value || isValidCpf(value), { message: "CPF inválido" }),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z
    .string()
    .optional()
    .refine((value) => !value || /^\d{5}-?\d{3}$/.test(value), { message: "CEP inválido" }),
  patient_origin: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
  patient?: Patient;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PatientForm({ patient, onSuccess, onCancel }: PatientFormProps) {
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const lastZipCodeRef = useRef<string | null>(null);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: patient?.name || "",
      email: patient?.email || "",
      phone: patient?.phone || "",
      birth_date: patient?.birth_date || "",
      cpf: patient?.cpf || "",
      address: patient?.address || "",
      city: patient?.city || "",
      state: patient?.state || "",
      zip_code: patient?.zip_code || "",
      patient_origin: patient?.patient_origin || "",
      notes: patient?.notes || "",
    },
  });

  const zipCodeValue = form.watch("zip_code");

  useEffect(() => {
    const cleanedZip = zipCodeValue?.replace(/\D/g, "") || "";
    if (cleanedZip.length !== 8 || cleanedZip === lastZipCodeRef.current) {
      return;
    }

    let isActive = true;
    lastZipCodeRef.current = cleanedZip;
    setIsFetchingAddress(true);

    fetch(`https://viacep.com.br/ws/${cleanedZip}/json/`)
      .then((response) => response.json())
      .then((data) => {
        if (!isActive || data?.erro) return;
        const addressParts = [data.logradouro, data.bairro].filter(Boolean);
        if (addressParts.length > 0) {
          form.setValue("address", addressParts.join(" - "));
        }
        if (data.localidade) {
          form.setValue("city", data.localidade);
        }
        if (data.uf) {
          form.setValue("state", data.uf);
        }
      })
      .catch(() => null)
      .finally(() => {
        if (isActive) {
          setIsFetchingAddress(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [zipCodeValue, form]);

  const onSubmit = async (data: PatientFormValues) => {
    try {
      // Ensure required fields are present
      const patientData = {
        ...data,
        name: data.name || "",
        phone: data.phone || "",
      };

      if (patient) {
        await updatePatient.mutateAsync({ id: patient.id, ...patientData });
      } else {
        await createPatient.mutateAsync(patientData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving patient:", error);
    }
  };

  const isLoading = createPatient.isPending || updatePatient.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birth_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zip_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                {isFetchingAddress && (
                  <p className="text-xs text-muted-foreground">Buscando endereço...</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="patient_origin"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Origem do Paciente</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex.: Indicação, Anúncios, Veio da Rua" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {patient ? "Salvar Alterações" : "Criar Paciente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
