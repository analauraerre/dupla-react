import { useState, useRef } from 'react';
import { C, Sx, USERS, MONTHS_FULL } from '../../utils/constants';
import { today, todayStr } from '../../utils/formatters';
import AreaChartSVG from '../charts/AreaChartSVG';

export default function HomeTab({
  selMonth, selYear, setSelMonth, setSelYear,
  categories, incomeCategories, creditCards,
  filtExp, filtInc, totExp, totInc, totSav, totBudget, balance,
  effBudgets, expByCat, annualData, daysInMonth, dayNow, projected, alerts,
  getCat, fmt, fmtK, paymentMethods, notes, noteKey,
  addExpense, addIncomeQuick, updateNote, saveNote, setTab,
}) {
  const [qDesc,   setQDesc]   = useState('');
  const [qAmount, setQAmount] = useState('');
  const [qCat,    setQCat]    = useState(categories[0]?.name || '');
  const [qIncCat, setQIncCat] = useState(incomeCategories[0]?.name || '');
  const [qUser,   setQUser]   = useState('Ana');
  const [qDate,   setQDate]   = useState(todayStr);
  const [qMode,   setQMode]   = useState('expense');
  const [qPay,    setQPay]    = useState('Efectivo');
  const [qInst,   setQInst]   = useState(1);
  const [qSuccess, setQSuccess] = useState(false);
  const [qError,   setQError]   = useState('');
  const [showCardPicker,    setShowCardPicker]    = useState(false);
  const [dismissedAlerts,   setDismissedAlerts]   = useState([]);
  const qDescRef = useRef(null);

  const isCard = !['Efectivo','Débito'].includes(qPay);

  const submitQuickAdd = () => {
    if (!qAmount || parseFloat(qAmount) <= 0) { setQError('Ingresá un monto'); return; }
    setQError('');
    if (qMode === 'expense') {
      addExpense({ id: Date.now(), description: qDesc.trim(), amount: parseFloat(qAmount), category: qCat, user: qUser, date: qDate, tags: [], paymentMethod: qPay, installments: parseInt(qInst) || 1 });
    } else {
      const d = new Date(qDate);
      addIncomeQuick({ id: Date.now(), description: qDesc.trim(), amount: parseFloat(qAmount), user: qUser, incomeCategory: qIncCat, month: d.getMonth(), year: d.getFullYear() });
    }
    setQDesc(''); setQAmount(''); setQInst(1); setQSuccess(true);
    setTimeout(() => setQSuccess(false), 1600);
  };

  return (
    <div>
      {/* Alerts */}
      {alerts.filter(a => !dismissedAlerts.includes(a.name)).map(a => (
        <div key={a.name} style={{display:'flex',alignItems:'center',gap:10,background:a.pct>=100?C.coralL:C.goldL,border:`1px solid ${a.pct>=100?C.coralM:C.gold+'55'}`,borderRadius:14,padding:'10px 14px',marginBottom:10}}>
          <span style={{fontSize:18}}>{a.icon}</span>
          <div style={{flex:1,fontSize:13,color:C.gray1}}><strong>{a.name}</strong>: {a.pct>=100?`excedido en ${fmt(a.spent-a.budget)}`:`${a.pct}% del presupuesto`}</div>
          <span style={{fontWeight:800,fontSize:13,color:a.pct>=100?C.coral:C.peach}}>{a.pct}%</span>
          <button onClick={()=>setDismissedAlerts(d=>[...d,a.name])} style={{width:22,height:22,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',fontSize:14,color:a.pct>=100?C.coral:C.peach,flexShrink:0}}>×</button>
        </div>
      ))}

      {/* Quick entry */}
      <div style={{background:C.white,borderRadius:24,padding:'22px 20px',marginBottom:14,boxShadow:'0 2px 16px rgba(0,0,0,0.07)'}}>
        <div style={{display:'flex',background:C.gray6,borderRadius:14,padding:4,marginBottom:20,gap:4}}>
          {[{id:'expense',label:'↓ Egreso',color:C.coral},{id:'income',label:'↑ Ingreso',color:C.sage}].map(m=>(
            <button key={m.id} onClick={()=>setQMode(m.id)} style={{flex:1,padding:'10px 0',borderRadius:10,border:'none',fontWeight:700,fontSize:14,cursor:'pointer',background:qMode===m.id?C.white:'transparent',color:qMode===m.id?m.color:C.gray3,boxShadow:qMode===m.id?'0 1px 8px rgba(0,0,0,0.08)':'none'}}>{m.label}</button>
          ))}
        </div>

        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:600,color:C.gray3,marginBottom:6,textTransform:'uppercase',letterSpacing:1}}>Monto</div>
          <div style={{position:'relative',display:'inline-flex',alignItems:'center'}}>
            <span style={{fontSize:26,fontWeight:700,color:C.gray4,marginRight:4}}>$</span>
            <input type="number" placeholder="0" value={qAmount} onChange={e=>setQAmount(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&qDescRef.current){e.preventDefault();qDescRef.current.focus();}}}
              style={{width:180,border:'none',borderBottom:`2px solid ${qMode==='expense'?C.coral:C.sage}`,background:'transparent',fontSize:36,fontWeight:900,color:C.gray1,textAlign:'center',outline:'none',padding:'0 4px'}}/>
          </div>
        </div>

        <input ref={qDescRef} style={{...Sx.inp,marginBottom:12,fontSize:15}} placeholder={qMode==='expense'?'¿En qué gastaste? (opcional)':'¿De dónde viene? (opcional)'} value={qDesc} onChange={e=>setQDesc(e.target.value)}/>

        {qMode==='income' && (
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
            {incomeCategories.map(c=>(
              <button key={c.name} onClick={()=>setQIncCat(c.name)} style={{padding:'5px 10px',borderRadius:20,border:`1.5px solid ${qIncCat===c.name?c.color:C.border}`,background:qIncCat===c.name?c.bg:C.white,color:qIncCat===c.name?c.color:C.gray3,fontSize:12,fontWeight:qIncCat===c.name?700:500,cursor:'pointer'}}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        )}

        {qMode==='expense' && (
          <div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
              {categories.slice(0,5).map(c=>(
                <button key={c.name} onClick={()=>setQCat(c.name)} style={{padding:'5px 10px',borderRadius:20,border:`1.5px solid ${qCat===c.name?c.color:C.border}`,background:qCat===c.name?c.bg:C.white,color:qCat===c.name?c.color:C.gray3,fontSize:12,fontWeight:qCat===c.name?700:500,cursor:'pointer'}}>
                  {c.icon} {c.name}
                </button>
              ))}
              <select style={{padding:'5px 10px',borderRadius:20,border:`1.5px solid ${!categories.slice(0,5).map(c=>c.name).includes(qCat)?C.coral:C.border}`,background:!categories.slice(0,5).map(c=>c.name).includes(qCat)?C.coralL:C.white,color:!categories.slice(0,5).map(c=>c.name).includes(qCat)?C.coral:C.gray3,fontSize:12,cursor:'pointer'}}
                value={categories.slice(0,5).map(c=>c.name).includes(qCat)?'':qCat} onChange={e=>e.target.value&&setQCat(e.target.value)}>
                <option value=''>Más…</option>
                {categories.slice(5).map(c=><option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:C.gray3,marginBottom:6,textTransform:'uppercase',letterSpacing:0.8}}>Medio de pago</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {['Efectivo','Débito'].map(pm=>{
                  const isSelected=qPay===pm;
                  return <button key={pm} onClick={()=>{setQPay(pm);setQInst(1);setShowCardPicker(false);}} style={{padding:'6px 12px',borderRadius:20,border:`1.5px solid ${isSelected?C.sage:C.border}`,background:isSelected?C.sageL:C.white,color:isSelected?C.sage:C.gray3,fontSize:12,fontWeight:isSelected?700:500,cursor:'pointer'}}>{pm==='Efectivo'?'💵 ':'🏦 '}{pm}</button>;
                })}
                {creditCards.length===0?(
                  <button disabled style={{padding:'6px 12px',borderRadius:20,border:`1.5px dashed ${C.border}`,background:C.gray6,color:C.gray4,fontSize:12,cursor:'pointer'}} title="Primero agregá una tarjeta">💳 Tarjeta →</button>
                ):(
                  <div style={{position:'relative'}}>
                    <button onClick={()=>setShowCardPicker(v=>!v)} style={{padding:'6px 12px',borderRadius:20,border:`1.5px solid ${isCard?C.lavender:C.border}`,background:isCard?C.lavL:C.white,color:isCard?C.lavender:C.gray3,fontSize:12,fontWeight:isCard?700:500,cursor:'pointer'}}>
                      💳 {isCard?qPay:'Tarjeta'} {showCardPicker?'▲':'▼'}
                    </button>
                    {showCardPicker&&(
                      <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,background:C.white,borderRadius:14,boxShadow:'0 4px 20px rgba(0,0,0,0.12)',border:`1px solid ${C.border}`,zIndex:30,minWidth:160,padding:6}}>
                        {creditCards.map(card=>(
                          <button key={card.id} onClick={()=>{setQPay(card.name);setShowCardPicker(false);}} style={{display:'block',width:'100%',padding:'9px 12px',border:'none',background:qPay===card.name?C.lavL:'transparent',color:qPay===card.name?C.lavender:C.gray1,fontSize:13,fontWeight:qPay===card.name?700:500,cursor:'pointer',borderRadius:10,textAlign:'left'}}>
                            💳 {card.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isCard&&(
              <div style={{marginBottom:12,background:C.lavL,borderRadius:14,padding:'12px 14px',border:`1px solid ${C.lavender}33`}}>
                <div style={{fontSize:11,fontWeight:600,color:C.lavender,marginBottom:8,textTransform:'uppercase',letterSpacing:0.8}}>¿En cuántas cuotas?</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {[1,2,3,6,9,12,18,24].map(n=>(
                    <button key={n} onClick={()=>setQInst(n)} style={{width:42,height:36,borderRadius:10,border:`1.5px solid ${qInst===n?C.lavender:C.border}`,background:qInst===n?C.lavender:C.white,color:qInst===n?C.white:C.gray2,fontSize:13,fontWeight:qInst===n?700:500,cursor:'pointer'}}>{n===1?'1x':`${n}x`}</button>
                  ))}
                </div>
                {qInst>1&&qAmount&&<div style={{marginTop:8,fontSize:13,color:C.lavender,fontWeight:600}}>{fmt(parseFloat(qAmount)/qInst)}/mes durante {qInst} meses</div>}
              </div>
            )}
          </div>
        )}

        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <select style={{...Sx.inp,flex:1}} value={qUser} onChange={e=>setQUser(e.target.value)}>
            {USERS.map(u=><option key={u}>{u}</option>)}
          </select>
          <input type="date" style={{...Sx.inp,flex:2}} value={qDate} onChange={e=>setQDate(e.target.value)}/>
        </div>

        {qError&&<div style={{textAlign:'center',marginBottom:10,fontSize:13,color:C.coral,fontWeight:600}}>⚠ {qError}</div>}
        {qSuccess?(
          <div style={{textAlign:'center',padding:'14px 0',fontSize:16,fontWeight:700,color:C.sage}}>✓ Registrado!</div>
        ):(
          <button onClick={submitQuickAdd} style={{width:'100%',padding:'15px',background:qMode==='expense'?C.coral:C.sage,color:C.white,border:'none',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer'}}>
            {qMode==='expense'?'Registrar egreso':'Registrar ingreso'}
          </button>
        )}
      </div>

      {/* Mini summary */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
        {[{label:'Ingresos',value:totInc,color:C.sage,bg:C.sageL},{label:'Egresos',value:totExp,color:C.coral,bg:C.coralL},{label:'Ahorros',value:totSav,color:C.lavender,bg:C.lavL},{label:'Balance',value:balance,color:balance>=0?C.sage:C.coral,bg:balance>=0?C.sageL:C.coralL}].map(k=>(
          <div key={k.label} style={{background:k.bg,borderRadius:16,padding:'14px 16px'}}>
            <div style={{fontSize:11,color:k.color,fontWeight:600,marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:20,fontWeight:900,color:C.gray1}}>{fmtK(k.value)}</div>
          </div>
        ))}
      </div>

      {/* Quick access */}
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <button onClick={()=>setTab('charts')} style={{flex:1,display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:C.skyL,border:`1px solid ${C.sky}33`,borderRadius:16,cursor:'pointer'}}>
          <span style={{fontSize:20}}>◉</span>
          <div style={{textAlign:'left'}}><div style={{fontWeight:700,fontSize:13,color:C.gray1}}>Gráficos</div><div style={{fontSize:11,color:C.gray3}}>Ver tendencias</div></div>
        </button>
        <button onClick={()=>setTab('cards')} style={{flex:1,display:'flex',alignItems:'center',gap:10,padding:'12px 14px',background:C.lavL,border:`1px solid ${C.lavender}33`,borderRadius:16,cursor:'pointer'}}>
          <span style={{fontSize:20}}>💳</span>
          <div style={{textAlign:'left'}}><div style={{fontWeight:700,fontSize:13,color:C.gray1}}>Tarjetas</div><div style={{fontSize:11,color:C.gray3}}>Cuotas y gastos</div></div>
        </button>
      </div>

      {/* Prediction */}
      {selMonth===today.getMonth()&&selYear===today.getFullYear()&&totExp>0&&dayNow<daysInMonth&&(
        <div style={{background:C.peachL,borderRadius:16,padding:'14px 16px',marginBottom:14,display:'flex',alignItems:'center',gap:12}}>
          <div style={{fontSize:22}}>📈</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:C.gray1}}>Proyección fin de mes</div>
            <div style={{fontSize:12,color:C.gray3,marginTop:2}}>A este ritmo: <strong style={{color:projected>totBudget?C.coral:C.gray1}}>{fmt(projected)}</strong>{projected>totBudget?' · superaría el presupuesto ⚠':''}</div>
          </div>
        </div>
      )}

      {/* Budget quick */}
      {totBudget>0&&(
        <div style={Sx.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={Sx.ct}>Presupuesto del mes</div>
            <button onClick={()=>setTab('budget')} style={{fontSize:12,color:C.coral,fontWeight:600,background:'none',border:'none',cursor:'pointer'}}>Ver todo →</button>
          </div>
          <div style={{height:8,background:C.gray5,borderRadius:8,overflow:'hidden',marginBottom:8}}>
            <div style={{width:`${Math.min((totExp/totBudget)*100,100)}%`,height:'100%',background:totExp>totBudget?C.coral:C.sage,borderRadius:8}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.gray3}}>
            <span>{fmt(totExp)} gastado</span>
            <span style={{fontWeight:700,color:totExp>totBudget?C.coral:C.gray2}}>{totBudget?Math.round((totExp/totBudget)*100):0}%</span>
            <span>de {fmt(totBudget)}</span>
          </div>
        </div>
      )}

      {/* Annual chart */}
      <div style={Sx.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={Sx.ct}>Año {selYear}</div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>setSelYear(y=>y-1)} style={{padding:'3px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:C.white,cursor:'pointer',fontSize:12,color:C.gray3}}>‹</button>
            <button onClick={()=>setSelYear(y=>y+1)} style={{padding:'3px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:C.white,cursor:'pointer',fontSize:12,color:C.gray3}}>›</button>
          </div>
        </div>
        <AreaChartSVG data={annualData} height={130}/>
        <div style={{display:'flex',gap:3,marginTop:10,overflowX:'auto',paddingBottom:2}}>
          {annualData.map(d=>{
            const isActive=d.mo===selMonth;
            const over=d.Egresos>d.Ingresos&&d.Ingresos>0;
            return(
              <button key={d.mo} onClick={()=>setSelMonth(d.mo)} style={{flex:1,minWidth:26,padding:'5px 2px',borderRadius:8,border:`2px solid ${isActive?C.coral:'transparent'}`,background:isActive?C.coralL:'transparent',cursor:'pointer'}}>
                <div style={{fontSize:9,color:isActive?C.coral:C.gray3,fontWeight:isActive?700:400}}>{d.name}</div>
                <div style={{width:5,height:5,borderRadius:'50%',margin:'3px auto 0',background:!(d.Egresos||d.Ingresos)?C.gray5:over?C.coral:C.sage}}/>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent expenses */}
      <div style={Sx.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={Sx.ct}>Últimos egresos</div>
          <button onClick={()=>setTab('expenses')} style={{fontSize:12,color:C.coral,fontWeight:600,background:'none',border:'none',cursor:'pointer'}}>Ver todos →</button>
        </div>
        {[...filtExp].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4).map(e=>{
          const cat=getCat(e.category);
          const isCardPay=!['Efectivo','Débito'].includes(e.paymentMethod||'Efectivo');
          return(
            <div key={e.id} style={Sx.txrow}>
              <div style={{...Sx.dot,background:cat.bg,fontSize:17}}>{cat.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,color:C.gray1}}>{e.description}</div>
                <div style={{display:'flex',gap:5,alignItems:'center',marginTop:2,flexWrap:'wrap'}}>
                  <span style={{fontSize:11,color:C.gray2}}>{e.user==='Ana'?'👩':'👨'} {e.user}</span>
                  {isCardPay?<span style={{fontSize:10,background:C.lavL,color:C.lavender,padding:'1px 7px',borderRadius:6,fontWeight:600}}>💳 {e.paymentMethod}{(e.installments||1)>1?` ${e.installments}x`:''}</span>
                    :<span style={{fontSize:10,background:C.sageL,color:C.sage,padding:'1px 7px',borderRadius:6,fontWeight:600}}>{e.paymentMethod||'Efectivo'}</span>}
                </div>
              </div>
              <div style={{fontWeight:800,fontSize:15,color:C.gray1}}>{fmt(e.amount)}</div>
            </div>
          );
        })}
        {!filtExp.length&&<div style={{textAlign:'center',padding:'20px 0',color:C.gray3,fontSize:14}}>Sin egresos este mes</div>}
      </div>

      {/* Note */}
      <div style={Sx.card}>
        <div style={Sx.ct}>📝 Nota del mes</div>
        <textarea value={notes[noteKey]||''} onChange={e=>updateNote(e.target.value)} onBlur={saveNote}
          placeholder="Contexto de este mes..." style={{...Sx.inp,minHeight:64,resize:'vertical',lineHeight:1.5}}/>
      </div>
    </div>
  );
}
