import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Quote } from "@/hooks/useQuotes";
import { toast } from "sonner";

interface OrganizationInfo {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export async function generateQuotePDF(quote: Quote, organization?: OrganizationInfo) {
  // Create printable HTML content
  const printContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Orçamento ${quote.quote_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #333;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .company-info h1 {
          font-size: 24px;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .company-info p {
          color: #666;
          font-size: 11px;
        }
        .quote-info {
          text-align: right;
        }
        .quote-info h2 {
          font-size: 18px;
          color: #333;
        }
        .quote-info p {
          color: #666;
          font-size: 11px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .status-draft { background: #e5e7eb; color: #374151; }
        .status-sent { background: #dbeafe; color: #1d4ed8; }
        .status-approved { background: #dcfce7; color: #16a34a; }
        .status-rejected { background: #fee2e2; color: #dc2626; }
        .status-expired { background: #ffedd5; color: #ea580c; }
        .status-converted { background: #f3e8ff; color: #9333ea; }
        
        .section {
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .client-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .client-field label {
          display: block;
          font-size: 10px;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .client-field p {
          font-weight: 500;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        th, td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: #f9fafb;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
        }
        td {
          font-size: 12px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .totals {
          margin-top: 16px;
          border-top: 2px solid #e5e7eb;
          padding-top: 16px;
        }
        .totals-row {
          display: flex;
          justify-content: flex-end;
          gap: 24px;
          margin-bottom: 8px;
        }
        .totals-row.final {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }
        .totals-label {
          color: #6b7280;
        }
        .discount {
          color: #16a34a;
        }
        
        .notes {
          background: #f9fafb;
          padding: 12px;
          border-radius: 4px;
          font-size: 11px;
          white-space: pre-wrap;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 10px;
        }
        
        .validity {
          background: #fef3c7;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 11px;
          color: #92400e;
          margin-top: 12px;
        }
        
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${organization?.name || "Clínica Odontológica"}</h1>
          ${organization?.phone ? `<p>📞 ${organization.phone}</p>` : ""}
          ${organization?.email ? `<p>✉️ ${organization.email}</p>` : ""}
          ${organization?.address ? `<p>📍 ${organization.address}</p>` : ""}
        </div>
        <div class="quote-info">
          <h2>ORÇAMENTO</h2>
          <p><strong>#${quote.quote_number}</strong></p>
          <p>Emitido em ${format(new Date(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
          <span class="status-badge status-${quote.status}">
            ${getStatusLabel(quote.status)}
          </span>
        </div>
      </div>
      
      <div class="section">
        <h3 class="section-title">Informações do Cliente</h3>
        <div class="client-grid">
          <div class="client-field">
            <label>Nome</label>
            <p>${quote.contact_name}</p>
          </div>
          <div class="client-field">
            <label>Telefone</label>
            <p>${quote.contact_phone}</p>
          </div>
          ${quote.contact_email ? `
          <div class="client-field">
            <label>Email</label>
            <p>${quote.contact_email}</p>
          </div>
          ` : ""}
        </div>
        ${quote.valid_until ? `
        <div class="validity">
          ⚠️ Este orçamento é válido até ${format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: ptBR })}
        </div>
        ` : ""}
      </div>
      
      <div class="section">
        <h3 class="section-title">Procedimentos</h3>
        <table>
          <thead>
            <tr>
              <th>Procedimento</th>
              <th class="text-center">Qtd</th>
              <th class="text-right">Valor Unit.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quote.quote_items?.map(item => `
              <tr>
                <td>
                  <strong>${item.procedure_name}</strong>
                  ${item.description ? `<br><small style="color: #6b7280">${item.description}</small>` : ""}
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">R$ ${item.unit_price.toFixed(2)}</td>
                <td class="text-right"><strong>R$ ${item.total_price.toFixed(2)}</strong></td>
              </tr>
            `).join("") || ""}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span class="totals-label">Subtotal:</span>
            <span>R$ ${quote.total_amount.toFixed(2)}</span>
          </div>
          ${quote.discount_percentage || quote.discount_amount ? `
          <div class="totals-row discount">
            <span>Desconto:</span>
            <span>-${quote.discount_percentage ? `${quote.discount_percentage}%` : `R$ ${quote.discount_amount?.toFixed(2)}`}</span>
          </div>
          ` : ""}
          <div class="totals-row final">
            <span>TOTAL:</span>
            <span>R$ ${quote.final_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      ${quote.quote_payments && quote.quote_payments.length > 0 ? `
      <div class="section">
        <h3 class="section-title">Condições de Pagamento</h3>
        <table>
          <thead>
            <tr>
              <th>Parcela</th>
              <th>Vencimento</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${quote.quote_payments.map(payment => `
              <tr>
                <td>${payment.installment_number}ª Parcela</td>
                <td>${format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}</td>
                <td class="text-right">R$ ${payment.amount.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      ` : ""}
      
      ${quote.notes ? `
      <div class="section">
        <h3 class="section-title">Observações</h3>
        <div class="notes">${quote.notes}</div>
      </div>
      ` : ""}
      
      <div class="footer">
        <p>Orçamento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        <p>Este documento não tem valor fiscal</p>
      </div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
    
    toast.success("PDF sendo gerado...");
  } else {
    toast.error("Não foi possível abrir a janela de impressão. Verifique se pop-ups estão permitidos.");
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviado",
    approved: "Aprovado",
    rejected: "Rejeitado",
    expired: "Expirado",
    converted: "Convertido",
  };
  return labels[status] || status;
}
