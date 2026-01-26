export default function Estoque() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Estoque & Materiais</h1>
        <p className="text-muted-foreground">
          Controle de insumos, estoque mínimo e movimentos por procedimento.
        </p>
      </div>
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Este módulo suporta entradas, saídas e ajustes de materiais.
      </div>
    </div>
  );
}
