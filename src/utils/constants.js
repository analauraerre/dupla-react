export const C = {
  coral:"#F97316", coralL:"#FFF7ED", coralM:"#FED7AA",   // naranja principal
  sage:"#65A30D",  sageL:"#F7FEE7",  sageM:"#D9F99D",    // verde oliva (ingresos/positivo)
  peach:"#FB923C", peachL:"#FFF7ED",                      // naranja claro
  sky:"#0891B2",   skyL:"#ECFEFF",                        // cyan (tarjetas)
  lavender:"#A16207", lavL:"#FEF9C3",                     // ámbar oscuro
  rose:"#DC2626",  roseL:"#FEF2F2",                       // rojo cálido
  gold:"#D97706",  goldL:"#FFFBEB",                       // ámbar (alertas)
  gray1:"#1C1917", gray2:"#44403C", gray3:"#78716C",      // grises cálidos
  gray4:"#A8A29E", gray5:"#E7E5E4", gray6:"#FAFAF9",
  white:"#FFFFFF", border:"#E7E5E4",
};

export const DEFAULT_CATEGORIES = [
  {name:"Vivienda",    icon:"🏠", color:C.coral,    bg:C.coralL},
  {name:"Supermercado",icon:"🛒", color:C.sage,     bg:C.sageL},
  {name:"Transporte",  icon:"🚗", color:C.peach,    bg:C.peachL},
  {name:"Salud",       icon:"❤️", color:C.rose,     bg:C.roseL},
  {name:"Restaurantes",icon:"🍽️", color:C.coral,    bg:C.coralL},
  {name:"Entretenim.", icon:"🎬", color:C.gold,     bg:C.goldL},
  {name:"Ropa",        icon:"👗", color:C.lavender, bg:C.lavL},
  {name:"Educación",   icon:"📚", color:C.sky,      bg:C.skyL},
  {name:"Servicios",   icon:"💡", color:C.peach,    bg:C.peachL},
  {name:"Otros",       icon:"📦", color:C.gray3,    bg:C.gray6},
];

export const DEFAULT_INCOME_CATEGORIES = [
  {name:"Sueldos",    icon:"💼", color:C.sage,     bg:C.sageL},
  {name:"Extras",     icon:"⭐", color:C.gold,     bg:C.goldL},
  {name:"Ayuda mamá", icon:"💝", color:C.rose,     bg:C.roseL},
  {name:"Otros",      icon:"📦", color:C.gray3,    bg:C.gray6},
];

export const CURRENCIES = [
  {id:"ARS", symbol:"$",   label:"Pesos"},
  {id:"USD", symbol:"US$", label:"Dólares"},
  {id:"EUR", symbol:"€",   label:"Euros"},
];

export const MONTHS      = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const MONTHS_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const USERS       = ["Ana","Fabio"];
export const PALETTE     = ["#F97316","#65A30D","#FB923C","#D97706","#DC2626","#0891B2","#A16207","#F59E0B","#C2410C","#84CC16"];
export const ICON_OPTIONS= ["🏠","🛒","🚗","❤️","🍽️","🎬","👗","📚","💡","📦","🐾","✈️","🎓","💊","🏋️","🎮","🎵","📱","🏦","🧴","⚽","🌿","🍺","☕","🎁","🏥","🛠️","🐶","🐱","🍕","💻","🎨"];
export const PAYMENT_METHODS_FIXED = ["Efectivo","Débito"];

export const SEED = {
  categories: DEFAULT_CATEGORIES,
  incomeCategories: DEFAULT_INCOME_CATEGORIES,
  expenses: [],
  incomes:  [],
  savingGoals: [],
  baseBudgets:{
    "Vivienda":160000,"Supermercado":80000,"Transporte":40000,"Salud":20000,
    "Restaurantes":30000,"Entretenim.":15000,"Ropa":20000,"Educación":10000,
    "Servicios":15000,"Otros":10000
  },
  budgetOverrides:{},
  incomeBaseBudgets:{"Sueldos":0,"Extras":0,"Ayuda mamá":0,"Otros":0},
  incomeBudgetOverrides:{},
  recurringExpenses:[],
  monthNotes:{},
  creditCards:[],
  splits:[],
  savingsAccounts:[],
};

export const Sx = {
  shadow:"0 2px 12px rgba(0,0,0,0.06)",
  card:{background:C.white,borderRadius:20,padding:"18px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,0.06)"},
  ct:{fontSize:15,fontWeight:700,color:C.gray1,marginBottom:14},
  ph:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},
  pt:{fontSize:22,fontWeight:900,color:C.gray1,letterSpacing:"-0.5px"},
  ps:{fontSize:13,color:C.gray3,marginTop:2},
  btn:{background:C.coral,color:C.white,border:"none",borderRadius:24,padding:"10px 20px",fontSize:14,fontWeight:700,cursor:"pointer"},
  inp:{padding:"11px 14px",border:`1.5px solid ${C.border}`,borderRadius:12,fontSize:14,outline:"none",color:C.gray1,background:C.white,width:"100%",boxSizing:"border-box"},
  fcard:{background:C.white,borderRadius:18,padding:18,marginBottom:16,border:`1.5px solid ${C.coral}`,boxShadow:`0 2px 16px ${C.coral}18`},
  ft:{fontSize:15,fontWeight:700,color:C.gray1,marginBottom:12},
  fgrid:{display:"flex",flexDirection:"column",gap:10,marginBottom:14},
  erow:{background:C.white,borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"},
  txrow:{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.gray5}`},
  dot:{width:40,height:40,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  xbtn:{width:26,height:26,borderRadius:"50%",border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:16,color:C.gray3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  empty:{textAlign:"center",padding:"40px 20px",color:C.gray3,fontSize:15,background:C.white,borderRadius:18,marginBottom:14},
  chipRow:{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"},
};
