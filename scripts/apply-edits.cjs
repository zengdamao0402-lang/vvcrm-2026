const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'src', 'main.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// ===== 1. Replace edit modal with full form =====
const editStart = content.indexOf('{editing && (');
const leadProfileStart = content.indexOf('function LeadProfile');

const newEditModal = `{editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-md" onClick={() => setEditing(null)}>
          <div className="w-full max-w-5xl max-h-[92vh] overflow-auto rounded-[1.75rem] bg-white shadow-command" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><p className="text-xs font-semibold text-slate-400">Edit Inquiry</p><h2 className="text-xl font-semibold text-slate-950">编辑询盘</h2></div>
              <button className="icon-button" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl bg-[#0F172A] p-5 text-white">
                <p className="text-sm font-semibold">记录 JSON 预览</p>
                <pre className="mt-4 overflow-auto rounded-2xl bg-white/8 p-4 text-xs leading-6 text-sky-100">{JSON.stringify(editing.data, null, 2)}</pre>
              </div>
              <div className="space-y-4">
                {/* Customer Info */}
                <fieldset className="rounded-2xl border border-slate-200 p-3">
                  <legend className="px-2 text-xs font-semibold text-slate-500">客户信息</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["full_name", "联系人 *"],
                      ["company_cn", "公司名称（中文）"],
                      ["company_en", "Company (English)"],
                      ["title", "职位"],
                      ["phone", "电话"],
                      ["email", "邮箱"],
                      ["whatsapp", "WhatsApp"],
                      ["qualification", "客户资质"],
                    ].map(([k, label]) => (
                      <label key={k} className={k === "company_cn" || k === "company_en" || k === "qualification" ? "col-span-2" : ""}>
                        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                        <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data[k] || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, [k]: e.target.value } }))} placeholder={k === "qualification" ? "采购记录/进口许可证" : ""} />
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Demand Details */}
                <fieldset className="rounded-2xl border border-slate-200 p-3">
                  <legend className="px-2 text-xs font-semibold text-slate-500">需求详情</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["brand", "品牌"],
                      ["year", "年款"],
                    ].map(([k, label]) => (
                      <label key={k} className="block">
                        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                        <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data[k] || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, [k]: e.target.value } }))} />
                      </label>
                    ))}
                    <label className="col-span-2">
                      <span className="text-[11px] font-semibold text-slate-500">车型 * (多个用逗号分隔)</span>
                      <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data.target_model || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, target_model: e.target.value } }))} placeholder="如 BYD Qin L, Toyota Corolla" />
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-500">动力类型</span>
                      <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data.power_type || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, power_type: e.target.value } }))}>
                        <option value="">请选择</option>
                        <option value="燃油">燃油</option>
                        <option value="纯电">纯电</option>
                        <option value="混动">混动</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-500">方向盘</span>
                      <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data.steering || "LHD"} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, steering: e.target.value } }))}>
                        <option value="LHD">LHD (左舵)</option>
                        <option value="RHD">RHD (右舵)</option>
                      </select>
                    </label>
                    {[
                      ["color", "颜色"],
                      ["quantity", "意向台数"],
                      ["moq", "MOQ"],
                    ].map(([k, label]) => (
                      <label key={k} className="block">
                        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                        <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" type={k === "quantity" || k === "moq" ? "number" : "text"} value={editing.data[k] || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, [k]: e.target.value } }))} />
                      </label>
                    ))}
                    <label className="col-span-2">
                      <span className="text-[11px] font-semibold text-slate-500">VIN 码 (多个用逗号分隔)</span>
                      <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data.vin || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, vin: e.target.value } }))} placeholder="多个VIN用逗号分隔" />
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-500">Trade Terms</span>
                      <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data.trade_terms || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, trade_terms: e.target.value } }))}>
                        <option value="">请选择</option>
                        <option value="FCA">FCA (货交承运人)</option>
                        <option value="FOB">FOB (装运港船上交货)</option>
                        <option value="CFR">CFR (成本加运费)</option>
                        <option value="CIF">CIF (到岸价)</option>
                        <option value="EXW">EXW (工厂交货)</option>
                        <option value="DAP">DAP (目的地交货)</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-500">目标单价</span>
                      <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" type="number" value={editing.data.target_price || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, target_price: e.target.value } }))} />
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-500">货币</span>
                      <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data.currency || "USD"} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, currency: e.target.value } }))}>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="CNY">CNY</option>
                        <option value="RUB">RUB</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-slate-500">交货期</span>
                      <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" type="date" value={editing.data.delivery_date || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, delivery_date: e.target.value } }))} />
                    </label>
                    {editing.type === 'lead' && (
                      <label className="block">
                        <span className="text-[11px] font-semibold text-slate-500">阶段</span>
                        <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data.stage || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, stage: e.target.value } }))}>
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </label>
                    )}
                  </div>
                </fieldset>

                {/* Source & Notes */}
                <fieldset className="rounded-2xl border border-slate-200 p-3">
                  <legend className="px-2 text-xs font-semibold text-slate-500">来源与备注</legend>
                  <div className="space-y-3">
                    {[
                      ["lead_source", "来源渠道"],
                      ["destination_country", "目标国家 *"],
                      [editing.type === 'lead' ? "destination_port" : "port", "目的港"],
                      ["competitor", "竞争对手"],
                    ].map(([k, label]) => (
                      <label key={k} className="block">
                        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                        <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data[k] || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, [k]: e.target.value } }))} />
                      </label>
                    ))}
                    {editing.type === 'inquiry' && (
                      <>
                        <label className="block">
                          <span className="text-[11px] font-semibold text-slate-500">询盘备注</span>
                          <textarea className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" rows={3} value={editing.data.event_note || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, event_note: e.target.value } }))} />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="text-[11px] font-semibold text-slate-500">渠道</span>
                            <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data.channel || ""} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, channel: e.target.value } }))}>
                              <option value="">-</option>
                              {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold text-slate-500">状态</span>
                            <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" value={editing.data.status || "pending"} onChange={(e) => setEditing((prev) => ({ ...prev, data: { ...prev.data, status: e.target.value } }))}>
                              <option value="pending">待处理</option>
                              <option value="已跟进">已跟进</option>
                              <option value="已报价">已报价</option>
                              <option value="确认订单">确认订单</option>
                              <option value="签订合同">签订合同</option>
                              <option value="已付款">已付款</option>
                              <option value="已发货">已发货</option>
                              <option value="丢失">丢失</option>
                            </select>
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </fieldset>

                <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] px-5 py-4 text-sm font-semibold text-white shadow-blueglow transition hover:opacity-90" onClick={handleSaveEdit}>
                  保存更改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}`;

content = content.substring(0, editStart) + newEditModal + '\n' + content.substring(leadProfileStart);

// ===== 2. Replace openEdit =====
const openEditStart = content.indexOf('function openEdit');
const handleSaveStart = content.indexOf('async function handleSaveEdit');

const newOpenEdit = `async function openEdit(item) {
    if (view === 'inquiries') {
      const matchingLead = leads.find(l => l.full_name === item.full_name && l.destination_country === item.destination_country);
      const mergedData = matchingLead ? { ...matchingLead, ...item } : { ...item };
      setEditing({ type: 'inquiry', data: mergedData });
    } else {
      setEditing({ type: 'lead', data: { ...item } });
    }
  }`;

content = content.substring(0, openEditStart) + newOpenEdit + '\n\n  ' + content.substring(handleSaveStart);

// ===== 3. Replace handleSaveEdit =====
const hseStart = content.indexOf('async function handleSaveEdit');
const hseEnd = content.indexOf('setEditing(null);', hseStart) + 18;
const restAfter = content.indexOf('\n', hseEnd);

const newHandleSave = `async function handleSaveEdit() {
    if (!editing) return;
    const { type, data } = editing;
    if (type === 'inquiry') {
      await onUpdateInquiry(data.id, {
        full_name: data.full_name,
        company_cn: data.company_cn || '',
        company_en: data.company_en || '',
        destination_country: data.destination_country,
        port: data.port || data.destination_port || '',
        target_model: data.target_model,
        vin: data.vin || '',
        quantity: data.quantity || '',
        trade_terms: data.trade_terms || '',
        event_note: data.event_note || '',
        channel: data.channel || data.lead_source || '',
        status: data.status || 'pending',
      });
      const matchingLead = leads.find(l => l.full_name === data.full_name && l.destination_country === data.destination_country);
      if (matchingLead) {
        await onUpdateLead(matchingLead.id, {
          full_name: data.full_name,
          company_cn: data.company_cn || '',
          company_en: data.company_en || '',
          title: data.title || '',
          phone: data.phone || '',
          email: data.email || '',
          whatsapp: data.whatsapp || '',
          qualification: data.qualification || '',
          destination_country: data.destination_country,
          destination_port: data.destination_port || data.port || '',
          brand: data.brand || '',
          target_model: data.target_model,
          year: data.year || '',
          power_type: data.power_type || '',
          steering: data.steering || 'LHD',
          color: data.color || '',
          vin: data.vin || '',
          quantity: data.quantity || '',
          moq: data.moq || '',
          target_price: data.target_price || '',
          currency: data.currency || 'USD',
          trade_terms: data.trade_terms || '',
          delivery_date: data.delivery_date || '',
          lead_source: data.lead_source || data.channel || '',
          competitor: data.competitor || '',
          stage: data.stage || '',
        });
      }
    } else if (type === 'lead') {
      await onUpdateLead(data.id, {
        full_name: data.full_name,
        company_cn: data.company_cn || '',
        company_en: data.company_en || '',
        title: data.title || '',
        phone: data.phone || '',
        email: data.email || '',
        whatsapp: data.whatsapp || '',
        qualification: data.qualification || '',
        destination_country: data.destination_country,
        destination_port: data.destination_port || '',
        brand: data.brand || '',
        target_model: data.target_model,
        year: data.year || '',
        power_type: data.power_type || '',
        steering: data.steering || 'LHD',
        color: data.color || '',
        vin: data.vin || '',
        quantity: data.quantity || '',
        moq: data.moq || '',
        target_price: data.target_price || '',
        currency: data.currency || 'USD',
        trade_terms: data.trade_terms || '',
        delivery_date: data.delivery_date || '',
        lead_source: data.lead_source || '',
        competitor: data.competitor || '',
        stage: data.stage || '',
      });
    }
    setEditing(null);`;

content = content.substring(0, hseStart) + newHandleSave + content.substring(restAfter);

fs.writeFileSync(filePath, content, 'utf8');
console.log('All 3 replacements done');