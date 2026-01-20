import { useImportContext } from "@/contexts/ImportContext";
import { Progress } from "@/components/ui/progress";
import { FileSpreadsheet, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ImportProgressIndicator() {
  const { state } = useImportContext();
  const navigate = useNavigate();

  if (!state.isImporting && !state.results) return null;

  const handleClick = () => {
    navigate("/cadastros");
  };

  if (state.results) {
    // Show success indicator briefly
    return (
      <div
        onClick={handleClick}
        className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer hover:bg-green-700 transition-colors flex items-center gap-3 animate-in slide-in-from-bottom-4"
      >
        <CheckCircle className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">Importação concluída!</p>
          <p className="text-xs opacity-90">
            {state.results.patients_created + state.results.patients_updated} pacientes •{" "}
            {state.results.leads_created + state.results.leads_updated} leads
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg cursor-pointer hover:opacity-90 transition-opacity min-w-[240px] animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <div className="flex-1">
          <p className="text-sm font-medium">Importando planilha...</p>
          <p className="text-xs opacity-90">
            Batch {state.currentBatch}/{state.totalBatches}
          </p>
        </div>
        <span className="text-lg font-bold">{state.progress}%</span>
      </div>
      <Progress value={state.progress} className="h-2 bg-primary-foreground/20" />
      <p className="text-xs opacity-75 mt-2 text-center">
        ✓ Você pode navegar. A importação continua em background.
      </p>
    </div>
  );
}
