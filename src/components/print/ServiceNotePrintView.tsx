import React from 'react';
import { Note, NoteItem } from '../../types';

const formatMoney = (value: unknown) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const formatDate = (value?: string) => {
  if (!value) return 'Nao informado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Nao informado' : date.toLocaleDateString('pt-BR');
};

const getItemPrice = (item: NoteItem) => Number(item.price || 0);
const getItemQuantity = (item: NoteItem) => item.type === 'service' ? 1 : Number(item.quantity || 1);
const getItemSubtotal = (item: NoteItem) => {
  const rawTotal = getItemPrice(item) * getItemQuantity(item);
  const discount = item.discount_percent ? rawTotal * (Number(item.discount_percent) / 100) : 0;
  return rawTotal - discount;
};

export default function ServiceNotePrintView({ note }: { note: Note }) {
  const items = note.items || [];
  const services = items.filter((item) => item.type === 'service');
  const parts = items.filter((item) => item.type === 'part');
  const servicesSubtotal = services.reduce((sum, item) => sum + getItemSubtotal(item), 0);
  const partsSubtotal = parts.reduce((sum, item) => sum + getItemSubtotal(item), 0);
  const grossTotal = items.reduce((sum, item) => sum + (getItemPrice(item) * getItemQuantity(item)), 0);
  const discountsTotal = items.reduce((sum, item) => {
    const rawTotal = getItemPrice(item) * getItemQuantity(item);
    return sum + (item.discount_percent ? rawTotal * (Number(item.discount_percent) / 100) : 0);
  }, 0);
  const finalTotal = servicesSubtotal + partsSubtotal;
  const paidAmount = Number(note.paid_amount || 0);
  const balance = Math.max(0, finalTotal - paidAmount);

  const renderRows = (rows: NoteItem[], emptyLabel: string) => (
    rows.length > 0 ? rows.map((item, index) => (
      <tr key={`${item.description}-${index}`}>
        <td>{item.description}</td>
        <td className="print-doc-table-center">{getItemQuantity(item)}</td>
        <td className="print-doc-table-money">{formatMoney(item.price)}</td>
        <td className="print-doc-table-center">{item.discount_percent ? `${item.discount_percent}%` : '-'}</td>
        <td className="print-doc-table-money">{formatMoney(getItemSubtotal(item))}</td>
      </tr>
    )) : (
      <tr>
        <td colSpan={5} className="print-doc-empty-row">{emptyLabel}</td>
      </tr>
    )
  );

  return (
    <article className="print-doc">
      <header className="print-doc-header">
        <div>
          <div className="print-doc-brand">RJ Santos Automotive</div>
          <div className="print-doc-subtitle">Nota de Servico / Recibo de Servico</div>
          <div className="print-doc-company">CNPJ: 21.418.588/0001-78 | Tel: (21) 99895-6306</div>
          <div className="print-doc-company">Rua Almerinda Ferreira de Almeida, 239 - Papucaia, Cachoeiras de Macacu</div>
          <div className="print-doc-warning">Documento interno de servico. Nao substitui nota fiscal quando exigida.</div>
        </div>
        <div className="print-doc-id-box">
          <div className="print-doc-type">{note.document_type === 'budget' ? 'Orcamento' : 'Nota de Servico'}</div>
          <div className="print-doc-number">Nota #{String(note.id).padStart(4, '0')}</div>
          {note.order_id && <div className="print-doc-link">O.S. #{String(note.order_id).padStart(4, '0')}</div>}
        </div>
      </header>

      <section className="print-doc-grid print-doc-section">
        <div>
          <h3>Cliente</h3>
          <p className="print-doc-strong">{note.client_name || note.manual_client_name || 'Nao informado'}</p>
        </div>
        <div>
          <h3>Veiculo</h3>
          <p className="print-doc-strong">{note.vehicle_model || note.manual_vehicle_model || 'Nao informado'}</p>
          <p>Placa: {note.plate || note.manual_plate || 'Nao informado'}</p>
        </div>
        <div>
          <h3>Emissao</h3>
          <p>{formatDate(note.created_at)}</p>
        </div>
        <div>
          <h3>Pagamento</h3>
          <p>{note.payment_status === 'paid' ? 'Pago' : note.payment_status === 'partial' ? 'Parcial' : 'Nao pago'}</p>
        </div>
      </section>

      <section className="print-doc-section">
        <h2>Servicos / Mao de obra</h2>
        <table className="print-doc-table">
          <thead>
            <tr>
              <th>Descricao</th>
              <th>Qtd</th>
              <th>Unitario</th>
              <th>Desc.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>{renderRows(services, 'Nenhum servico informado.')}</tbody>
        </table>
      </section>

      <section className="print-doc-section">
        <h2>Pecas / Itens aplicados</h2>
        <table className="print-doc-table">
          <thead>
            <tr>
              <th>Descricao</th>
              <th>Qtd</th>
              <th>Unitario</th>
              <th>Desc.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>{renderRows(parts, 'Nenhuma peca aplicada informada.')}</tbody>
        </table>
      </section>

      <section className="print-doc-total-row print-doc-total-row-wide">
        <div>Subtotal servicos: <strong>{formatMoney(servicesSubtotal)}</strong></div>
        <div>Subtotal pecas: <strong>{formatMoney(partsSubtotal)}</strong></div>
        <div>Descontos: <strong>{formatMoney(discountsTotal)}</strong></div>
        <div>Total final: <strong>{formatMoney(note.total_amount || finalTotal || grossTotal)}</strong></div>
      </section>

      {note.payment_status === 'partial' && (
        <section className="print-doc-section">
          <h2>Pagamento parcial</h2>
          <p className="print-doc-box">Pago: {formatMoney(paidAmount)} | Saldo: {formatMoney(balance)}</p>
        </section>
      )}

      <section className="print-doc-terms">
        Declaro ciencia dos servicos executados, pecas/itens aplicados, valores e condicoes apresentados neste documento.
      </section>

      <footer className="print-doc-signatures">
        <div>
          <span />
          <p>Assinatura do cliente/responsavel</p>
        </div>
        <div>
          <span />
          <p>Assinatura da oficina</p>
        </div>
      </footer>
    </article>
  );
}
