import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ExportButtonProps {
  data: any[];
  filename: string;
  sheetName?: string;
}

export function ExportButton({ data, filename, sheetName = 'Relatório' }: ExportButtonProps) {
  const handleExport = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
      XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
      console.error('Export error:', error);
    }
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Exportar Excel
    </Button>
  );
}
