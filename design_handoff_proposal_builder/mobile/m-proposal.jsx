/* ── Mobile proposal editor + proposal paper ──────────────
   Mirrors the desktop ProposalEditor: a form with toggleable
   sections, a bottom-sheet preview, and PDF export (print).
   Exports ProposalEditorScreen + MProposalDoc to window.
   ──────────────────────────────────────────────────────── */
const { Badge: M_PBadge } = window.TaskmasterProDesignSystem_b94546;

const MP_TERMS = [
  { label: '50% deposit', text: 'A 50% deposit is required to reserve the project start date; the remaining balance is due upon final delivery. This proposal is valid for 30 days from the date above.' },
  { label: 'Milestones', text: 'Payment is split across three milestones: 40% at kickoff, 30% at design sign-off, and 30% on launch. Invoices are due within 14 days of issue.' },
  { label: 'Net 30', text: 'All invoices are payable within 30 days. Work begins upon written approval of this proposal. Scope changes are billed separately at the agreed hourly rate.' },
];

const mp_uid = () => Math.random().toString(36).slice(2, 9);
const mp_blankItem = () => ({ id: mp_uid(), description: '', qty: 1, rate: 0 });

const MP_STATUS = { draft: ['gray', 'Draft'], sent: ['amber', 'Sent'], accepted: ['green', 'Accepted'], declined: ['red', 'Declined'] };
function MPropStatusBadge({ status }) {
  const [tone, label] = MP_STATUS[status] || ['gray', 'Draft'];
  return <M_PBadge tone={tone}>{label}</M_PBadge>;
}

const MP_SECTIONS = [
  { key: 'intro',        name: 'Introduction',       hint: 'Opening note to the client' },
  { key: 'scope',        name: 'Scope of work',      hint: 'Overview & objectives' },
  { key: 'deliverables', name: 'Deliverables',       hint: 'What they receive' },
  { key: 'investment',   name: 'Investment',         hint: 'Pricing & line items' },
  { key: 'timeline',     name: 'Timeline',           hint: 'Phases & milestones' },
  { key: 'terms',        name: 'Terms & conditions', hint: 'Payment & legal terms' },
  { key: 'acceptance',   name: 'Acceptance',         hint: 'Signature block' },
];

function MPField({ label, hint, children }) {
  return <div className="m-field"><label className="m-label">{label}</label>{children}{hint ? <span className="m-hint">{hint}</span> : null}</div>;
}

/* simple add/remove single-line list */
function MPList({ items, onChange, placeholder, addLabel }) {
  const set = (i, v) => onChange(items.map((it, idx) => idx === i ? v : it));
  const add = () => onChange([...items, '']);
  const del = (i) => onChange(items.length > 1 ? items.filter((_, idx) => idx !== i) : ['']);
  return (
    <div className="m-stack" style={{ gap: 10 }}>
      {items.map((it, i) => (
        <div className="m-listrow" key={i}>
          <input className="m-input" value={it} placeholder={placeholder} onChange={e => set(i, e.target.value)} />
          <button className="m-li-del" onClick={() => del(i)} aria-label="Remove"><i className="ph ph-x-circle"></i></button>
        </div>
      ))}
      <button className="m-btn m-btn--soft" onClick={add}><i className="ph ph-plus"></i> {addLabel}</button>
    </div>
  );
}

/* ── Mobile proposal paper ──────────────────────────────── */
function MProposalDoc({ data }) {
  const NOP = window.NOP;
  const { fmt, fmtDate } = NOP;
  const d = data || {};
  const sec = d.sections || {};
  const bf = d.preparedBy || {};
  const bt = d.preparedFor || {};
  const items = d.items || [];
  const blocks = [];

  if (sec.intro && (d.introText || '').trim())
    blocks.push({ key: 'intro', title: 'Introduction', body: <p className="m-pp-text">{d.introText}</p> });

  if (sec.scope && ((d.scopeText || '').trim() || (d.objectives || []).filter(o => o.trim()).length))
    blocks.push({ key: 'scope', title: 'Scope of work', body: (
      <>
        {(d.scopeText || '').trim() ? <p className="m-pp-text">{d.scopeText}</p> : null}
        {(d.objectives || []).filter(o => o.trim()).length ? (
          <ul className="m-pp-list m-pp-list--num">
            {d.objectives.filter(o => o.trim()).map((o, i) => (
              <li key={i}><span className="m-pp-n">{String(i + 1).padStart(2, '0')}</span><span>{o}</span></li>
            ))}
          </ul>
        ) : null}
      </>
    )});

  if (sec.deliverables && (d.deliverables || []).filter(x => x.trim()).length)
    blocks.push({ key: 'deliverables', title: 'Deliverables', body: (
      <ul className="m-pp-list m-pp-list--check">
        {d.deliverables.filter(x => x.trim()).map((x, i) => <li key={i}><i className="ph ph-check-circle"></i><span>{x}</span></li>)}
      </ul>
    )});

  if (sec.investment)
    blocks.push({ key: 'investment', title: 'Investment', body: (
      <>
        {items.length === 0 ? <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>No line items yet.</div> :
          items.map((it, i) => (
            <div className="m-paper-li" key={i}>
              <div style={{ minWidth: 0 }}>
                <div className="m-paper-li-desc">{it.description || '—'}</div>
                <div className="m-paper-li-qty">{it.qty} × {fmt(it.rate)}</div>
              </div>
              <div className="m-paper-li-amt">{fmt(it.amount)}</div>
            </div>
          ))}
        <div style={{ marginTop: 14 }}>
          <div className="m-paper-tot"><span>Subtotal</span><span className="v">{fmt(d.subtotal)}</span></div>
          {d.showTax ? <div className="m-paper-tot"><span>Tax ({Math.round((d.taxRate || 0) * 100)}%)</span><span className="v">{fmt(d.taxAmt)}</span></div> : null}
          <div className="m-paper-tot grand"><span>Total</span><span className="v">{fmt(d.total)}</span></div>
        </div>
      </>
    )});

  if (sec.timeline && (d.timeline || []).filter(m => m.phase.trim()).length)
    blocks.push({ key: 'timeline', title: 'Timeline', body: (
      <div className="m-pp-timeline">
        {d.timeline.filter(m => m.phase.trim()).map((m, i) => (
          <div className="m-pp-mile" key={i}>
            <span className="m-pp-dot"></span>
            <span className="m-pp-mile-p">{m.phase}</span>
            <span className="m-pp-mile-d">{m.duration || '—'}</span>
          </div>
        ))}
      </div>
    )});

  if (sec.terms && (d.termsText || '').trim())
    blocks.push({ key: 'terms', title: 'Terms & conditions', body: <p className="m-pp-text m-pp-text--sm">{d.termsText}</p> });

  if (sec.acceptance)
    blocks.push({ key: 'acceptance', title: 'Acceptance', body: (
      <>
        <p className="m-pp-text m-pp-text--sm">By signing below, you agree to the scope, investment, and terms outlined here.</p>
        <div className="m-pp-sign">
          <div className="m-pp-sign-col"><div className="m-pp-sign-line"></div><div className="m-pp-sign-lbl">Signature · {bt.name || 'Client'}</div></div>
          <div className="m-pp-sign-col"><div className="m-pp-sign-line"></div><div className="m-pp-sign-lbl">Date</div></div>
        </div>
      </>
    )});

  return (
    <div className="m-paper m-print-target">
      <div className="m-paper-top">
        <div className="m-paper-brand">
          <div className="m-paper-logo"><img src="numbers-on-paper-assets/mark/mark-white.svg" alt="" style={{ width: 22, height: 22 }} /></div>
          <div>
            <div className="m-paper-biz">{bf.name || 'SC Design & Consultation'}</div>
            <div className="m-paper-tag">Web Design &amp; Consultation</div>
          </div>
        </div>
        <div className="m-paper-docrow">
          <div>
            <div className="m-paper-word">Proposal</div>
            <div className="m-paper-num">{d.number || 'PROP-0000'}</div>
          </div>
          <MPropStatusBadge status={d.status || 'draft'} />
        </div>
      </div>

      <div className="m-paper-body">
        {(d.title || '').trim() ? <h2 className="m-pp-title">{d.title}</h2> : null}
        <div className="m-paper-meta">
          <div>
            <div className="lab">Prepared for</div>
            <div className="val"><strong>{bt.name || '—'}</strong>{bt.contact ? <><br />{bt.contact}</> : null}{bt.city ? <><br />{bt.city}</> : null}</div>
          </div>
          <div>
            <div className="lab">Prepared by</div>
            <div className="val"><strong>{bf.name}</strong><br />{bf.line1}<br />{bf.line2}</div>
          </div>
          <div>
            <div className="lab">Date</div>
            <div className="val"><strong>{fmtDate(d.issue_date)}</strong></div>
          </div>
          <div>
            <div className="lab">Valid until</div>
            <div className="val"><strong>{fmtDate(d.valid_until)}</strong></div>
          </div>
        </div>

        {blocks.map((b, i) => (
          <div className="m-pp-sec" key={b.key}>
            <div className="m-pp-sec-h"><span className="m-pp-sec-n">{String(i + 1).padStart(2, '0')}</span><span className="m-pp-sec-t">{b.title}</span></div>
            {b.body}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Proposal editor screen ─────────────────────────────── */
function ProposalEditorScreen({ app }) {
  const NOP = window.NOP;
  const { fmt } = NOP;
  const { useState } = React;

  const [number] = useState('PROP-0007');
  const [title, setTitle]   = useState('Website redesign & brand refresh');
  const [status, setStatus] = useState('draft');
  const [issue, setIssue]   = useState(NOP.TODAY);
  const [valid, setValid]   = useState('2026-07-13');

  const [clientKey, setClientKey] = useState('northwind');
  const c0 = NOP.clients.northwind;
  const [client, setClient] = useState({ name: c0.name, contact: c0.contact, email: c0.email, city: c0.city });

  const [sections, setSections] = useState({ intro: true, scope: true, deliverables: true, investment: true, timeline: true, terms: true, acceptance: true });
  const toggleSection = (k) => setSections(s => ({ ...s, [k]: !s[k] }));

  const [introText, setIntroText] = useState("Thank you for the opportunity to partner on this project. This proposal outlines our recommended approach, deliverables, and investment to bring your new website and refreshed brand to life.");
  const [scopeText, setScopeText] = useState("We'll redesign your marketing site end-to-end: a clear messaging hierarchy, a modern responsive design system, and a fast, accessible build — organized into discovery, design, and development phases.");
  const [objectives, setObjectives] = useState(['Clarify the brand story and visual identity', 'Increase qualified inbound leads', 'Establish a reusable design system']);
  const [deliverables, setDeliverables] = useState(['Brand & messaging guidelines (PDF)', 'Responsive design system in Figma', 'Fully built marketing site — up to 8 pages', 'CMS setup with editor training', '30 days of post-launch support']);

  const [items, setItems] = useState([
    { id: mp_uid(), description: 'Discovery & strategy workshop', qty: 1, rate: 2400 },
    { id: mp_uid(), description: 'UX/UI design system', qty: 1, rate: 5600 },
    { id: mp_uid(), description: 'Frontend build & CMS', qty: 1, rate: 6800 },
  ]);
  const [showTax, setShowTax] = useState(true);
  const [taxRate, setTaxRate] = useState(7);

  const [timeline, setTimeline] = useState([
    { phase: 'Discovery & strategy', duration: 'Week 1–2' },
    { phase: 'Design & sign-off', duration: 'Week 3–5' },
    { phase: 'Build & QA', duration: 'Week 6–8' },
    { phase: 'Launch & handoff', duration: 'Week 9' },
  ]);

  const [termsText, setTermsText] = useState(MP_TERMS[1].text);
  const [previewOpen, setPreviewOpen] = useState(false);

  const pickClient = (key) => {
    setClientKey(key);
    const c = NOP.clients[key];
    if (c) setClient({ name: c.name, contact: c.contact, email: c.email, city: c.city });
  };
  const setItem = (id, f, v) => setItems(its => its.map(it => it.id === id ? { ...it, [f]: v } : it));
  const addItem = () => setItems(its => [...its, mp_blankItem()]);
  const delItem = (id) => setItems(its => its.length > 1 ? its.filter(it => it.id !== id) : its);
  const setMile = (i, f, v) => setTimeline(t => t.map((m, idx) => idx === i ? { ...m, [f]: v } : m));
  const addMile = () => setTimeline(t => [...t, { phase: '', duration: '' }]);
  const delMile = (i) => setTimeline(t => t.length > 1 ? t.filter((_, idx) => idx !== i) : t);

  const lineItems = items.map(it => ({ ...it, qty: +it.qty || 0, rate: +it.rate || 0, amount: (+it.qty || 0) * (+it.rate || 0) }));
  const subtotal = lineItems.reduce((s, it) => s + it.amount, 0);
  const taxAmt = showTax ? +(subtotal * (taxRate / 100)).toFixed(2) : 0;
  const total = +(subtotal + taxAmt).toFixed(2);

  const docData = {
    number, title, status, issue_date: issue, valid_until: valid,
    preparedBy: NOP.business, preparedFor: client, sections,
    introText, scopeText, objectives, deliverables,
    items: lineItems, subtotal, taxRate: taxRate / 100, taxAmt, total, showTax,
    timeline, termsText,
  };

  const exportPdf = () => { setPreviewOpen(true); setTimeout(() => window.print(), 350); };
  const save = () => app.saveProposal(number, client.name);

  const SecToggle = ({ sk }) => {
    const def = MP_SECTIONS.find(s => s.key === sk);
    return (
      <div className="m-toggle-row">
        <div className="m-toggle-main"><div className="m-toggle-t">{def.name}</div><div className="m-toggle-d">{def.hint}</div></div>
        <window.MSwitch checked={sections[sk]} onChange={() => toggleSection(sk)} />
      </div>
    );
  };

  return (
    <React.Fragment>
      <div className="m-scroll">
        <window.ScreenHead onBack={app.pop} title="New proposal" sub="Fill in the details, toggle sections, preview." />

        <div className="m-body m-body--flow">
          {/* Details */}
          <div className="m-form-card">
            <div className="m-form-card-title">Proposal details</div>
            <div className="m-stack">
              <MPField label="Title"><input className="m-input" value={title} placeholder="e.g. Website redesign" onChange={e => setTitle(e.target.value)} /></MPField>
              <div className="m-row2">
                <MPField label="Number"><input className="m-input m-input--mono" value={number} readOnly /></MPField>
                <MPField label="Status">
                  <select className="m-select" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="draft">Draft</option><option value="sent">Sent</option>
                    <option value="accepted">Accepted</option><option value="declined">Declined</option>
                  </select>
                </MPField>
              </div>
              <div className="m-row2">
                <MPField label="Date"><input className="m-input m-input--mono" type="date" value={issue || ''} onChange={e => setIssue(e.target.value)} /></MPField>
                <MPField label="Valid until"><input className="m-input m-input--mono" type="date" value={valid || ''} onChange={e => setValid(e.target.value)} /></MPField>
              </div>
            </div>
          </div>

          {/* Prepared for */}
          <div className="m-form-card">
            <div className="m-form-card-title">Prepared for</div>
            <div className="m-stack">
              <MPField label="Saved client" hint="Pick to autofill, or type a new one below.">
                <select className="m-select" value={clientKey} onChange={e => pickClient(e.target.value)}>
                  <option value="">New client…</option>
                  {Object.entries(NOP.clients).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
                </select>
              </MPField>
              <MPField label="Client name"><input className="m-input" placeholder="Company or person" value={client.name} onChange={e => setClient(c => ({ ...c, name: e.target.value }))} /></MPField>
              <div className="m-row2">
                <MPField label="Contact"><input className="m-input" placeholder="Jane Smith" value={client.contact} onChange={e => setClient(c => ({ ...c, contact: e.target.value }))} /></MPField>
                <MPField label="City"><input className="m-input" placeholder="City, ST" value={client.city} onChange={e => setClient(c => ({ ...c, city: e.target.value }))} /></MPField>
              </div>
            </div>
          </div>

          {/* Sections toggle panel */}
          <div className="m-form-card">
            <div className="m-form-card-title">Sections <span className="m-form-card-sub">Toggle what appears</span></div>
            {MP_SECTIONS.map(s => <SecToggle key={s.key} sk={s.key} />)}
          </div>

          {/* Introduction */}
          {sections.intro ? (
            <div className="m-form-card">
              <div className="m-form-card-title">Introduction</div>
              <textarea className="m-textarea" value={introText} onChange={e => setIntroText(e.target.value)} placeholder="Open with a warm note about the project…"></textarea>
            </div>
          ) : null}

          {/* Scope */}
          {sections.scope ? (
            <div className="m-form-card">
              <div className="m-form-card-title">Scope of work</div>
              <div className="m-stack">
                <MPField label="Overview"><textarea className="m-textarea" value={scopeText} onChange={e => setScopeText(e.target.value)} placeholder="Describe the work at a high level…"></textarea></MPField>
                <MPField label="Objectives"><MPList items={objectives} onChange={setObjectives} placeholder="e.g. Increase qualified leads" addLabel="Add objective" /></MPField>
              </div>
            </div>
          ) : null}

          {/* Deliverables */}
          {sections.deliverables ? (
            <div className="m-form-card">
              <div className="m-form-card-title">Deliverables</div>
              <MPList items={deliverables} onChange={setDeliverables} placeholder="e.g. Responsive design system" addLabel="Add deliverable" />
            </div>
          ) : null}

          {/* Investment */}
          {sections.investment ? (
            <div className="m-form-card">
              <div className="m-form-card-title">Investment</div>
              {lineItems.map((it, idx) => (
                <div className="m-li" key={it.id}>
                  <div className="m-li-top">
                    <span className="m-li-tag">Item {idx + 1}</span>
                    <button className="m-li-del" onClick={() => delItem(it.id)} disabled={items.length === 1} aria-label="Remove"><i className="ph ph-trash"></i></button>
                  </div>
                  <div className="m-stack" style={{ gap: 10 }}>
                    <input className="m-input" placeholder="e.g. UX/UI design system" value={it.description} onChange={e => setItem(it.id, 'description', e.target.value)} />
                    <div className="m-row2" style={{ alignItems: 'end' }}>
                      <MPField label="Qty"><input className="m-input m-input--mono" type="number" min="0" value={it.qty} onChange={e => setItem(it.id, 'qty', e.target.value)} /></MPField>
                      <MPField label="Rate"><input className="m-input m-input--mono" type="number" min="0" value={it.rate} onChange={e => setItem(it.id, 'rate', e.target.value)} /></MPField>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="m-hint">Amount</span><span className="m-li-amt">{fmt(it.amount)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <button className="m-btn m-btn--soft" onClick={addItem}><i className="ph ph-plus"></i> Add item</button>
              <div className="m-toggle-row" style={{ marginTop: 6 }}>
                <div className="m-toggle-main"><div className="m-toggle-t">Add tax</div><div className="m-toggle-d">Apply a tax rate to the subtotal</div></div>
                <window.MSwitch checked={showTax} onChange={setShowTax} />
              </div>
              {showTax ? (
                <div style={{ paddingTop: 12 }}>
                  <MPField label="Tax rate (%)"><input className="m-input m-input--mono" type="number" min="0" max="100" step="0.1" value={taxRate} onChange={e => setTaxRate(+e.target.value || 0)} /></MPField>
                </div>
              ) : null}
              <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                <div className="m-paper-tot"><span>Subtotal</span><span className="v">{fmt(subtotal)}</span></div>
                {showTax ? <div className="m-paper-tot"><span>Tax ({taxRate}%)</span><span className="v">{fmt(taxAmt)}</span></div> : null}
                <div className="m-paper-tot grand"><span>Total</span><span className="v">{fmt(total)}</span></div>
              </div>
            </div>
          ) : null}

          {/* Timeline */}
          {sections.timeline ? (
            <div className="m-form-card">
              <div className="m-form-card-title">Timeline</div>
              <div className="m-stack" style={{ gap: 10 }}>
                {timeline.map((m, i) => (
                  <div className="m-listrow" key={i}>
                    <div className="m-row2" style={{ flex: 1 }}>
                      <input className="m-input" placeholder="Phase name" value={m.phase} onChange={e => setMile(i, 'phase', e.target.value)} />
                      <input className="m-input m-input--mono" placeholder="Week 1–2" value={m.duration} onChange={e => setMile(i, 'duration', e.target.value)} />
                    </div>
                    <button className="m-li-del" onClick={() => delMile(i)} disabled={timeline.length === 1} aria-label="Remove"><i className="ph ph-x-circle"></i></button>
                  </div>
                ))}
                <button className="m-btn m-btn--soft" onClick={addMile}><i className="ph ph-plus"></i> Add phase</button>
              </div>
            </div>
          ) : null}

          {/* Terms */}
          {sections.terms ? (
            <div className="m-form-card">
              <div className="m-form-card-title">Terms &amp; conditions</div>
              <textarea className="m-textarea" value={termsText} onChange={e => setTermsText(e.target.value)} placeholder="Payment terms, validity, scope-change policy…"></textarea>
              <div className="m-snips">
                <span className="lbl">Quick fill:</span>
                {MP_TERMS.map(s => <button key={s.label} className="m-snip" onClick={() => setTermsText(s.text)}>{s.label}</button>)}
              </div>
            </div>
          ) : null}

          {/* Acceptance */}
          {sections.acceptance ? (
            <div className="m-form-card">
              <div className="m-form-card-title">Acceptance</div>
              <p className="m-hint" style={{ margin: 0 }}>A signature block for the client and date is added to the proposal — it prints as signing lines.</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="m-actionbar">
        <button className="m-btn m-btn--ghost" onClick={() => setPreviewOpen(true)}><i className="ph ph-eye"></i> Preview</button>
        <button className="m-btn m-btn--primary" onClick={save}><i className="ph ph-floppy-disk"></i> Save</button>
      </div>

      {previewOpen ? (
        <window.Sheet title="Preview" onClose={() => setPreviewOpen(false)}
          foot={<button className="m-btn m-btn--primary" onClick={() => window.print()}><i className="ph ph-file-pdf"></i> Export PDF</button>}>
          <MProposalDoc data={docData} />
        </window.Sheet>
      ) : null}
    </React.Fragment>
  );
}

window.MProposalDoc = MProposalDoc;
window.ProposalEditorScreen = ProposalEditorScreen;
