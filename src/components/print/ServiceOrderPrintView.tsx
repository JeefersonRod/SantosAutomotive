import React from 'react';
import { ServiceOrder, OrderItem } from '../../types';
import { CHECKLIST_ITEMS, getChecklistStatusMeta, normalizeChecklist } from '../../utils/checklist';

const formatMoney = (value: unknown) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const formatDate = (value?: string) => {
  if (!value) return 'Nao informado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Nao informado' : date.toLocaleDateString('pt-BR');
};

const getOrderItemTotal = (item: OrderItem) => Number(item.price || 0) * Number(item.quantity || 1);

export default function ServiceOrderPrintView({ order }: { order: ServiceOrder }) {
  const checklist = normalizeChecklist(order.checklist);
  const serviceItems = (order.items || []).filter((item) => item.type === 'labor');
  const partItems = (order.items || []).filter((item) => item.type === 'parts');
  const servicesTotal = serviceItems.reduce((sum, item) => sum + getOrderItemTotal(item), 0);
  const partsTotal = partItems.reduce((sum, item) => sum + getOrderItemTotal(item), 0);
  const statusLabel =
    order.status === 'pending' ? 'Recepcao / Pendente' :
      order.status === 'in_progress' ? 'Em diagnostico / Execucao' :
        'Finalizada';

  const renderItems = (items: OrderItem[], emptyLabel: string) => (
    items.length > 0 ? items.map((item, index) => (
      <tr key={`${item.description}-${index}`}>
        <td>{item.description}</td>
        <td className="print-doc-table-center">{item.quantity || 1}</td>
        <td className="print-doc-table-money">{formatMoney(item.price)}</td>
        <td className="print-doc-table-money">{formatMoney(getOrderItemTotal(item))}</td>
      </tr>
    )) : (
      <tr>
        <td colSpan={4} className="print-doc-empty-row">{emptyLabel}</td>
      </tr>
    )
  );

  return (
    <article className="print-doc">
      <header className="print-doc-header">
        <div>
          <div className="print-doc-brand">RJ Santos Automotive</div>
          <div className="print-doc-subtitle">Gestao de oficina e servicos automotivos</div>
          <div className="print-doc-company">CNPJ: 21.418.588/0001-78 | Tel: (21) 99895-6306</div>
          <div className="print-doc-company">Rua Almerinda Ferreira de Almeida, 239 - Papucaia, Cachoeiras de Macacu</div>
        </div>
        <div className="print-doc-id-box">
          <div className="print-doc-type">Ordem de Servico</div>
          <div className="print-doc-number">OS #{String(order.id).padStart(4, '0')}</div>
          {order.is_priority && <div className="print-doc-priority">Prioridade</div>}
        </div>
      </header>

      <section className="print-doc-grid print-doc-section">
        <div>
          <h3>Cliente</h3>
          <p className="print-doc-strong">{order.customer_name || 'Nao informado'}</p>
          <p>Telefone: {order.customer_phone || 'Nao informado'}</p>
        </div>
        <div>
          <h3>Veiculo</h3>
          <p className="print-doc-strong">{order.vehicle_model || 'Nao informado'}</p>
          <p>Placa: {order.plate || 'Nao informado'}</p>
        </div>
        <div>
          <h3>Entrada</h3>
          <p>{formatDate(order.entry_date || order.created_at)}</p>
          <p>Status: {statusLabel}</p>
        </div>
        <div>
          <h3>Responsaveis</h3>
          <p>{order.technician_names?.length ? order.technician_names.join(', ') : 'Nao atribuido'}</p>
        </div>
      </section>

      <section className="print-doc-section">
        <h2>Queixa / Servico solicitado</h2>
        <p className="print-doc-box">{order.description || 'Nao informado'}</p>
      </section>

      <section className="print-doc-section">
        <h2>Checklist de entrada</h2>
        <div className="print-doc-checklist">
          <div>
            <span>Combustivel</span>
            <strong>{checklist.fuel_level === 'not_checked' ? 'Nao verificado' : checklist.fuel_level}</strong>
          </div>
          {CHECKLIST_ITEMS.map((item) => (
            <div key={item.key}>
              <span>{item.label}</span>
              <strong>{getChecklistStatusMeta(checklist[item.key]).printMark}</strong>
            </div>
          ))}
        </div>
      </section>

      {order.tests && order.tests.length > 0 && (
        <section className="print-doc-section">
          <h2>Diagnostico e testes</h2>
          <div className="print-doc-tests">
            {order.tests.map((test, index) => (
              <div key={`${test.component_name}-${index}`}>
                <strong>{test.component_name}</strong>
                <span>Resultado: {test.result || 'Nao informado'}</span>
                {test.notes && <small>Obs: {test.notes}</small>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="print-doc-section">
        <h2>Servicos / Mao de obra</h2>
        <table className="print-doc-table">
          <thead>
            <tr>
              <th>Descricao</th>
              <th>Qtd</th>
              <th>Unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>{renderItems(serviceItems, 'Nenhum servico informado.')}</tbody>
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
              <th>Total</th>
            </tr>
          </thead>
          <tbody>{renderItems(partItems, 'Nenhuma peca aplicada informada.')}</tbody>
        </table>
      </section>

      <section className="print-doc-total-row">
        <div>Subtotal servicos: <strong>{formatMoney(servicesTotal)}</strong></div>
        <div>Subtotal pecas: <strong>{formatMoney(partsTotal)}</strong></div>
        <div>Total estimado: <strong>{formatMoney(order.total_amount || servicesTotal + partsTotal)}</strong></div>
      </section>

      {order.notes && (
        <section className="print-doc-section">
          <h2>Observacoes</h2>
          <p className="print-doc-box">{order.notes}</p>
        </section>
      )}

      <section className="print-doc-terms">
        Autorizo a avaliacao/execucao dos servicos descritos nesta ordem, ciente dos itens de vistoria registrados no momento da entrada do veiculo.
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
