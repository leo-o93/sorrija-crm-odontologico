import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  Users,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Bell,
} from "lucide-react";
import { useSpreadsheetImport } from "@/hooks/useSpreadsheetImport";
import { useImportContext } from "@/contexts/ImportContext";
import { useOrganization } from "@/contexts/OrganizationContext";

export function SpreadsheetImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentOrganization } = useOrganization();
  const { state: importState, startImport: globalStartImport, reset: globalReset } = useImportContext();
  const {
    isProcessing: isParsing,
    progress: parseProgress,
    previewData,
    results: localResults,
    parseExcelFile,
    parsedRecords,
    reset: localReset,
  } = useSpreadsheetImport();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".xlsx", ".xls"];
    const extension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(extension)) {
      alert("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    await parseExcelFile(file);
  };

  const handleImport = async () => {
    if (!currentOrganization?.id) {
      alert("Selecione uma organização");
      return;
    }
    if (!parsedRecords || parsedRecords.length === 0) {
      alert("Nenhum registro para importar");
      return;
    }
    await globalStartImport(parsedRecords, currentOrganization.id);
  };

  const handleReset = () => {
    localReset();
    globalReset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Use global state if importing, local state otherwise
  const isProcessing = isParsing || importState.isImporting;
  const progress = importState.isImporting ? importState.progress : parseProgress;
  const results = importState.results || localResults;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Planilha de Leads/Pacientes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato esperado:</strong> A planilha deve conter as
              colunas: pk_celular, NOME, EMAIL, ORIGEM, DATA CADASTRO, CPF, DATA
              NASCIMENTO, ENDEREÇO, total_atendimentos, total_agendamentos.
              <br />
              <strong>Classificação automática:</strong> Registros com
              atendimentos ou dados completos (CPF + data nascimento + endereço)
              serão criados como Pacientes.
            </AlertDescription>
          </Alert>

          {!previewData && !results && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 gap-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Selecione o arquivo Excel para importar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="spreadsheet-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Arquivo
                  </>
                )}
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <div className="text-sm text-muted-foreground text-center space-y-1">
                <p>
                  {importState.isImporting 
                    ? `Importando... ${progress}%` 
                    : `Processando... ${progress}%`
                  }
                </p>
                {importState.isImporting && (
                  <>
                    <p className="text-xs">
                      Batch {importState.currentBatch}/{importState.totalBatches}
                    </p>
                    <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                      <Bell className="h-3 w-3" />
                      Você pode sair desta página. A importação continuará em background.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {previewData && !results && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {previewData.totalRecords}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total de registros
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {previewData.leadsCount}
                        </p>
                        <p className="text-sm text-muted-foreground">Leads</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {previewData.patientsCount}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pacientes
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-medium mb-2">Amostra dos dados:</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.sampleRecords.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">
                            {record.phone}
                          </TableCell>
                          <TableCell>{record.name || "-"}</TableCell>
                          <TableCell>{record.source_name || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.total_atendimentos > 0 ||
                                (record.cpf &&
                                  record.birth_date &&
                                  record.address)
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {record.total_atendimentos > 0 ||
                              (record.cpf &&
                                record.birth_date &&
                                record.address)
                                ? "Paciente"
                                : "Lead"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
                <Button onClick={handleImport} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Confirmar Importação
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <Alert
                variant={results.errors.length > 0 ? "destructive" : "default"}
              >
                {results.errors.length > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  Importação concluída
                  {results.errors.length > 0 && " com alguns erros"}!
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {results.leads_created}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Leads criados
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {results.leads_updated}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Leads atualizados
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {results.patients_created}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pacientes criados
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-cyan-600">
                        {results.patients_updated}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pacientes atualizados
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {results.sources_created}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Fontes criadas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    Erros ({results.errors.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-muted/50">
                    {results.errors.slice(0, 20).map((error, index) => (
                      <p key={index} className="text-sm text-destructive">
                        {error}
                      </p>
                    ))}
                    {results.errors.length > 20 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        ... e mais {results.errors.length - 20} erros
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleReset}>Nova Importação</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
