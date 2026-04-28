export const C = {
  coral:"#FF7867", coralL:"#FFF0EE", coralM:"#FFD5CF",
  sage:"#5BA08A",  sageL:"#EEF6F3",  sageM:"#C2DED7",
  peach:"#F4A96A", peachL:"#FEF4EB",
  sky:"#6AABF4",   skyL:"#EBF4FE",
  lavender:"#9B8FE8", lavL:"#F2F0FD",
  rose:"#E87FAB",  roseL:"#FDF0F5",
  gold:"#E8C068",  goldL:"#FDF7EB",
  gray1:"#1A1A1A", gray2:"#484848", gray3:"#767676",
  gray4:"#B0B0B0", gray5:"#E8E8E8", gray6:"#F7F6F4",
  white:"#FFFFFF", border:"#EBEBEB",
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
export const PALETTE     = ["#FF7867","#5BA08A","#F4A96A","#E87FAB","#E8C068","#9B8FE8","#6AABF4","#8ECFC7","#F4B8A3","#B5D5A8"];
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
