import { useState, useMemo, useEffect } from "react";
import { useData } from "./DataProvider";
import DashboardLayout from "./components/DashboardLayout";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./components/ui/command";
import { Checkbox } from "./components/ui/checkbox";
import { X, ChevronDown } from "lucide-react";
import { FonteBadge } from "./components/ui/FonteBadge";

const fmt = (v: number) => isNaN(v) ? "R$ 0" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0,maximumFractionDigits:0}).format(v||0);



const fmtK = (v: number) => !v||isNaN(v) ? "—" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",notation:"compact",maximumFractionDigits:1}).format(v);
const pct = (a:number,b:number) => b>0 ? ((a/b)*100).toFixed(1)+"%" : "0%";

const SEMAFOR: Record<string,{bg:string;border:string;color:string;label:string;icon:string}> = {
  verde:        {bg:"#dcfce7",border:"#86efac",color:"#166534",label:"Ressarcido",icon:"●"},
  a_ressarcir:  {bg:"#fee2e2",border:"#fca5a5",color:"#991b1b",label:"A Ressarcir",icon:"○"},
  pendente:     {bg:"#fffbeb",border:"#fde68a",color:"#92400e",label:"Aguardando Financeiro",icon:"⊖"},
};


export function getRecordStatus(d: any) {
  const isEmenda = d.fonte === "Emenda";
  const emp = Number(d.empenhado) || 0;
  const pago = Number(d.total_pago_tg) || 0;
  
  let resVal: number | null = null;
  let aResVal: number | null = null;
  
  if (isEmenda) {
    const a = Number(d.a_ressarcir) || 0;
    const r = Number(d.ressarcido) || 0;
    const canHaveRessarcir = (emp > 0 && pago > 0);
    resVal = r > 0 ? r / 2 : null;
    aResVal = (a > 0 && canHaveRessarcir) ? a / 2 : null;
  } else {
    if (d.semaforo === 'verde') {
      resVal = pago / 2;
    } else if (emp > 0 && pago > 0) {
      aResVal = pago / 2;
    }
  }
  
  const isRessarcido = resVal !== null;
  const isARessarcir = aResVal !== null;
  
  if (isRessarcido) return "verde";
  if (isARessarcir) return "a_ressarcir";
  return "pendente";
}



function MultiSel({label,opts,sel,set,isMobile}:{label:string;opts:string[];sel:string[];set:(v:string[])=>void;isMobile?:boolean}) {
  const [expanded, setExpanded] = useState(false);

  if (isMobile) {
    return (
      <div style={{display:"flex",flexDirection:"column",gap:4,width:"100%"}}>
        <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>{label}</span>
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{
            display:"flex",
            alignItems:"center",
            justifyContent:"space-between",
            padding:"8px 12px",
            border:"1px solid #d1d5db",
            borderRadius:8,
            background:"white",
            fontSize:12,
            cursor:"pointer",
            width:"100%"
          }}
        >
          <span style={{fontWeight:600, color:"#1e293b"}}>{sel.length>0?`${sel.length} selecionado(s)`:"Todos"}</span>
          <span style={{fontSize:10, color:"#64748b"}}>{expanded ? "▲" : "▼"}</span>
        </button>
        {expanded && (
          <div style={{
            border:"1px solid #e2e8f0",
            borderRadius:8,
            padding:10,
            maxHeight:"200px",
            overflowY:"auto",
            background:"#f8fafc",
            display:"flex",
            flexDirection:"column",
            gap:8,
            marginTop:4
          }}>
            {opts.length>0&&(
              <div 
                onClick={()=>set(sel.length===opts.length?[]:[...opts])}
                style={{
                  display:"flex",
                  alignItems:"center",
                  gap:8,
                  padding:"6px 8px",
                  borderRadius:4,
                  background:"#eff6ff",
                  cursor:"pointer",
                  fontSize:11,
                  fontWeight:700,
                  color:"#2563eb"
                }}
              >
                <input 
                  type="checkbox" 
                  checked={sel.length===opts.length&&opts.length>0} 
                  readOnly 
                  style={{cursor:"pointer"}}
                />
                <span>Selecionar Todos</span>
              </div>
            )}
            {opts.map(o=>(
              <div 
                key={o}
                onClick={()=>set(sel.includes(o)?sel.filter(x=>x!==o):[...sel,o])}
                style={{
                  display:"flex",
                  alignItems:"center",
                  gap:8,
                  padding:"4px 8px",
                  cursor:"pointer",
                  fontSize:11,
                  color:"#374151"
                }}
              >
                <input 
                  type="checkbox" 
                  checked={sel.includes(o)} 
                  readOnly 
                  style={{cursor:"pointer"}}
                />
                <span>{o}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center",width:"auto"}}>
      <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 10px",border:"1px solid #d1d5db",borderRadius:6,background:"white",fontSize:11,cursor:"pointer",width:168,gap:4}}>
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sel.length>0?`${sel.length} selecionado(s)`:"Todos"}</span>
            <ChevronDown size={13} style={{opacity:0.5,flexShrink:0}}/>
          </button>
        </PopoverTrigger>
        <PopoverContent style={{width:200,padding:0}}>
          <Command>
            <CommandInput placeholder="Buscar…"/>
            {opts.length>0&&(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderBottom:"1px solid #f1f5f9",background:"#f8fafc",cursor:"pointer"}}
                onClick={()=>set(sel.length===opts.length?[]:[...opts])}>
                <Checkbox checked={sel.length===opts.length&&opts.length>0} style={{pointerEvents:"none"}}/>
                <span style={{fontSize:12,fontWeight:700,color:"#2563eb"}}>Todos</span>
              </div>
            )}
            <CommandList style={{ maxHeight: "250px", overflowY: "auto" }}>
              <CommandEmpty>Nenhum.</CommandEmpty>
              <CommandGroup>
                {opts.map(o=>(
                  <CommandItem key={o} value={o} onSelect={()=>set(sel.includes(o)?sel.filter(x=>x!==o):[...sel,o])} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                    <Checkbox checked={sel.includes(o)} style={{pointerEvents:"none"}}/>
                    <span style={{fontSize:11}}>{o}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function KpiCard({title,value,sub,color,icon}:{title:React.ReactNode;value:string;sub?:string;color:string;icon:string}) {
  return (
    <div style={{background:"white",borderRadius:10,border:"1px solid #e2e8f0",borderLeft:`4px solid ${color}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",padding:"12px 14px"}}>
      <div style={{fontSize:9,fontWeight:600,color:"#64748b",letterSpacing:"0.04em",display:"flex",alignItems:"center",gap:4,flexWrap:"nowrap",whiteSpace:"nowrap",overflow:"hidden"}}>
        <span style={{fontSize:16}}>{icon}</span> {title}
      </div>
      <div style={{fontSize:20,fontWeight:800,color:"#0f172a",marginTop:5,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{sub}</div>}
    </div>
  );
}

export function calcUnidadeValues(d: any) {
  // Para Emendas, confiamos 100% no dado do backend (build_data.py)
  if (d.fonte === "Emenda") {
    const a = Number(d.a_ressarcir) || 0;
    const r = Number(d.ressarcido) || 0;
    const emp = Number(d.empenhado) || 0;
    const pago = Number(d.total_pago_tg) || 0;
    
    // Regra solicitada: só entra o valor "a ressarcir" quando houver empenho e pagamento juntos
    const canHaveRessarcir = (emp > 0 && pago > 0);

    return {
      aRessarcirVal: (a > 0 && canHaveRessarcir) ? a / 2 : null,
      ressarcidoVal: r > 0 ? r / 2 : null,
    };
  }

  // Para TED, mantemos a lógica clássica da interface (que baseia no TG)
  const sem = d.semaforo;
  const pago = Number(d.total_pago_tg) || 0;
  const emp = Number(d.empenhado) || 0;

  let aRessarcirVal: number | null = null;
  let ressarcidoVal: number | null = null;

  if (sem === 'verde') {
    ressarcidoVal = pago / 2;
    aRessarcirVal = null;
  } else if (emp > 0 && pago > 0) {
    aRessarcirVal = pago / 2;
    ressarcidoVal = null;
  } else {
    aRessarcirVal = null;
    ressarcidoVal = null;
  }

  return { aRessarcirVal, ressarcidoVal };
}

function ProcessCard({ d, sem, aRessarcirVal, ressarcidoVal }: { d: any; sem: any; aRessarcirVal: number | null; ressarcidoVal: number | null }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      style={{
        background: "white",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        borderLeft: `5px solid ${sem.color}`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
    >
      {/* Linha Superior: Status e ND */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 12,
          border: `1px solid ${sem.border}`,
          background: sem.bg,
          color: sem.color,
          fontSize: 10,
          fontWeight: 700
        }}>
          {sem.icon} {sem.label}
        </span>
        <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 700 }}>
          {d.nd_ressarcimento || d.nc_nd ? `ND: ${d.nd_ressarcimento || d.nc_nd}` : "Sem ND"}
        </span>
      </div>

      {/* Linha do Meio: SEI e Unidade */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#475569", marginBottom: 12 }}>
        <span style={{ fontWeight: 600 }}>
          Unidade: <span style={{ color: "#0f172a" }}>{d.centro_custo || "—"}</span>
        </span>
        <span style={{ color: "#64748b" }}>
          SEI: {d.sei || "—"}
        </span>
      </div>

      {/* Valores em micro-grade 2x2 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "#f8fafc",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 10,
        gap: "8px 12px"
      }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 9, marginBottom: 1 }}>Empenhado</div>
          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 11 }}>{d.empenhado > 0 ? fmtK(d.empenhado) : "—"}</div>
        </div>
        <div>
          <div style={{ color: "#64748b", fontSize: 9, marginBottom: 1 }}>Pago (TG)</div>
          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 11 }}>{d.total_pago_tg > 0 ? fmtK(d.total_pago_tg) : "—"}</div>
        </div>
        <div>
          <div style={{ color: "#0d9488", fontSize: 9, marginBottom: 1, fontWeight: 600 }}>Ressarcido</div>
          <div style={{ fontWeight: 800, color: "#0d9488", fontSize: 11 }}>{ressarcidoVal !== null ? fmtK(ressarcidoVal) : "—"}</div>
        </div>
        <div>
          <div style={{ color: "#e11d48", fontSize: 9, marginBottom: 1, fontWeight: 600 }}>A Ressarcir</div>
          <div style={{ fontWeight: 800, color: "#e11d48", fontSize: 11 }}>{aRessarcirVal !== null ? fmtK(aRessarcirVal) : "—"}</div>
        </div>
      </div>

      {/* Dica interativa para o usuário */}
      <div style={{ textAlign: "center", fontSize: 9, color: "#94a3b8", marginTop: 8, fontWeight: 600, letterSpacing: "0.02em" }}>
        {expanded ? "🔼 Toque para recolher" : "🔍 Toque para ver detalhes"}
      </div>

      {/* Seção Expandida (Acordeão) */}
      {expanded && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px dashed #e2e8f0",
          fontSize: 10.5,
          color: "#475569",
          display: "flex",
          flexDirection: "column",
          gap: 6
        }}>
          {d.favorecido && (
            <div>
              <span style={{ fontWeight: 600 }}>Favorecido:</span> {d.favorecido}
            </div>
          )}
          {d.num_ted && (
            <div>
              <span style={{ fontWeight: 600 }}>TED:</span> {d.num_ted}
            </div>
          )}
          {d.vigencia && (
            <div>
              <span style={{ fontWeight: 600 }}>Vigência:</span> {d.vigencia.split(' ')[0]}
            </div>
          )}
          {d.ne_key && (
            <div>
              <span style={{ fontWeight: 600 }}>Nota de Empenho (NE):</span> {d.ne_key}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { data: rawData, loading } = useData();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const allData = useMemo(() => {
    return rawData.map((d: any) => {
      let fav = (d.favorecido || "").trim();
      const upperFav = fav.toUpperCase();
      if (upperFav.includes("COMPANHIA DE SANEAMENTO")) {
        fav = "CAESB";
      } else if (upperFav.includes("NEOENERGIA") || upperFav.includes("NEO ENERGIA")) {
        fav = "NEO ENERGIA";
      } else if (upperFav.includes("RCA PRODUTOS")) {
        fav = "RCA";
      }
      return { ...d, favorecido: fav };
    }).filter((d: any) => d.ano >= 2020);
  }, [rawData]);

  const [selUnidade, setSelUnidade] = useState<string[]>([]);
  const [selSemaforo, setSelSemaforo] = useState("all");
  const [selAno, setSelAno] = useState("all");
  const [selFonte, setSelFonte] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const unidades = useMemo(()=>Array.from(new Set(allData.map((d:any)=>(d.centro_custo||"").trim()).filter(Boolean))).sort() as string[],[allData]);
  const anos = useMemo(() => {
    const dataByFonte = selFonte === "all" ? allData : allData.filter((d: any) => d.fonte === selFonte);
    return Array.from(new Set(dataByFonte.map((d: any) => d.ano).filter(Boolean))).sort() as number[];
  }, [allData, selFonte]);

  useEffect(() => {
    if (selAno !== "all" && !anos.includes(Number(selAno))) {
      setSelAno("all");
    }
  }, [anos, selAno]);

  const hasFilter = selUnidade.length>0||selSemaforo!=="all"||selAno!=="all"||selFonte!=="all";

  const filtered = useMemo(()=>{
    return allData.filter((d:any)=>{
      const cc=(d.centro_custo||"").trim();
      if(selUnidade.length>0&&!selUnidade.includes(cc)) return false;
      if(selSemaforo!=="all"&&getRecordStatus(d)!==selSemaforo) return false;
      if(selAno!=="all"&&String(d.ano)!==selAno) return false;
      if(selFonte!=="all"&&d.fonte!==selFonte) return false;
      return true;
    });
  },[allData,selUnidade,selSemaforo,selAno,selFonte]);

  const T = useMemo(()=>{
    const n = (key:string)=>filtered.reduce((s:number,d:any)=>s+(Number(d[key])||0),0);
    const empenhado = n('empenhado');
    const liquidado = n('liquidado');
    const pago_tg     = n('total_pago_tg');
    const rap         = n('total_rap');
    const total_ci    = n('total_ci');

    let ressarcido = 0;
    let a_ressarcir = 0;
    filtered.forEach((d: any) => {
      const { aRessarcirVal, ressarcidoVal } = calcUnidadeValues(d);
      ressarcido += (ressarcidoVal || 0);
      a_ressarcir += (aRessarcirVal || 0);
    });

    const verde    = filtered.filter((d:any)=>d.semaforo==='verde').length;
    const vermelho = filtered.filter((d:any)=>d.semaforo==='vermelho').length;
    const qtd_nes      = new Set(filtered.map((d:any)=>d.ne_key).filter(Boolean)).size;
    const qtd_teds     = new Set(filtered.map((d:any)=>d.num_ted).filter(Boolean)).size;
    const qtd_unidades = new Set(filtered.map((d:any)=>d.centro_custo).filter(Boolean)).size;
    return {empenhado,liquidado,pago_tg,rap,total_ci,ressarcido,a_ressarcir,verde,vermelho,qtd_nes,qtd_teds,qtd_unidades,total:filtered.length};
  },[filtered]);



  const s: Record<string,React.CSSProperties> = {
    panel: {background:"white",borderRadius:10,border:"1px solid #e2e8f0",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"},
    th: {fontSize:10,color:"#64748b",textTransform:"uppercase" as const,letterSpacing:"0.06em",padding:"9px 10px",textAlign:"center" as const,background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontWeight:600},
    td: {padding:"9px 10px",fontSize:11,borderBottom:"1px solid #f1f5f9",verticalAlign:"middle" as const,textAlign:"center" as const},
    sectionTitle: {fontWeight:700,fontSize:14,color:"#0f172a",padding:"14px 16px",borderBottom:"1px solid #e8edf2"},
  };

  const labelFonte = selFonte === "all" ? "TED / Emenda" : selFonte;

  return (
    <DashboardLayout>
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Carregando dados em tempo real...</div>
      ) : (
      <div style={{display:"flex",flexDirection:"column",gap:22}}>

        {/* Header */}
        <div>
          <h1 style={{fontSize:isMobile?20:26,fontWeight:800,color:"#0f172a",margin:0,display:"flex",alignItems:isMobile?"flex-start":"center",flexDirection:isMobile?"column":"row",gap:isMobile?6:10}}>
            Dashboard Custos Indiretos <FonteBadge fonte={selFonte} size={isMobile?"sm":"lg"} />
          </h1>
          <p style={{fontSize:13,color:"#64748b",marginTop:4,margin:"4px 0 0"}}>
            Painel Integrado: Controle Manual + Tesouro Gerencial · {filtered.length} registros
          </p>
        </div>

        {/* FILTERS SECTION */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button 
              onClick={() => setFiltersOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "10px 16px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(37,99,235,0.2)"
              }}
            >
              🔍 Filtrar Lançamentos {hasFilter && `(${[selUnidade.length > 0 ? 1 : 0, selSemaforo !== "all" ? 1 : 0, selAno !== "all" ? 1 : 0, selFonte !== "all" ? 1 : 0].reduce((a,b)=>a+b,0)} ativos)`}
            </button>
            
            {/* Filter Pills */}
            {hasFilter && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {selUnidade.length > 0 && (
                  <span style={{ fontSize: 10, background: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: 12, border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                    Unid: {selUnidade.length} <X size={12} onClick={() => setSelUnidade([])} style={{ cursor: "pointer" }}/>
                  </span>
                )}
                {selSemaforo !== "all" && (
                  <span style={{ fontSize: 10, background: "#fef8ec", color: "#b45309", padding: "4px 10px", borderRadius: 12, border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                    Status: {selSemaforo === "verde" ? "Ressarcido" : selSemaforo === "a_ressarcir" ? "A Ressarcir" : "Aguardando Fin."} <X size={12} onClick={() => setSelSemaforo("all")} style={{ cursor: "pointer" }}/>
                  </span>
                )}
                {selAno !== "all" && (
                  <span style={{ fontSize: 10, background: "#f0fdf4", color: "#16a34a", padding: "4px 10px", borderRadius: 12, border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                    Ano: {selAno} <X size={12} onClick={() => setSelAno("all")} style={{ cursor: "pointer" }}/>
                  </span>
                )}
                {selFonte !== "all" && (
                  <span style={{ fontSize: 10, background: "#faf5ff", color: "#7c3aed", padding: "4px 10px", borderRadius: 12, border: "1px solid #e9d5ff", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                    Origem: {selFonte} <X size={12} onClick={() => setSelFonte("all")} style={{ cursor: "pointer" }}/>
                  </span>
                )}
              </div>
            )}

            {/* Bottom Sheet Modal */}
            {filtersOpen && (
              <>
                <div 
                  onClick={() => setFiltersOpen(false)}
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 1000,
                    backdropFilter: "blur(2px)"
                  }}
                />
                <div 
                  style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    width: "100vw",
                    maxHeight: "85vh",
                    background: "white",
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
                    zIndex: 1001,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>Filtrar Dados</span>
                    <button 
                      onClick={() => setFiltersOpen(false)}
                      style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div style={{ padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                    <MultiSel label="Unidade / Centro de Custo" opts={unidades} sel={selUnidade} set={setSelUnidade} isMobile={true}/>
                    
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>Status Ressarcimento</span>
                      <select value={selSemaforo} onChange={e=>setSelSemaforo(e.target.value)}
                        style={{padding:"8px 12px",border:"1px solid #d1d5db",borderRadius:8,fontSize:12,background:"white",width:"100%"}}>
                        <option value="all">Todos</option>
                        <option value="verde">🟢 Ressarcido</option>
                        <option value="a_ressarcir">🔴 A Ressarcir</option>
                        <option value="pendente">🟡 Aguardando Financeiro</option>
                      </select>
                    </div>

                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>Ano</span>
                      <select value={selAno} onChange={e=>setSelAno(e.target.value)}
                        style={{padding:"8px 12px",border:"1px solid #d1d5db",borderRadius:8,fontSize:12,background:"white",width:"100%"}}>
                        <option value="all">Todos</option>
                        {anos.map(a=><option key={a} value={String(a)}>{a}</option>)}
                      </select>
                    </div>

                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>Origem/Fonte</span>
                      <select value={selFonte} onChange={e=>setSelFonte(e.target.value)}
                        style={{padding:"8px 12px",border:"1px solid #d1d5db",borderRadius:8,fontSize:12,background:"white",width:"100%"}}>
                        <option value="all">Todas as Origens</option>
                        <option value="TED">Somente TED</option>
                        <option value="Emenda">Somente Emenda</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ padding: "16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
                    {hasFilter && (
                      <button 
                        onClick={() => { setSelUnidade([]); setSelSemaforo("all"); setSelAno("all"); setSelFonte("all"); }}
                        style={{
                          flex: 1, padding: "12px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer"
                        }}
                      >
                        Limpar
                      </button>
                    )}
                    <button 
                      onClick={() => setFiltersOpen(false)}
                      style={{
                        flex: 2, padding: "12px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center"
                      }}
                    >
                      APLICAR FILTROS
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{
            ...s.panel,
            padding:"14px 16px",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "stretch"
          }}>
            <div>
              <MultiSel label="Unidade / Centro de Custo" opts={unidades} sel={selUnidade} set={setSelUnidade} isMobile={false}/>
            </div>
            
            <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
              <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>Status Ressarcimento</span>
              <select value={selSemaforo} onChange={e=>setSelSemaforo(e.target.value)}
                style={{padding:"4px 10px",border:"1px solid #d1d5db",borderRadius:6,fontSize:11,background:"white",cursor:"pointer",width:168}}>
                <option value="all">Todos</option>
                <option value="verde">🟢 Ressarcido</option>
                <option value="a_ressarcir">🔴 A Ressarcir</option>
                <option value="pendente">🟡 Aguardando Financeiro</option>
              </select>
            </div>
            
            <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
              <span style={{fontSize:11,fontWeight:600,color:"#374151"}}>Ano</span>
              <select value={selAno} onChange={e=>setSelAno(e.target.value)}
                style={{padding:"4px 10px",border:"1px solid #d1d5db",borderRadius:6,fontSize:11,background:"white",cursor:"pointer",width:100}}>
                <option value="all">Todos</option>
                {anos.map(a=><option key={a} value={String(a)}>{a}</option>)}
              </select>
            </div>
            
            <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
              <div style={{fontSize:11,fontWeight:600,color:"#374151", display: "flex", gap: 4, alignItems: "center"}}>
                Origem
                <span style={{background: "#e2e8f0", color: "#1e293b", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700}}>
                  {selFonte === "all" ? "TED / EMENDA" : selFonte.toUpperCase()}
                </span>
              </div>
              <select value={selFonte} onChange={e=>setSelFonte(e.target.value)}
                style={{padding:"4px 10px",border:"1px solid #d1d5db",borderRadius:6,fontSize:11,background:"white",cursor:"pointer",width:160}}>
                <option value="all">Todas as Origens</option>
                <option value="TED">Somente TED</option>
                <option value="Emenda">Somente Emenda</option>
              </select>
            </div>
            
            {hasFilter&&(
              <button onClick={()=>{setSelUnidade([]);setSelSemaforo("all");setSelAno("all");setSelFonte("all");}}
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"6px 11px",border:"1px solid #d1d5db",borderRadius:6,background:"white",fontSize:11,cursor:"pointer",alignSelf:"flex-end"}}>
                <X size={12}/> Limpar Filtros
              </button>
            )}
          </div>
        )}

        {/* KPIs SECTION */}
        {isMobile ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "2px 0", width: "100%", boxSizing: "border-box" }}>
            <div style={{ background:"white", borderRadius:10, border:"1px solid #e2e8f0", borderLeft:"3.5px solid #3b82f6", boxShadow:"0 2px 4px rgba(0,0,0,0.03)", padding:"8px 10px", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:68, boxSizing:"border-box", overflow:"hidden" }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.02em", display:"flex", alignItems:"center", gap:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                <span>📋</span> Empenhado
              </div>
              <div style={{ fontSize:13.5, fontWeight:800, color:"#0f172a", marginTop:3, lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{fmt(T.empenhado)}</div>
              <div style={{ fontSize:8.5, color:"#94a3b8", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Base TG</div>
            </div>

            <div style={{ background:"white", borderRadius:10, border:"1px solid #e2e8f0", borderLeft:"3.5px solid #10b981", boxShadow:"0 2px 4px rgba(0,0,0,0.03)", padding:"8px 10px", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:68, boxSizing:"border-box", overflow:"hidden" }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.02em", display:"flex", alignItems:"center", gap:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                <span>💳</span> Pago (TG)
              </div>
              <div style={{ fontSize:13.5, fontWeight:800, color:"#0f172a", marginTop:3, lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{fmt(T.pago_tg)}</div>
              <div style={{ fontSize:8.5, color:"#94a3b8", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pct(T.pago_tg, T.empenhado)} do emp.</div>
            </div>

            <div style={{ background:"white", borderRadius:10, border:"1px solid #e2e8f0", borderLeft:"3.5px solid #14b8a6", boxShadow:"0 2px 4px rgba(0,0,0,0.03)", padding:"8px 10px", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:68, boxSizing:"border-box", overflow:"hidden" }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.02em", display:"flex", alignItems:"center", gap:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                <span>💰</span> Ressarcido
              </div>
              <div style={{ fontSize:13.5, fontWeight:800, color:"#0f172a", marginTop:3, lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{fmt(T.ressarcido)}</div>
              <div style={{ fontSize:8.5, color:"#94a3b8", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pct(T.ressarcido, T.total_ci / 2)} do tot. CI</div>
            </div>

            <div style={{ background:"white", borderRadius:10, border:"1px solid #e2e8f0", borderLeft:"3.5px solid #ef4444", boxShadow:"0 2px 4px rgba(0,0,0,0.03)", padding:"8px 10px", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:68, boxSizing:"border-box", overflow:"hidden" }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.02em", display:"flex", alignItems:"center", gap:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                <span>⚠️</span> A Ressarcir
              </div>
              <div style={{ fontSize:13.5, fontWeight:800, color:"#0f172a", marginTop:3, lineHeight:1.1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{fmt(T.a_ressarcir)}</div>
              <div style={{ fontSize:8.5, color:"#94a3b8", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pct(T.a_ressarcir, T.total_ci / 2)} do tot. CI</div>
            </div>
          </div>
        ) : (
          <>
            {/* KPIs Row 1 — Tesouro Gerencial */}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>📊 Execução Financeira — Tesouro Gerencial</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:10}}>
                <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Total Empenhado <FonteBadge fonte={selFonte} size="xs" /></span>}  value={fmt(T.empenhado)}  sub={`base TG`}                           color="#3b82f6" icon="📋"/>
                <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Total Pago (TG) <FonteBadge fonte={selFonte} size="xs" /></span>}  value={fmt(T.pago_tg)}    sub={pct(T.pago_tg,T.empenhado)}         color="#10b981" icon="💳"/>
                <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Total a Pagar <FonteBadge fonte={selFonte} size="xs" /></span>}    value={fmt(T.empenhado - T.pago_tg)} sub={`${pct(T.empenhado - T.pago_tg,T.empenhado)} do empenhado`} color="#f59e0b" icon="⏳"/>
              </div>
            </div>

            {/* KPIs Row 2 — Partilha de Recursos (50% / 50%) */}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>🤝 Partilha de Custos Indiretos (50% / 50%)</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:10}}>
                <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Pago à Unidade (50%) <FonteBadge fonte={selFonte} size="xs" /></span>} value={fmt(T.pago_tg / 2)} sub="Destinado à Unidade Executora" color="#6366f1" icon="🏢"/>
                <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Pago à UnB (50%) <FonteBadge fonte={selFonte} size="xs" /></span>}     value={fmt(T.pago_tg / 2)} sub="Destinado à Administração Central" color="#ec4899" icon="🏛️"/>
              </div>
            </div>

            {/* KPIs Row 3 — Controle de Ressarcimento — Base Manual */}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>🗂️ Controle de Ressarcimento — Base Manual</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:10}}>
                <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>Ressarcido (Unidade) <FonteBadge fonte={selFonte} size="xs" /></span>}  value={fmt(T.ressarcido)}  sub={pct(T.ressarcido,T.total_ci / 2)}  color="#14b8a6" icon="💰"/>
                <KpiCard title={<span style={{display:"flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}>A Ressarcir (Unidade) <FonteBadge fonte={selFonte} size="xs" /></span>} value={fmt(T.a_ressarcir)} sub={pct(T.a_ressarcir,T.total_ci / 2)} color="#ef4444" icon="⚠️"/>
              </div>
            </div>
          </>
        )}

        {/* Table / Process Cards */}
        <div style={isMobile ? undefined : s.panel}>
          {!isMobile && (
            <div style={{...s.sectionTitle,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{display:"flex",alignItems:"center"}}>Tabela Analítica — Processos <FonteBadge fonte={selFonte} size="sm" /></span>
              <span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>{filtered.length} registros</span>
            </div>
          )}
          
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 6px" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Processos e Lançamentos</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{filtered.length} registros</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map((d: any, idx: number) => {
                  const statusKey = getRecordStatus(d);
                  const sem = SEMAFOR[statusKey] || SEMAFOR.pendente;
                  const { aRessarcirVal, ressarcidoVal } = calcUnidadeValues(d);
                  return (
                    <ProcessCard key={idx} d={d} sem={sem} aRessarcirVal={aRessarcirVal} ressarcidoVal={ressarcidoVal} />
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
              <thead>
                <tr style={{background:"#f8fafc"}}>
                  {["Status","Fonte","Unidade","Processo SEI (Ressarcimento C.I.)","NE","Empenhado","Pago (TG)","A Ressarcir (Unidade)","Ressarcido (Unidade)"].map(h=>(
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d:any,i:number)=>{
                  const statusKey = getRecordStatus(d);
                  const sem = SEMAFOR[statusKey]||SEMAFOR.pendente;
                  return (
                    <tr key={i} style={{background:i%2===0?"white":"#fafafa"}}>
                      <td style={s.td}>
                        <span style={{display:"inline-block",padding:"2px 7px",borderRadius:12,border:`1px solid ${sem.border}`,background:sem.bg,color:sem.color,fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>
                          {sem.icon} {sem.label}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{background: d.fonte==="TED"?"#eff6ff":"#fdf4ff", color: d.fonte==="TED"?"#3b82f6":"#d946ef", padding:"2px 6px", borderRadius:4, fontSize:10, fontWeight:600}}>
                          {d.fonte}
                        </span>
                      </td>
                      <td style={s.td}><span style={{fontWeight:600,color:"#0f172a"}}>{d.centro_custo||"—"}</span></td>
                      <td style={{...s.td,maxWidth:200}}>
                        <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:10,color:"#374151"}} title={d.sei}>{d.sei||"—"}</div>
                        {d.num_ted&&<div style={{fontSize:9,color:"#94a3b8"}}>{String(d.num_ted).toLowerCase().startsWith(String(d.fonte).toLowerCase()) ? d.num_ted : `${d.fonte}: ${d.num_ted}`}</div>}
                      </td>
                      <td style={s.td}><span style={{fontSize:10,color:"#6366f1",fontWeight:600}}>{d.ne_key ? `NE: ${d.ne_key}` : "—"}</span></td>
                      <td style={{...s.td,fontWeight:600}}>{d.empenhado>0?fmtK(d.empenhado):"—"}</td>

                      <td style={s.td}>{d.total_pago_tg>0?fmtK(d.total_pago_tg):"—"}</td>
                      {(() => {
                        const { aRessarcirVal, ressarcidoVal } = calcUnidadeValues(d);
                        return (
                          <>
                            <td style={{...s.td,color:aRessarcirVal !== null?"#ef4444":"#94a3b8",fontWeight:700}}>{aRessarcirVal !== null?fmtK(aRessarcirVal):"—"}</td>
                            <td style={{...s.td,color:ressarcidoVal !== null?"#10b981":"#94a3b8",fontWeight:700}}>{ressarcidoVal !== null?fmtK(ressarcidoVal):"—"}</td>
                          </>
                        );
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
      )}
    </DashboardLayout>
  );
}
