export default function Prontuario() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Prontuário Clínico</h1>
        <p className="text-muted-foreground">
          Anamnese, evolução clínica, diagnóstico, odontograma e anexos do paciente.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Este módulo está pronto para integração com as tabelas clínicas recém-criadas.
      </div>
    </div>
  );
}
