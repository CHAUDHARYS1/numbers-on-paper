/* ── Invoice editor / New invoice ─────────────────────── */
const M_NOTE_SNIPPETS = [
  { label: 'Net 14', text: 'Payment is due within 14 days of the invoice date. Thank you for your business!' },
  { label: 'Net 30', text: 'Payment is due within 30 days. A 1.5% monthly fee applies to balances past due.' },
  { label: 'On receipt', text: 'Payment is due upon receipt of this invoice.' },
  { label: '50% deposit', text: 'A 50% deposit is required before work begins; the balance is due on completion.' },
];
const m_uid = () => Math.random().toString(36).slice(2, 9);
const m_blankItem = () => ({ id: m_uid(), description: '', qty: 1, rate: 0 });

function MField({ label, hint, children }) {
  return <div className="m-field"><label className="m-label">{label}</label>{children}{hint ? <span className="m-hint">{hint}</span> : null}</div>;
}

function EditorScreen({ app, id }) {
  const NOP = window.NOP;
  const { fmt } = NOP;
  const { useState, useMemo } = React;

  const existing = useMemo(() => NOP.invoices.find(i => i.id === id), [id]);
  const isNew = !existing;
  const seedClient = existing ? existing.client : '';
  const c0 = NOP.clients[seedClient] || {};

  const [number] = useState(existing ? existing.invoice_number : 'INV-0044');
  const [status, setStatus] = useState(existing ? existing.status : 'draft');
  const [issue, setIssue]   = useState(existing ? existing.issue_date : NOP.TODAY);
  const [due, setDue]       = useState(existing ? existing.due_date : '2026-06-27');
  const [clientKey, setClientKey] = useState(seedClient);
  const [bill, setBill] = useState({ name: c0.name || '', contact: c0.contact || '', email: c0.email || '', city: c0.city || '' });
  const [items, setItems] = useState(existing ? existing.items.map(it => ({ id: m_uid(), ...it })) : [m_blankItem()]);
  const [showTax, setShowTax] = useState(existing ? (existing.tax || 0) > 0 : true);
  const [taxRate, setTaxRate] = useState(existing ? Math.round((existing.tax || 0) * 100) : 7);
  const [showNotes, setShowNotes] = useState(true);
  const [notes, setNotes] = useState('Payment is due within 14 days of the invoice date. Thank you for your business!');
  const [previewOpen, setPreviewOpen] = useState(false);

  const pickClient = (key) => {
    setClientKey(key);
    const c = NOP.clients[key];
    if (c) setBill({ name: c.name, contact: c.contact, email: c.email, city: c.city });
  };
  const setItem = (iid, field, val) => setItems(its => its.map(it => it.id === iid ? { ...it, [field]: val } : it));
  const addItem = () => setItems(its => [...its, m_blankItem()]);
  const delItem = (iid) => setItems(its => its.length > 1 ? its.filter(it => it.id !== iid) : its);

  const lineItems = items.map(it => ({ ...it, qty: +it.qty || 0, rate: +it.rate || 0, amount: (+it.qty || 0) * (+it.rate || 0) }));
  const subtotal = lineItems.reduce((s, it) => s + it.amount, 0);
  const taxAmt = showTax ? +(subtotal * (taxRate / 100)).toFixed(2) : 0;
  const total = +(subtotal + taxAmt).toFixed(2);

  const docData = {
    invoice_number: number, issue_date: issue, due_date: due, status,
    billFrom: NOP.business, billTo: bill, items: lineItems,
    subtotal, taxRate: taxRate / 100, taxAmt, total, showTax, notes: showNotes ? notes : '',
  };

  const save = () => {
    app.saveInvoice({
      id: existing ? existing.id : 'new_' + m_uid(),
      invoice_number: number, client: clientKey, clientName: bill.name || 'New client',
      issue_date: status === 'draft' ? (issue || null) : issue, due_date: status === 'draft' ? (due || null) : due,
      status, tax: showTax ? taxRate / 100 : 0, items: lineItems.map(({ description, qty, rate, amount }) => ({ description, qty, rate, amount })),
      total, notes: showNotes ? notes : '',
    }, isNew);
  };

  return (
    <React.Fragment>
      <div className="m-scroll">
        <window.ScreenHead onBack={app.pop} title={isNew ? 'New invoice' : 'Edit invoice'}
          sub={isNew ? 'Fill in the details and save.' : number + ' · ' + (bill.name || 'Client')} />

        <div className="m-body m-body--flow">
          {/* Details */}
          <div className="m-form-card">
            <div className="m-form-card-title">Invoice details</div>
            <div className="m-stack">
              <div className="m-row2">
                <MField label="Number"><input className="m-input m-input--mono" value={number} readOnly /></MField>
                <MField label="Status">
                  <select className="m-select" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="draft">Draft</option><option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option><option value="overdue">Overdue</option>
                  </select>
                </MField>
              </div>
              <div className="m-row2">
                <MField label="Issued"><input className="m-input m-input--mono" type="date" value={issue || ''} onChange={e => setIssue(e.target.value)} /></MField>
                <MField label="Due"><input className="m-input m-input--mono" type="date" value={due || ''} onChange={e => setDue(e.target.value)} /></MField>
              </div>
            </div>
          </div>

          {/* Bill to */}
          <div className="m-form-card">
            <div className="m-form-card-title">Bill to</div>
            <div className="m-stack">
              <MField label="Saved client" hint="Pick to autofill, or type a new one below.">
                <select className="m-select" value={clientKey} onChange={e => pickClient(e.target.value)}>
                  <option value="">New client…</option>
                  {Object.entries(NOP.clients).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
                </select>
              </MField>
              <MField label="Client name"><input className="m-input" placeholder="Company or person" value={bill.name} onChange={e => setBill(b => ({ ...b, name: e.target.value }))} /></MField>
              <div className="m-row2">
                <MField label="Contact"><input className="m-input" placeholder="Jane Smith" value={bill.contact} onChange={e => setBill(b => ({ ...b, contact: e.target.value }))} /></MField>
                <MField label="City"><input className="m-input" placeholder="City, ST" value={bill.city} onChange={e => setBill(b => ({ ...b, city: e.target.value }))} /></MField>
              </div>
              <MField label="Email"><input className="m-input" type="email" placeholder="jane@company.com" value={bill.email} onChange={e => setBill(b => ({ ...b, email: e.target.value }))} /></MField>
            </div>
          </div>

          {/* Line items */}
          <div className="m-form-card">
            <div className="m-form-card-title">Line items</div>
            {lineItems.map((it, idx) => (
              <div className="m-li" key={it.id}>
                <div className="m-li-top">
                  <span className="m-li-tag">Item {idx + 1}</span>
                  <button className="m-li-del" onClick={() => delItem(it.id)} disabled={items.length === 1} aria-label="Remove"><i className="ph ph-trash"></i></button>
                </div>
                <div className="m-stack" style={{ gap: 10 }}>
                  <input className="m-input" placeholder="e.g. Brand identity system" value={it.description} onChange={e => setItem(it.id, 'description', e.target.value)} />
                  <div className="m-row2" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'end' }}>
                    <MField label="Qty"><input className="m-input m-input--mono" type="number" min="0" value={it.qty} onChange={e => setItem(it.id, 'qty', e.target.value)} /></MField>
                    <MField label="Rate"><input className="m-input m-input--mono" type="number" min="0" value={it.rate} onChange={e => setItem(it.id, 'rate', e.target.value)} /></MField>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="m-hint">Amount</span>
                    <span className="m-li-amt">{fmt(it.amount)}</span>
                  </div>
                </div>
              </div>
            ))}
            <button className="m-btn m-btn--soft" onClick={addItem}><i className="ph ph-plus"></i> Add item</button>
          </div>

          {/* Totals & options */}
          <div className="m-form-card">
            <div className="m-form-card-title">Totals &amp; options</div>
            <div className="m-toggle-row">
              <div className="m-toggle-main"><div className="m-toggle-t">Add tax</div><div className="m-toggle-d">Apply a tax rate to the subtotal</div></div>
              <window.MSwitch checked={showTax} onChange={setShowTax} />
            </div>
            {showTax ? (
              <div style={{ paddingTop: 14 }}>
                <MField label="Tax rate (%)"><input className="m-input m-input--mono" type="number" min="0" max="100" step="0.1" value={taxRate} onChange={e => setTaxRate(+e.target.value || 0)} /></MField>
              </div>
            ) : null}
            <div className="m-toggle-row">
              <div className="m-toggle-main"><div className="m-toggle-t">Notes &amp; terms</div><div className="m-toggle-d">Show a note on the invoice</div></div>
              <window.MSwitch checked={showNotes} onChange={setShowNotes} />
            </div>
            <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <div className="m-paper-tot"><span>Subtotal</span><span className="v">{fmt(subtotal)}</span></div>
              {showTax ? <div className="m-paper-tot"><span>Tax ({taxRate}%)</span><span className="v">{fmt(taxAmt)}</span></div> : null}
              <div className="m-paper-tot grand"><span>Grand total</span><span className="v">{fmt(total)}</span></div>
            </div>
          </div>

          {/* Notes */}
          {showNotes ? (
            <div className="m-form-card">
              <div className="m-form-card-title">Notes &amp; terms</div>
              <textarea className="m-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, thank-you note, or any additional info…"></textarea>
              <div className="m-snips">
                <span className="lbl">Quick fill:</span>
                {M_NOTE_SNIPPETS.map(s => <button key={s.label} className="m-snip" onClick={() => setNotes(s.text)}>{s.label}</button>)}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="m-actionbar">
        <button className="m-btn m-btn--ghost" onClick={() => setPreviewOpen(true)}><i className="ph ph-eye"></i> Preview</button>
        <button className="m-btn m-btn--primary" onClick={save}><i className="ph ph-floppy-disk"></i> {isNew ? 'Save invoice' : 'Save'}</button>
      </div>

      {previewOpen ? (
        <window.Sheet title="Preview" onClose={() => setPreviewOpen(false)}>
          <window.MInvoiceDoc data={docData} />
        </window.Sheet>
      ) : null}
    </React.Fragment>
  );
}

window.EditorScreen = EditorScreen;
