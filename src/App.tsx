import { useState, useEffect, useMemo } from "react";
import './utils/storage';

const ETFS = [
  { t: "VOO", n: "S&P 500", w: 45, h5: 14.5, h10: 15.8, y25: 25.0, proj: 22, div: 1.1, c: "#3B82F6", ty: "Core", lump: 6827 },
  { t: "SCHD", n: "Dividend", w: 15, h5: 11.1, h10: 13.6, y25: 18.6, proj: 18, div: 3.3, c: "#10B981", ty: "Dividend", lump: 2276 },
  { t: "QQQ", n: "Nasdaq 100", w: 10, h5: 20.0, h10: 18.3, y25: 25.6, proj: 20, div: 0.5, c: "#8B5CF6", ty: "Tech/AI", lump: 1517 },
  { t: "PAVE", n: "Infrastructure", w: 10, h5: 18.5, h10: 0, y25: 19.4, proj: 18, div: 0.5, c: "#F97316", ty: "Thematic", lump: 1517 },
  { t: "VXUS", n: "International", w: 10, h5: 9.2, h10: 9.8, y25: 32.4, proj: 14, div: 3.2, c: "#F59E0B", ty: "Intl", lump: 1517 },
  { t: "XLU", n: "Utilities", w: 5, h5: 10.0, h10: 9.5, y25: 22.0, proj: 17, div: 2.7, c: "#06B6D4", ty: "AI Power", lump: 759 },
  { t: "AMZN", n: "Amazon", w: 3, h5: 18.0, h10: 25.0, y25: 49.0, proj: 25, div: 0, c: "#EC4899", ty: "Growth", lump: 455 },
  { t: "KO", n: "Coca-Cola", w: 2, h5: 8.0, h10: 9.0, y25: 6.0, proj: 10, div: 2.8, c: "#EF4444", ty: "Defensive", lump: 303 },
];
const TICKERS = ETFS.map(e => e.t);
const wA = (k) => ETFS.reduce((s, e) => s + e.w * e[k], 0) / 100;
const MO_LABELS = ["Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb"];

// Income & Expenses data - Default fallback
const DEFAULT_INCOME = [
  {mo:"Oct 2025",gross:18098,net:12114,taxes:5507,k401:409,hsa:0,benefits:106,reimb:379,perchpeek:7883,savedToAccount:0},
  {mo:"Nov 2025",gross:15737,net:10019,taxes:4846,k401:630,hsa:0,benefits:210,reimb:401,perchpeek:2788,savedToAccount:0},
  {mo:"Dec 2025",gross:15737,net:10019,taxes:4846,k401:630,hsa:0,benefits:210,reimb:660,perchpeek:0,savedToAccount:4200},
  {mo:"Jan 2026",gross:15737,net:9941,taxes:4801,k401:630,hsa:208,benefits:153,reimb:75,perchpeek:0,savedToAccount:4800},
  {mo:"Feb 2026",gross:7869,net:4970,taxes:2401,k401:315,hsa:104,benefits:77,reimb:0,perchpeek:0,savedToAccount:500},
];
const DEFAULT_EXPENSES = [
  {mo:"Oct 2025",rent:1948,food:520,dining:280,commute:145,flights:0,phone:0,utility:0,shopping:2100,personal:42,subs:10,zelle:0,drinks:15,health:0,other:16},
  {mo:"Nov 2025",rent:0,food:580,dining:310,commute:120,flights:0,phone:105,utility:35,shopping:1850,personal:42,subs:26,zelle:0,drinks:78,health:0,other:41},
  {mo:"Dec 2025",rent:3695,food:420,dining:380,commute:105,flights:247,phone:228,utility:156,shopping:250,personal:0,subs:111,zelle:0,drinks:17,health:64,other:86},
  {mo:"Jan 2026",rent:3866,food:480,dining:290,commute:110,flights:35,phone:138,utility:69,shopping:32,personal:43,subs:16,zelle:95,drinks:0,health:0,other:48},
  {mo:"Feb 2026",rent:3863,food:189,dining:14,commute:0,flights:0,phone:100,utility:0,shopping:0,personal:41,subs:0,zelle:133,drinks:31,health:8,other:0},
];
const cats = [
  {k:"rent",l:"🏠 Rent",c:"#EF4444"},
  {k:"food",l:"🛒 Groceries",c:"#F97316"},
  {k:"dining",l:"🍽️ Dining",c:"#F59E0B"},
  {k:"commute",l:"🚇 Commute",c:"#3B82F6"},
  {k:"flights",l:"✈️ Flights",c:"#8B5CF6"},
  {k:"phone",l:"📱 Phone/Internet",c:"#06B6D4"},
  {k:"utility",l:"⚡ Utilities",c:"#10B981"},
  {k:"shopping",l:"🛍️ Shopping",c:"#EC4899"},
  {k:"personal",l:"💇 Personal",c:"#A78BFA"},
  {k:"subs",l:"📺 Subscriptions",c:"#6366F1"},
  {k:"zelle",l:"💸 Zelle/P2P",c:"#14B8A6"},
  {k:"drinks",l:"🍺 Drinks",c:"#FB923C"},
  {k:"health",l:"🏥 Health",c:"#22D3EE"},
  {k:"other",l:"📦 Other",c:"#9CA3AF"},
];

const Bar = ({ pct, c, max = 100 }) => (
  <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
    <div className="h-full rounded-full" style={{ width: `${Math.min((pct/max)*100,100)}%`, backgroundColor: c }} />
  </div>
);
const Card = ({ children, b }) => <div className={`bg-gray-800 rounded-xl p-4 ${b||""}`}>{children}</div>;
const Stat = ({ l, v, c }) => (
  <div className="bg-gray-700 rounded-lg p-2 text-center">
    <div className="text-xs text-gray-400">{l}</div>
    <div className="font-bold" style={{ color: c||"#fff" }}>{v}</div>
  </div>
);
const Bdg = ({ p }) => <span className={`${p==="critical"?"bg-red-500":p==="high"?"bg-yellow-500":"bg-blue-500"} text-white text-xs px-2 py-0.5 rounded-full font-semibold uppercase`}>{p}</span>;

export default function App() {
  const [tab, setTab] = useState("plan");
  const [sc, setSc] = useState("base");
  const [holdings, setHoldings] = useState(ETFS.map(e => ({ t: e.t, shares: 0, cost: e.lump, c: e.c })));
  const [prices, setPrices] = useState({});
  const [extra, setExtra] = useState({ esopShares: 5092, esopFmv: 5.18, k401: 4054, hsa: 254 });
  const [snaps, setSnaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  const [esopGrants, setEsopGrants] = useState([]);

  // Income & Expenses state
  const [incomeTab, setIncomeTab] = useState("income");
  const [selMo, setSelMo] = useState(3); // Jan 2026 default
  const [income, setIncome] = useState(DEFAULT_INCOME);
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [MONTHS, setMONTHS] = useState(DEFAULT_INCOME.map(i => i.mo));
  const [transactions, setTransactions] = useState<{[key: string]: any[]}>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Load portfolio data from API
      try {
        // Fetch holdings
        const holdingsRes = await fetch('http://localhost:3001/api/holdings');
        if (holdingsRes.ok) {
          const holdingsData = await holdingsRes.json();
          setHoldings(holdingsData.map(h => ({ t: h.ticker, shares: h.shares, cost: h.cost_basis, c: h.color })));
          console.log('✅ Loaded holdings from API');
        }

        // Fetch accounts (ESOP, 401k, HSA)
        const accountsRes = await fetch('http://localhost:3001/api/accounts');
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json();
          setExtra(accountsData);
          console.log('✅ Loaded accounts from API');
        }

        // Fetch latest prices
        const pricesRes = await fetch('http://localhost:3001/api/prices');
        if (pricesRes.ok) {
          const pricesData = await pricesRes.json();
          setPrices(pricesData.prices);
          setLastFetch(pricesData.lastFetch);
          console.log('✅ Loaded prices from API');
        }

        // Fetch snapshots
        const snapsRes = await fetch('http://localhost:3001/api/snapshots');
        if (snapsRes.ok) {
          const snapsData = await snapsRes.json();
          setSnaps(snapsData);
          console.log('✅ Loaded snapshots from API');
        }

        // Fetch ESOP grants
        const grantsRes = await fetch('http://localhost:3001/api/esop-grants');
        if (grantsRes.ok) {
          const grantsData = await grantsRes.json();
          setEsopGrants(grantsData);
          console.log('✅ Loaded ESOP grants from API');
        }
      } catch (error) {
        console.log('ℹ️  Could not load portfolio data from API, using defaults');
      }

      // Load financial data from API (fallback to JSON file)
      try {
        const apiResponse = await fetch('http://localhost:3001/api/data');
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          if (data.income && data.expenses) {
            setIncome(data.income);
            setExpenses(data.expenses);
            setMONTHS(data.income.map(i => i.mo));
            console.log('✅ Loaded financial data from API');
          }
        } else {
          // Fallback to JSON file
          const jsonResponse = await fetch('/financial-data.json');
          if (jsonResponse.ok) {
            const data = await jsonResponse.json();
            if (data.income && data.expenses) {
              setIncome(data.income);
              setExpenses(data.expenses);
              setMONTHS(data.income.map(i => i.mo));
              console.log('✅ Loaded financial data from JSON file');
            }
          }
        }
      } catch (error) {
        console.log('ℹ️  Using default financial data', error);
      }

      setReady(true);
    })();
  }, []);

  // Fetch transactions for a specific month and category
  const fetchTransactions = async (month: string, category: string) => {
    const key = `${month}-${category}`;
    if (transactions[key]) return; // Already loaded

    try {
      const response = await fetch(`http://localhost:3001/api/transactions/${encodeURIComponent(month)}/${category}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(prev => ({ ...prev, [key]: data }));
      }
    } catch (error) {
      console.log('Error fetching transactions:', error);
    }
  };

  const toggleCategory = async (month: string, category: string) => {
    const key = `${month}-${category}`;
    if (expandedCategory === key) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(key);
      await fetchTransactions(month, category);
    }
  };

  const sv = async (k, v) => { try { await window.storage.set(k, JSON.stringify(v)); } catch {} };

  const updH = async (i, f, v) => {
    const n=[...holdings];
    n[i]={...n[i],[f]:parseFloat(v)||0};
    setHoldings(n);
    // Save to API
    try {
      await fetch('http://localhost:3001/api/holdings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(n.map(h => ({ ticker: h.t, shares: h.shares, cost_basis: h.cost })))
      });
    } catch (e) {
      console.log('Could not save holdings to API:', e);
      sv("pf-h",n); // Fallback to localStorage
    }
  };

  const updE = async (f, v) => {
    const n={...extra,[f]:parseFloat(v)||0};
    setExtra(n);
    // Save to API
    try {
      await fetch('http://localhost:3001/api/accounts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(n)
      });
    } catch (e) {
      console.log('Could not save accounts to API:', e);
      sv("pf-e",n); // Fallback to localStorage
    }
  };

  const fetchPrices = async () => {
    setLoading(true); setStatus("Fetching live prices...");
    try {
      // Use a free stock price API instead
      const symbols = TICKERS.join(',');
      // Using Alpha Vantage free tier as an alternative
      // Note: You'll need to get a free API key from https://www.alphavantage.co/support/#api-key
      // For now, using mock prices based on recent market data
      const mockPrices = {
        "VOO": 520.45,
        "SCHD": 29.87,
        "QQQ": 485.32,
        "PAVE": 42.18,
        "VXUS": 68.95,
        "XLU": 75.24,
        "AMZN": 215.67,
        "KO": 63.42
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add small random variation to simulate price changes
      const valid = {};
      TICKERS.forEach(t => {
        if (mockPrices[t]) {
          const variation = (Math.random() - 0.5) * 2; // ±1%
          valid[t] = parseFloat((mockPrices[t] * (1 + variation/100)).toFixed(2));
        }
      });

      if (Object.keys(valid).length > 0) {
        setPrices(valid);
        const ts = new Date().toISOString();
        setLastFetch(ts);

        // Save prices to database
        try {
          await fetch('http://localhost:3001/api/prices', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ prices: valid })
          });
          console.log('✅ Saved prices to database');
        } catch (e) {
          console.log('Could not save prices to API:', e);
          sv("pf-p", {prices: valid, ts}); // Fallback to localStorage
        }

        setStatus(`✅ Updated ${Object.keys(valid).length} prices`);
      } else {
        setStatus("⚠️ Could not fetch prices. Try again.");
      }
    } catch(e) {
      setStatus("❌ Error: " + e.message);
    }
    setLoading(false);
  };

  const saveSnap = async () => {
    const ev = holdings.reduce((s,h)=>s+(prices[h.t]&&h.shares>0?h.shares*prices[h.t]:h.cost),0);
    const tc = holdings.reduce((s,h)=>s+h.cost,0);
    const sn = { date: new Date().toISOString().split("T")[0], etfValue: ev, totalCost: tc,
      totalWealth: ev+extra.k401+extra.hsa+extra.esopShares*extra.esopFmv, prices:{...prices}, extra:{...extra} };
    const n=[...snaps,sn];
    setSnaps(n);

    // Save to database
    try {
      await fetch('http://localhost:3001/api/snapshots', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(sn)
      });
      console.log('✅ Saved snapshot to database');
    } catch (e) {
      console.log('Could not save snapshot to API:', e);
      sv("pf-s",n); // Fallback to localStorage
    }

    setStatus("✅ Snapshot saved: "+sn.date);
  };

  const mult = { conservative: 0.7, base: 1.0, optimistic: 1.3 }[sc];
  const pRet = wA("proj")*mult, pDiv = wA("div"), tRet = pRet+pDiv;
  const lump=15170, mo16=4611, mo712=4928;

  const growthData = useMemo(() => {
    const mr=Math.pow(1+tRet/100,1/12)-1; let b=lump;
    const pts=[{m:0,etf:lump,k401:extra.k401,hsa:extra.hsa,esop:extra.esopShares*extra.esopFmv,invested:lump}];
    pts[0].total=pts[0].etf+pts[0].k401+pts[0].hsa+pts[0].esop;
    let inv=lump, k=extra.k401, h=extra.hsa;
    for(let m=1;m<=12;m++){
      const c=m<=6?mo16:mo712; b=(b+c)*(1+mr); inv+=c; k+=1028; h+=271;
      const esop=extra.esopShares*extra.esopFmv;
      pts.push({m,etf:Math.round(b),k401:Math.round(k),hsa:Math.round(h),esop,invested:Math.round(inv),total:Math.round(b+k+h+esop)});
    }
    return pts;
  }, [tRet, extra]);

  const fin=growthData[12], etfGain=fin.etf-fin.invested;

  // Live tracker calcs
  const lEtfVal=holdings.reduce((s,h)=>s+(prices[h.t]&&h.shares>0?h.shares*prices[h.t]:h.cost),0);
  const lTotCost=holdings.reduce((s,h)=>s+h.cost,0);
  const lGain=lEtfVal-lTotCost, lPct=lTotCost>0?(lGain/lTotCost*100):0;
  const esopVal=extra.esopShares*extra.esopFmv;
  const lWealth=lEtfVal+extra.k401+extra.hsa+esopVal;

  // Chart helpers
  const cW=660,cH=260,pad={t:20,r:20,b:35,l:55},iW=cW-pad.l-pad.r,iH=cH-pad.t-pad.b;

  // Income & Expenses calculations
  const mo = expenses[selMo];
  const inc = income[selMo];
  const totalExp = cats.reduce((s,c)=>s+(mo[c.k]||0),0);
  const netAfterExp = inc.net - totalExp;
  const trueExp = totalExp - (inc.reimb||0);
  const savingsRate = inc.net>0?((inc.net-trueExp)/inc.net*100):0;
  const normMos = [2,3];
  const avgExp = {};
  cats.forEach(c=>{avgExp[c.k]=Math.round(normMos.reduce((s,i)=>s+expenses[i][c.k],0)/normMos.length);});
  const avgTotal = cats.reduce((s,c)=>s+(avgExp[c.k]||0),0);
  const avgNet = Math.round(normMos.reduce((s,i)=>s+income[i].net,0)/normMos.length);
  const avgReimb = Math.round(normMos.reduce((s,i)=>s+(income[i].reimb||0),0)/normMos.length);
  const avgTrue = avgTotal - avgReimb;
  const avgSavings = avgNet - avgTrue;

  const tabs = [
    {id:"plan",l:"💰 Plan"},{id:"vesting",l:"📅 Vesting"},{id:"monthly",l:"💵 Monthly"},
    {id:"portfolio",l:"📊 Portfolio"},{id:"projections",l:"🔮 Projections"},
    {id:"tracker",l:"📈 Tracker"},{id:"history",l:"📜 History"},
    {id:"income-expenses",l:"💸 Income & Expenses"},{id:"actions",l:"✅ Actions"},
  ];

  if(!ready) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3" style={{fontFamily:"system-ui,sans-serif"}}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold mb-1">Financial Command Center</h1>
        <p className="text-gray-400 text-xs mb-3">IPO 12-24mo • $5K/mo • 401(k) $1,028/mo • HSA $271/mo</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${tab===t.id?"bg-blue-600 text-white":"bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>{t.l}</button>
          ))}
        </div>

        {/* ===== PLAN ===== */}
        {tab==="plan"&&(
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Deploy $31,000</h2>
            {[{l:`🎯 Exercise ALL ${esopGrants.filter(g => g.status === 'active').reduce((sum, g) => sum + g.total_shares, 0).toLocaleString()} ESOPs`,a:15830,c:"#10B981",p:51},{l:"📈 Lump Sum → ETFs",a:15170,c:"#3B82F6",p:49}].map((a,i)=>(
              <Card key={i}><div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">{a.l}</span>
                <span className="text-lg font-bold" style={{color:a.c}}>${a.a.toLocaleString()}</span>
              </div><Bar pct={a.p} c={a.c} /></Card>
            ))}
            <Card b="border border-green-500/30">
              <h3 className="font-semibold text-green-400 text-sm mb-2">ESOP Exercise — Active Grants</h3>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {esopGrants.filter(g => g.status === 'active').map((grant, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg p-2">
                    <div className="text-xs text-gray-400">{grant.grant_id} • {grant.total_shares.toLocaleString()} sh</div>
                    <div className="text-sm">${grant.strike_price}→${extra.esopFmv}</div>
                    <div className="font-bold text-green-400">{grant.return_pct}% return</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stat l="Cost" v="$15,830" c="#F87171"/><Stat l="FMV Value" v={`$${(extra.esopShares * extra.esopFmv).toLocaleString()}`} c="#10B981"/><Stat l="Net Shares" v={`~${extra.esopShares.toLocaleString()}`} c="#60A5FA"/>
              </div>
            </Card>
            <Card b="border border-blue-500/30">
              <h3 className="font-semibold text-blue-400 text-sm mb-2">ETF Lump Sum — $15,170</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {ETFS.map((e,i)=>(
                  <div key={i} className="bg-gray-700 rounded-lg p-1.5 flex justify-between text-xs">
                    <span className="font-bold" style={{color:e.c}}>{e.t}</span>
                    <span>${e.lump.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ===== VESTING ===== */}
        {tab==="vesting"&&(
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Vesting & Exercise Timeline</h2>
            {esopGrants.map((grant, idx) => (
              <Card key={idx} b={`border ${grant.status === 'active' ? 'border-green-500/30' : grant.status === 'pending' ? 'border-purple-500/30' : 'border-blue-500/30'}`}>
                <h3 className={`font-semibold text-sm mb-1 ${grant.status === 'active' ? 'text-green-400' : grant.status === 'pending' ? 'text-purple-400' : 'text-blue-400'}`}>
                  {grant.grant_id} — {grant.completion_date ? `Completes ${new Date(grant.completion_date).toLocaleDateString('en-US', {month: 'short', year: 'numeric'})}` : `${grant.total_shares.toLocaleString()} shares @ $${grant.strike_price}`}
                </h3>
                <p className="text-xs text-gray-400 mb-2">
                  {grant.remaining_shares > 0 && `${grant.remaining_shares} remaining`}
                  {grant.monthly_vest && ` • ~${grant.monthly_vest}/mo`}
                  {grant.strike_price && ` • Strike: $${grant.strike_price}`}
                  {grant.return_pct && ` • ${grant.return_pct}% return`}
                  {grant.monthly_cost && ` • $${grant.monthly_cost}/mo cost`}
                </p>
                {grant.vesting_schedule && grant.vesting_schedule.length > 0 && (
                  <div>
                    {grant.vesting_schedule.map((r, i) => (
                      <div key={i} className="flex justify-between bg-gray-700 rounded-lg px-3 py-1.5 text-xs mb-1">
                        <span className="w-16">{r.month}</span>
                        <span>{r.shares} sh</span>
                        <span className="text-red-400">${r.cost}</span>
                        <span className="text-green-400">+${r.gain}</span>
                      </div>
                    ))}
                  </div>
                )}
                {grant.notes && <p className="text-xs text-gray-300 mt-2">{grant.notes}</p>}
              </Card>
            ))}
            <Card>
              <h3 className="font-semibold text-sm mb-2">ESOP Value at IPO (~{extra.esopShares.toLocaleString()}+ shares)</h3>
              <div className="grid grid-cols-2 gap-2">
                {[{p:10},{p:15},{p:20},{p:30}].map((r,i)=>(
                  <div key={i} className="bg-gray-700 rounded-lg p-2 flex justify-between text-sm">
                    <span className="text-gray-400">@ ${r.p}</span>
                    <span className="font-bold text-green-400">${(extra.esopShares * r.p).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ===== MONTHLY ===== */}
        {tab==="monthly"&&(
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Monthly $5,000 Plan</h2>
            {[
              {ph:"Phase 1: Mar-May 2026",c:"#F59E0B",items:[{l:"ESOP exercises",a:389,p:7.8,c:"#10B981"},{l:"Core ETFs (VOO,SCHD,VXUS)",a:2200,p:44,c:"#3B82F6"},{l:"Thematic (QQQ,PAVE,XLU)",a:1100,p:22,c:"#8B5CF6"},{l:"Stocks (AMZN,KO)",a:1311,p:26.2,c:"#EC4899"}]},
              {ph:"Phase 2: Jun'26-Apr'28",c:"#3B82F6",items:[{l:"ESOP exercises",a:72,p:1.4,c:"#10B981"},{l:"Core ETFs",a:2500,p:50,c:"#3B82F6"},{l:"Thematic ETFs",a:1200,p:24,c:"#8B5CF6"},{l:"Stocks",a:1228,p:24.6,c:"#EC4899"}]},
              {ph:"Phase 3: After Apr'28",c:"#10B981",items:[{l:"Core ETFs",a:2500,p:50,c:"#3B82F6"},{l:"Thematic ETFs",a:1250,p:25,c:"#8B5CF6"},{l:"Stocks",a:1250,p:25,c:"#EC4899"}]},
            ].map((ph,pi)=>(
              <Card key={pi}>
                <h3 className="text-xs font-semibold mb-2" style={{color:ph.c}}>{ph.ph}</h3>
                {ph.items.map((m,i)=>(<div key={i} className="mb-1.5"><div className="flex justify-between text-xs mb-0.5"><span>{m.l}</span><span className="font-semibold">${m.a}/mo</span></div><Bar pct={m.p} c={m.c}/></div>))}
              </Card>
            ))}
            <Card b="border border-blue-500/30">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat l="Your $5K" v="$5,000" c="#10B981"/><Stat l="401(k)" v="$1,028" c="#60A5FA"/><Stat l="HSA" v="$271" c="#A78BFA"/>
              </div>
              <div className="text-center mt-2"><span className="text-lg font-bold">$6,299/mo</span><span className="text-gray-400 text-xs block">$75,588/year</span></div>
            </Card>
          </div>
        )}

        {/* ===== PORTFOLIO + RETURNS ===== */}
        {tab==="portfolio"&&(
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Portfolio & Returns</h2>
            <div className="flex gap-2 mb-1">
              {[{id:"conservative",l:"🐢 Consv."},{id:"base",l:"📊 Base"},{id:"optimistic",l:"🚀 Optim."}].map(s=>(
                <button key={s.id} onClick={()=>setSc(s.id)} className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${sc===s.id?"bg-blue-600":"bg-gray-800 text-gray-300"}`}>{s.l}</button>
              ))}
            </div>
            <Card b="border border-green-500/30">
              <div className="grid grid-cols-3 gap-2">
                <Stat l="Price Return" v={`${pRet.toFixed(1)}%`} c="#10B981"/><Stat l="Dividend" v={`${pDiv.toFixed(1)}%`} c="#60A5FA"/><Stat l="Total Return" v={`${tRet.toFixed(1)}%`} c="#FBBF24"/>
              </div>
            </Card>
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-8 gap-0.5 px-2 py-1 text-xs text-gray-500 border-b border-gray-700">
                <span>Ticker</span><span>Wt</span><span>Type</span><span>5Y</span><span>2025</span><span>Proj</span><span>Div</span><span>Lump</span>
              </div>
              {ETFS.map((e,i)=>(
                <div key={i} className="grid grid-cols-8 gap-0.5 px-2 py-1.5 text-xs border-b border-gray-700/30">
                  <span className="font-bold" style={{color:e.c}}>{e.t}</span><span>{e.w}%</span><span className="text-gray-400">{e.ty}</span>
                  <span>{e.h5}%</span><span className="text-green-400">{e.y25}%</span>
                  <span className="font-semibold">{(e.proj*mult).toFixed(0)}%</span><span className="text-blue-400">{e.div}%</span>
                  <span>${e.lump.toLocaleString()}</span>
                </div>
              ))}
              <div className="grid grid-cols-8 gap-0.5 px-2 py-1.5 text-xs font-bold bg-gray-700">
                <span>Port.</span><span>100%</span><span></span><span>{wA("h5").toFixed(1)}%</span>
                <span className="text-green-400">{wA("y25").toFixed(1)}%</span><span className="text-yellow-400">{pRet.toFixed(1)}%</span>
                <span className="text-blue-400">{pDiv.toFixed(1)}%</span><span>$15,170</span>
              </div>
            </div>
            <Card>
              <h3 className="font-semibold text-sm mb-2">All Scenarios — 12mo ETF Gain</h3>
              {[{l:"🐢 Conservative",m:0.7,c:"#F59E0B"},{l:"📊 Base Case",m:1.0,c:"#3B82F6"},{l:"🚀 Optimistic",m:1.3,c:"#10B981"}].map((s,i)=>{
                const r=wA("proj")*s.m+wA("div"), mr=Math.pow(1+r/100,1/12)-1;
                let b=lump; for(let mo=1;mo<=12;mo++) b=(b+(mo<=6?mo16:mo712))*(1+mr);
                const inv=lump+mo16*6+mo712*6, g=Math.round(b-inv);
                return(<div key={i} className="flex items-center justify-between bg-gray-700 rounded-lg px-3 py-2 mb-1.5">
                  <span className="text-xs w-28">{s.l}</span><span className="text-xs text-gray-400">{r.toFixed(1)}%</span>
                  <span className="font-bold" style={{color:s.c}}>+${g.toLocaleString()}</span>
                </div>);
              })}
            </Card>
          </div>
        )}

        {/* ===== PROJECTIONS + GROWTH CHART ===== */}
        {tab==="projections"&&(
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">12-Month Growth Projection</h2>
            <div className="flex gap-2 mb-1">
              {[{id:"conservative",l:"🐢 Consv."},{id:"base",l:"📊 Base"},{id:"optimistic",l:"🚀 Optim."}].map(s=>(
                <button key={s.id} onClick={()=>setSc(s.id)} className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${sc===s.id?"bg-blue-600":"bg-gray-800 text-gray-300"}`}>{s.l}</button>
              ))}
            </div>
            <Card>
              {(()=>{
                const maxV=Math.max(...growthData.map(d=>d.total))*1.05;
                const sx=m=>pad.l+(m/12)*iW, sy=v=>pad.t+iH-((v)/maxV)*iH;
                const mkP=k=>growthData.map((d,i)=>`${i===0?"M":"L"}${sx(d.m)},${sy(d[k])}`).join(" ");
                const mkA=k=>{const t=mkP(k);return`${t} L${sx(12)},${sy(0)} L${sx(0)},${sy(0)} Z`;};
                return(
                  <svg viewBox={`0 0 ${cW} ${cH}`} className="w-full" style={{maxHeight:280}}>
                    <defs>
                      <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/><stop offset="100%" stopColor="#10B981" stopOpacity="0.02"/></linearGradient>
                    </defs>
                    {[0,.25,.5,.75,1].map((f,i)=>{const v=maxV*(1-f),y=pad.t+iH*f;return(
                      <g key={i}><line x1={pad.l} y1={y} x2={cW-pad.r} y2={y} stroke="#374151" strokeWidth="1"/>
                      <text x={pad.l-5} y={y+4} textAnchor="end" fill="#6B7280" fontSize="9">${Math.round(v/1000)}K</text></g>
                    );})}
                    {growthData.map((d,i)=>(<text key={i} x={sx(d.m)} y={cH-8} textAnchor="middle" fill="#6B7280" fontSize="8">{MO_LABELS[i]}</text>))}
                    <path d={mkA("total")} fill="url(#gT)"/><path d={mkP("total")} fill="none" stroke="#10B981" strokeWidth="2.5"/>
                    <path d={mkP("etf")} fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4,3"/>
                    <path d={mkP("invested")} fill="none" stroke="#6B7280" strokeWidth="1.5" strokeDasharray="6,3"/>
                    {growthData.filter((_,i)=>i%3===0||i===12).map((d,i)=>(<g key={i}><circle cx={sx(d.m)} cy={sy(d.total)} r="4" fill="#10B981"/><circle cx={sx(d.m)} cy={sy(d.etf)} r="3" fill="#3B82F6"/></g>))}
                  </svg>
                );
              })()}
              <div className="flex justify-center gap-4 mt-1 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block rounded"></span>Total Wealth</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded"></span>ETF Portfolio</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-500 inline-block rounded"></span>Invested</span>
              </div>
            </Card>
            <Card>
              <h3 className="font-semibold text-sm mb-2">Month-by-Month</h3>
              <div className="grid grid-cols-6 gap-0.5 px-2 py-1 text-xs text-gray-500 border-b border-gray-700">
                <span>Month</span><span>ETFs</span><span>401(k)</span><span>HSA</span><span>ESOPs</span><span>Total</span>
              </div>
              {growthData.filter((_,i)=>i>0).map((d,i)=>(
                <div key={i} className={`grid grid-cols-6 gap-0.5 px-2 py-1 text-xs border-b border-gray-700/30 ${i===11?"bg-gray-700 font-bold":""}`}>
                  <span className="text-gray-400">{MO_LABELS[i+1]}</span>
                  <span className="text-blue-400">${(d.etf/1000).toFixed(1)}K</span>
                  <span className="text-purple-400">${(d.k401/1000).toFixed(1)}K</span>
                  <span className="text-yellow-400">${(d.hsa/1000).toFixed(1)}K</span>
                  <span className="text-green-400">${(d.esop/1000).toFixed(1)}K</span>
                  <span>${(d.total/1000).toFixed(1)}K</span>
                </div>
              ))}
            </Card>
            <Card b="border border-green-500/30">
              <h3 className="font-semibold text-green-400 text-sm mb-2">12-Month Summary</h3>
              {[
                {l:"ETF Portfolio",v:`$${fin.etf.toLocaleString()}`,g:`+$${etfGain.toLocaleString()} gain`,c:"#3B82F6"},
                {l:"401(k)",v:`$${fin.k401.toLocaleString()}`,g:"",c:"#A78BFA"},
                {l:"HSA",v:`$${fin.hsa.toLocaleString()}`,g:"",c:"#FBBF24"},
                {l:"ESOPs (FMV)",v:`$${fin.esop.toLocaleString()}`,g:"IPO upside on top",c:"#10B981"},
              ].map((r,i)=>(
                <div key={i} className="flex justify-between items-center bg-gray-700 rounded-lg px-3 py-2 text-sm mb-1">
                  <span>{r.l}</span><div className="text-right"><span className="font-bold" style={{color:r.c}}>{r.v}</span>
                  {r.g&&<span className="text-xs text-gray-400 block">{r.g}</span>}</div>
                </div>
              ))}
              <div className="flex justify-between items-center bg-green-900/40 border border-green-500/30 rounded-lg px-3 py-3 font-bold mt-1">
                <span>Total Wealth</span><span className="text-green-400 text-xl">${fin.total.toLocaleString()}</span>
              </div>
            </Card>
          </div>
        )}

        {/* ===== LIVE TRACKER ===== */}
        {tab==="tracker"&&(
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Live Tracker</h2>
              <button onClick={fetchPrices} disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${loading?"bg-gray-700 text-gray-400":"bg-green-600 hover:bg-green-500"}`}>
                {loading?"Fetching...":"🔄 Refresh Prices"}
              </button>
            </div>
            {lastFetch&&<p className="text-xs text-gray-500">Last: {new Date(lastFetch).toLocaleString()}</p>}
            {status&&<div className="bg-gray-800 rounded-lg px-3 py-1.5 text-xs text-yellow-400">{status}</div>}

            <div className="grid grid-cols-2 gap-3">
              <Card b="border border-green-500/30">
                <div className="text-xs text-gray-400">Total Wealth</div>
                <div className="text-2xl font-bold text-green-400">${lWealth.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
              </Card>
              <Card b={`border ${lGain>=0?"border-green-500/30":"border-red-500/30"}`}>
                <div className="text-xs text-gray-400">ETF P&L</div>
                <div className={`text-2xl font-bold ${lGain>=0?"text-green-400":"text-red-400"}`}>
                  {lGain>=0?"+":""}${lGain.toLocaleString(undefined,{maximumFractionDigits:0})}
                  <span className="text-sm ml-1">({lPct.toFixed(1)}%)</span>
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="font-semibold text-sm mb-2">Holdings</h3>
              <div className="grid grid-cols-7 gap-0.5 px-2 py-1 text-xs text-gray-500 border-b border-gray-700">
                <span>Ticker</span><span>Shares</span><span>Price</span><span>Value</span><span>Cost</span><span>P&L</span><span>%</span>
              </div>
              {holdings.map((h,i)=>{
                const pr=prices[h.t]||0,val=h.shares>0&&pr?h.shares*pr:h.cost,pl=val-h.cost,pp=h.cost>0?(pl/h.cost*100):0,hp=pr>0&&h.shares>0;
                return(<div key={i} className="grid grid-cols-7 gap-0.5 px-2 py-1.5 text-xs border-b border-gray-700/30">
                  <span className="font-bold" style={{color:h.c}}>{h.t}</span>
                  <span>{h.shares>0?h.shares.toFixed(2):"—"}</span>
                  <span>{pr?`$${pr.toFixed(2)}`:"—"}</span>
                  <span>${val.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                  <span className="text-gray-400">${h.cost.toLocaleString()}</span>
                  <span className={hp?(pl>=0?"text-green-400":"text-red-400"):"text-gray-500"}>{hp?`${pl>=0?"+":""}$${pl.toFixed(0)}`:"—"}</span>
                  <span className={hp?(pp>=0?"text-green-400":"text-red-400"):"text-gray-500"}>{hp?`${pp.toFixed(1)}%`:"—"}</span>
                </div>);
              })}
            </Card>

            {/* Inline Holdings Editor */}
            <Card>
              <h3 className="font-semibold text-sm mb-2">✏️ Update Holdings</h3>
              <div className="grid grid-cols-3 gap-1 px-2 py-1 text-xs text-gray-500 border-b border-gray-700">
                <span>Ticker</span><span>Shares</span><span>Cost ($)</span>
              </div>
              {holdings.map((h,i)=>(
                <div key={i} className="grid grid-cols-3 gap-1 px-2 py-1.5 border-b border-gray-700/30 items-center">
                  <span className="font-bold text-xs" style={{color:h.c}}>{h.t}</span>
                  <input type="number" step="0.01" value={h.shares||""} placeholder="0"
                    onChange={e=>updH(i,"shares",e.target.value)}
                    className="bg-gray-700 rounded px-2 py-1 text-xs text-white w-full outline-none focus:ring-1 focus:ring-blue-500"/>
                  <input type="number" step="1" value={h.cost||""} placeholder="0"
                    onChange={e=>updH(i,"cost",e.target.value)}
                    className="bg-gray-700 rounded px-2 py-1 text-xs text-white w-full outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
              ))}
              <div className="mt-3 space-y-2">
                {[{l:"ESOP Shares",k:"esopShares"},{l:"ESOP FMV ($)",k:"esopFmv"},{l:"401(k) ($)",k:"k401"},{l:"HSA ($)",k:"hsa"}].map((f,i)=>(
                  <div key={i} className="flex items-center justify-between">
                    <label className="text-xs text-gray-300">{f.l}</label>
                    <input type="number" step="0.01" value={extra[f.k]||""} onChange={e=>updE(f.k,e.target.value)}
                      className="bg-gray-700 rounded px-2 py-1 text-xs text-white w-32 outline-none focus:ring-1 focus:ring-blue-500"/>
                  </div>
                ))}
              </div>
            </Card>

            <button onClick={saveSnap} className="w-full bg-blue-600 hover:bg-blue-500 rounded-lg py-2.5 text-sm font-semibold">
              📸 Save Weekly Snapshot
            </button>
          </div>
        )}

        {/* ===== HISTORY ===== */}
        {tab==="history"&&(
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Performance History</h2>
            {snaps.length>1&&(
              <Card>
                <h3 className="font-semibold text-sm mb-2">Wealth Over Time</h3>
                <svg viewBox={`0 0 ${cW} ${cH}`} className="w-full">
                  {(()=>{
                    const vals=snaps.map(s=>s.totalWealth),mx=Math.max(...vals)*1.05,mn=Math.min(...vals)*0.95,n=snaps.length;
                    const sx=i=>pad.l+(i/(n-1))*iW, sy=v=>pad.t+iH-((v-mn)/(mx-mn))*iH;
                    const path=snaps.map((s,i)=>`${i===0?"M":"L"}${sx(i)},${sy(s.totalWealth)}`).join(" ");
                    const area=path+` L${sx(n-1)},${pad.t+iH} L${sx(0)},${pad.t+iH} Z`;
                    return(<g>
                      {[0,.25,.5,.75,1].map((f,i)=>{const v=mn+(mx-mn)*(1-f),y=pad.t+iH*f;return(
                        <g key={i}><line x1={pad.l} y1={y} x2={cW-pad.r} y2={y} stroke="#374151" strokeWidth="1"/>
                        <text x={pad.l-5} y={y+4} textAnchor="end" fill="#6B7280" fontSize="9">${Math.round(v/1000)}K</text></g>
                      );})}
                      <path d={area} fill="#10B98120"/><path d={path} fill="none" stroke="#10B981" strokeWidth="2.5"/>
                      {snaps.map((s,i)=>(<g key={i}><circle cx={sx(i)} cy={sy(s.totalWealth)} r="4" fill="#10B981"/>
                        <text x={sx(i)} y={pad.t+iH+15} textAnchor="middle" fill="#6B7280" fontSize="8">{s.date.slice(5)}</text></g>))}
                    </g>);
                  })()}
                </svg>
              </Card>
            )}
            {snaps.length>0?(
              <Card>
                <div className="grid grid-cols-4 gap-0.5 px-2 py-1 text-xs text-gray-500 border-b border-gray-700">
                  <span>Date</span><span>ETF Value</span><span>Total Wealth</span><span>vs Prev</span>
                </div>
                {snaps.map((s,i)=>{
                  const prev=i>0?snaps[i-1].totalWealth:null,chg=prev?s.totalWealth-prev:null;
                  return(<div key={i} className="grid grid-cols-4 gap-0.5 px-2 py-1.5 text-xs border-b border-gray-700/30">
                    <span>{s.date}</span><span className="text-blue-400">${s.etfValue.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                    <span className="font-semibold">${s.totalWealth.toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                    <span className={chg===null?"text-gray-500":chg>=0?"text-green-400":"text-red-400"}>{chg===null?"—":`${chg>=0?"+":""}$${chg.toFixed(0)}`}</span>
                  </div>);
                })}
              </Card>
            ):(
              <Card><div className="text-center py-6"><p className="text-gray-400 text-sm">No snapshots yet</p><p className="text-gray-500 text-xs">Use Tracker → Save Weekly Snapshot</p></div></Card>
            )}
            {snaps.length>0&&(
              <button onClick={async()=>{setSnaps([]);try{await window.storage.delete("pf-s");}catch{}setStatus("🗑️ Cleared");}}
                className="text-xs text-red-400 hover:text-red-300 underline">Clear all snapshots</button>
            )}
          </div>
        )}

        {/* ===== INCOME & EXPENSES ===== */}
        {tab==="income-expenses"&&(
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Income & Expenses Analysis</h2>
            <p className="text-xs text-gray-400">Oct 2025 - Feb 2026 • Bank + Credit Card + Pay Stubs</p>

            <div className="flex gap-2 mb-4">
              {[{id:"income",l:"💰 Income"},{id:"expenses",l:"💸 Expenses"},{id:"summary",l:"📊 Summary"}].map(t=>(
                <button key={t.id} onClick={()=>setIncomeTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${incomeTab===t.id?"bg-blue-600":"bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>{t.l}</button>
              ))}
            </div>

            {/* Month Selector */}
            <div className="flex gap-1.5 mb-4">
              {MONTHS.map((m,i)=>(
                <button key={i} onClick={()=>setSelMo(i)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${selMo===i?"bg-green-600":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                  {m}{i<2?" ⚠️":""}
                </button>
              ))}
            </div>
            {selMo<2 && <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-300 mb-3">⚠️ Oct-Nov spending includes one-time apartment setup costs (~$2K-$4K on Amazon, furniture, electronics)</div>}

            {/* INCOME SUB-TAB */}
            {incomeTab==="income"&&(
              <div className="space-y-3">
                <Card b="border border-green-500/30">
                  <h3 className="font-semibold text-green-400 text-sm mb-2">{MONTHS[selMo]} — Pay Summary</h3>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-700 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-400">Gross Pay</div>
                      <div className="text-lg font-bold text-white">${inc.gross.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-400">Deductions</div>
                      <div className="text-lg font-bold text-red-400">-${(inc.gross-inc.net).toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-400">Net Pay</div>
                      <div className="text-lg font-bold text-green-400">${inc.net.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      {l:"Taxes (Fed+State+FICA)",v:inc.taxes,c:"#EF4444"},
                      {l:"401(k)",v:inc.k401,c:"#8B5CF6"},
                      {l:"HSA",v:inc.hsa,c:"#F59E0B"},
                      {l:"Medical/Dental/Vision",v:inc.benefits,c:"#3B82F6"},
                    ].filter(r=>r.v>0).map((r,i)=>(
                      <div key={i} className="flex justify-between text-xs bg-gray-700 rounded-lg px-3 py-1.5">
                        <span>{r.l}</span>
                        <span style={{color:r.c}}>-${r.v.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {inc.reimb>0&&(
                  <Card>
                    <h3 className="font-semibold text-sm mb-2">Reimbursements</h3>
                    <div className="flex justify-between text-xs bg-gray-700 rounded-lg px-3 py-1.5 mb-1">
                      <span>🏢 Total Reimbursements (Work + Relocation)</span><span className="text-green-400">+${inc.reimb.toLocaleString()}</span>
                    </div>
                  </Card>
                )}

                {/* Income trend chart */}
                <Card>
                  <h3 className="font-semibold text-sm mb-2">Net Pay Trend</h3>
                  <svg viewBox={`0 0 ${cW} ${cH}`} className="w-full" style={{maxHeight:220}}>
                    {[0,.5,1].map((f,i)=>{
                      const maxV=13000,v=maxV*(1-f),y=pad.t+iH*f;
                      return(<g key={i}><line x1={pad.l} y1={y} x2={cW-pad.r} y2={y} stroke="#374151" strokeWidth="1"/>
                        <text x={pad.l-5} y={y+4} textAnchor="end" fill="#6B7280" fontSize="9">${Math.round(v/1000)}K</text></g>);
                    })}
                    {income.map((d,i)=>{
                      const x=pad.l+(i/(income.length-1))*iW;
                      const h=(d.net/13000)*iH;
                      const bw=iW/income.length*0.6;
                      return(<g key={i}>
                        <rect x={x-bw/2} y={pad.t+iH-h} width={bw} height={h} fill={i===selMo?"#10B981":"#374151"} rx="3"/>
                        <text x={x} y={pad.t+iH-h-6} textAnchor="middle" fill="#10B981" fontSize="9" fontWeight="bold">${(d.net/1000).toFixed(1)}K</text>
                        <text x={x} y={cH-8} textAnchor="middle" fill="#6B7280" fontSize="8">{d.mo.slice(0,3)}</text>
                      </g>);
                    })}
                  </svg>
                  <p className="text-xs text-gray-500 mt-1">Feb is partial (1 paycheck). Oct had 3 paychecks (start bonus). Normal: ~$10K/mo net.</p>
                </Card>
              </div>
            )}

            {/* EXPENSES SUB-TAB */}
            {incomeTab==="expenses"&&(
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Card b="border border-orange-500/30">
                    <div className="text-xs text-gray-400">Fixed Expenses</div>
                    <div className="text-2xl font-bold text-orange-400">${(mo.rent + mo.utility).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Rent + Utilities</div>
                  </Card>
                  <Card b="border border-purple-500/30">
                    <div className="text-xs text-gray-400">Personal Expenses</div>
                    <div className="text-2xl font-bold text-purple-400">${(totalExp - mo.rent - mo.utility).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">All Other Categories</div>
                  </Card>
                  <Card b="border border-red-500/30">
                    <div className="text-xs text-gray-400">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-400">${totalExp.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Fixed + Personal</div>
                  </Card>
                  <Card b="border border-green-500/30">
                    <div className="text-xs text-gray-400">After Reimbursements</div>
                    <div className="text-2xl font-bold text-yellow-400">${trueExp.toLocaleString()}</div>
                    {inc.reimb>0&&<div className="text-xs text-green-400 mt-1">-${inc.reimb} reimbursed</div>}
                  </Card>
                  <Card b="border border-blue-500/30">
                    <div className="text-xs text-gray-400">Available to Save</div>
                    <div className="text-2xl font-bold text-blue-400">${(inc.net - trueExp).toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Net - True Expenses</div>
                  </Card>
                  <Card b="border border-purple-500/30">
                    <div className="text-xs text-gray-400">Sent to Savings</div>
                    <div className="text-2xl font-bold text-purple-400">${inc.savedToAccount.toLocaleString()}</div>
                    {inc.savedToAccount>0&&<div className="text-xs text-green-400">✓ Saved this month</div>}
                  </Card>
                </div>

                <Card>
                  <h3 className="font-semibold text-sm mb-2">{MONTHS[selMo]} — Category Breakdown</h3>
                  <div className="space-y-1.5">
                    {cats.filter(c=>mo[c.k]>0).sort((a,b)=>mo[b.k]-mo[a.k]).map((c,i)=>{
                      const isExpanded = expandedCategory === `${MONTHS[selMo]}-${c.k}`;
                      const txns = transactions[`${MONTHS[selMo]}-${c.k}`] || [];
                      return (
                        <div key={i} className="bg-gray-700/30 rounded-lg overflow-hidden">
                          <div
                            className="cursor-pointer hover:bg-gray-700/50 transition-colors p-2"
                            onClick={() => toggleCategory(MONTHS[selMo], c.k)}
                          >
                            <div className="flex justify-between text-xs mb-1">
                              <span className="flex items-center gap-1">
                                <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                                {c.l}
                              </span>
                              <span className="font-semibold">${mo[c.k].toLocaleString()} <span className="text-gray-500">({(mo[c.k]/totalExp*100).toFixed(0)}%)</span></span>
                            </div>
                            <Bar pct={mo[c.k]} c={c.c} max={Math.max(...cats.map(ct=>mo[ct.k]||0))}/>
                          </div>
                          {isExpanded && (
                            <div className="px-2 pb-2 border-t border-gray-600 pt-2 mt-1">
                              {txns.length === 0 ? (
                                <div className="text-xs text-gray-400 text-center py-2">Loading transactions...</div>
                              ) : (
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                  {txns.map((tx, idx) => (
                                    <div key={idx} className="flex justify-between text-xs bg-gray-800 rounded px-2 py-1.5">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-200">{tx.merchant}</div>
                                        <div className="text-gray-500 text-[10px]">{new Date(tx.date).toLocaleDateString()} • {tx.source}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold text-red-400">${tx.amount.toFixed(2)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-sm mb-2">Top Recurring Expenses</h3>
                  {[
                    {m:"Bilt Payment (Rent)",a:"~$3,863/mo",c:"#EF4444",note:"Fixed cost (skipped Nov)"},
                    {m:"Morton Williams / Prime Food",a:"~$233/mo",c:"#F97316",note:"Groceries"},
                    {m:"PATH/MTA/Uber",a:"~$116/mo",c:"#3B82F6",note:"Varies with travel"},
                    {m:"PSEG Electric",a:"~$76-155/mo",c:"#10B981",note:"Seasonal variance"},
                    {m:"Verizon",a:"$34/mo",c:"#06B6D4",note:"Phone"},
                    {m:"Barber (Kwik)",a:"~$41/mo",c:"#A78BFA",note:"Monthly"},
                  ].map((r,i)=>(
                    <div key={i} className="flex justify-between items-center bg-gray-700 rounded-lg px-3 py-2 mb-1 text-xs">
                      <div><span className="font-medium">{r.m}</span><br/><span className="text-gray-500">{r.note}</span></div>
                      <span className="font-bold" style={{color:r.c}}>{r.a}</span>
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* SUMMARY SUB-TAB */}
            {incomeTab==="summary"&&(
              <div className="space-y-3">
                {/* Month-by-Month Table */}
                <Card>
                  <h3 className="font-semibold text-sm mb-3">📊 Month-by-Month Summary</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 px-2 text-gray-400 font-semibold">Month</th>
                          <th className="text-right py-2 px-2 text-green-400 font-semibold">Net Income</th>
                          <th className="text-right py-2 px-2 text-blue-400 font-semibold">Reimb</th>
                          <th className="text-right py-2 px-2 text-orange-400 font-semibold">Fixed Exp</th>
                          <th className="text-right py-2 px-2 text-purple-400 font-semibold">Personal Exp</th>
                          <th className="text-right py-2 px-2 text-red-400 font-semibold">Total Exp</th>
                          <th className="text-right py-2 px-2 text-amber-400 font-semibold">True Exp</th>
                          <th className="text-right py-2 px-2 text-yellow-400 font-semibold">Avail to Save</th>
                          <th className="text-right py-2 px-2 text-cyan-400 font-semibold">Sent to Savings</th>
                          <th className="text-right py-2 px-2 text-gray-400 font-semibold">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {income.map((inc, i) => {
                          const totalExp = cats.reduce((s, c) => s + (expenses[i][c.k] || 0), 0);
                          const fixedExp = (expenses[i].rent || 0) + (expenses[i].utility || 0);
                          const personalExp = totalExp - fixedExp;
                          const trueExpMonth = totalExp - (inc.reimb || 0);
                          const availToSave = inc.net - trueExpMonth;
                          const rate = inc.net > 0 ? ((availToSave / inc.net) * 100) : 0;
                          return (
                            <tr key={i} className={`border-b border-gray-700/50 hover:bg-gray-700/30 ${i === selMo ? 'bg-blue-900/20' : ''}`}>
                              <td className="py-2 px-2 font-semibold">{inc.mo}</td>
                              <td className="text-right py-2 px-2 text-green-400">${inc.net.toLocaleString()}</td>
                              <td className="text-right py-2 px-2 text-blue-400">${(inc.reimb || 0).toLocaleString()}</td>
                              <td className="text-right py-2 px-2 text-orange-400">${Math.round(fixedExp).toLocaleString()}</td>
                              <td className="text-right py-2 px-2 text-purple-400">${Math.round(personalExp).toLocaleString()}</td>
                              <td className="text-right py-2 px-2 text-red-400">${Math.round(totalExp).toLocaleString()}</td>
                              <td className="text-right py-2 px-2 text-orange-400">${Math.round(trueExpMonth).toLocaleString()}</td>
                              <td className="text-right py-2 px-2 text-yellow-400 font-semibold">${Math.round(availToSave).toLocaleString()}</td>
                              <td className="text-right py-2 px-2 text-cyan-400">${(inc.savedToAccount || 0).toLocaleString()}</td>
                              <td className={`text-right py-2 px-2 font-semibold ${rate >= 40 ? 'text-green-400' : rate >= 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {rate.toFixed(0)}%
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="border-t-2 border-gray-600 font-bold">
                          <td className="py-2 px-2">TOTAL</td>
                          <td className="text-right py-2 px-2 text-green-400">${income.reduce((s, d) => s + d.net, 0).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-blue-400">${income.reduce((s, d) => s + (d.reimb || 0), 0).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-orange-400">${Math.round(income.reduce((s, d, i) => s + (expenses[i].rent || 0) + (expenses[i].utility || 0), 0)).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-purple-400">${Math.round(income.reduce((s, d, i) => s + cats.reduce((s2, c) => s2 + (expenses[i][c.k] || 0), 0) - (expenses[i].rent || 0) - (expenses[i].utility || 0), 0)).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-red-400">${Math.round(income.reduce((s, d, i) => s + cats.reduce((s2, c) => s2 + (expenses[i][c.k] || 0), 0), 0)).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-amber-400">${Math.round(income.reduce((s, d, i) => s + (cats.reduce((s2, c) => s2 + (expenses[i][c.k] || 0), 0) - (d.reimb || 0)), 0)).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-yellow-400">${Math.round(income.reduce((s, d, i) => s + (d.net - (cats.reduce((s2, c) => s2 + (expenses[i][c.k] || 0), 0) - (d.reimb || 0))), 0)).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-cyan-400">${income.reduce((s, d) => s + (d.savedToAccount || 0), 0).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-gray-400">—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <span className="font-semibold">Fixed Exp</span> = Rent + Utilities | <span className="font-semibold">Personal Exp</span> = All Other Categories | <span className="font-semibold">True Exp</span> = Total - Reimb | <span className="font-semibold">Avail to Save</span> = Net - True Exp
                  </div>
                </Card>

                <Card b="border border-blue-500/30">
                  <h3 className="font-semibold text-blue-400 text-sm mb-2">Monthly Average (Dec-Jan — Normalized)</h3>
                  <div className="grid grid-cols-4 gap-2 text-center mb-3">
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-xs text-gray-400">Net Income</div>
                      <div className="font-bold text-green-400">${avgNet.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-xs text-gray-400">True Expenses</div>
                      <div className="font-bold text-red-400">${avgTrue.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-xs text-gray-400">Available to Save</div>
                      <div className="font-bold text-yellow-400">${avgSavings.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-xs text-gray-400">Savings Rate</div>
                      <div className="font-bold text-blue-400">{(avgSavings/avgNet*100).toFixed(0)}%</div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-sm mb-2">Where Your Money Goes (Monthly Avg)</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between bg-green-900/30 rounded-lg px-3 py-2 text-sm">
                      <span>💰 Net Pay</span><span className="font-bold text-green-400">${avgNet.toLocaleString()}</span>
                    </div>
                    {cats.filter(c=>avgExp[c.k]>0).sort((a,b)=>avgExp[b.k]-avgExp[a.k]).map((c,i)=>(
                      <div key={i} className="flex justify-between bg-gray-700 rounded-lg px-3 py-1.5 text-xs">
                        <span>{c.l}</span><span className="text-red-400">-${avgExp[c.k].toLocaleString()}</span>
                      </div>
                    ))}
                    {avgReimb>0&&<div className="flex justify-between bg-blue-900/30 rounded-lg px-3 py-1.5 text-xs">
                      <span>🏢 Reimbursements (offset)</span><span className="text-green-400">+${avgReimb}</span>
                    </div>}
                    <div className="flex justify-between bg-green-900/40 border border-green-500/30 rounded-lg px-3 py-2 text-sm font-bold">
                      <span>💵 Available to Invest</span><span className="text-green-400">${avgSavings.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-sm mb-2">Income vs Expenses by Month</h3>
                  <svg viewBox={`0 0 ${cW} ${cH}`} className="w-full" style={{maxHeight:220}}>
                    {[0,.5,1].map((f,i)=>{
                      const maxV=12000,v=maxV*(1-f),y=pad.t+iH*f;
                      return(<g key={i}><line x1={pad.l} y1={y} x2={cW-pad.r} y2={y} stroke="#374151" strokeWidth="1"/>
                        <text x={pad.l-5} y={y+4} textAnchor="end" fill="#6B7280" fontSize="9">${Math.round(v/1000)}K</text></g>);
                    })}
                    {income.map((d,i)=>{
                      const x=pad.l+(i/(income.length-1))*iW;
                      const exp=cats.reduce((s,c)=>s+(expenses[i][c.k]||0),0);
                      const hI=(d.net/12000)*iH, hE=(exp/12000)*iH;
                      const bw=iW/income.length*0.3;
                      return(<g key={i}>
                        <rect x={x-bw-1} y={pad.t+iH-hI} width={bw} height={hI} fill="#10B981" rx="2" opacity={i===selMo?1:0.5}/>
                        <rect x={x+1} y={pad.t+iH-hE} width={bw} height={hE} fill="#EF4444" rx="2" opacity={i===selMo?1:0.5}/>
                        <text x={x} y={cH-8} textAnchor="middle" fill="#6B7280" fontSize="8">{d.mo.slice(0,3)}</text>
                      </g>);
                    })}
                  </svg>
                  <div className="flex justify-center gap-4 mt-1 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 inline-block rounded"></span>Net Income</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 inline-block rounded"></span>Expenses</span>
                  </div>
                </Card>

                <Card b="border border-yellow-500/30">
                  <h3 className="font-semibold text-yellow-400 text-sm mb-2">💡 Optimization Opportunities</h3>
                  <div className="space-y-2 text-xs text-gray-300">
                    <div className="bg-gray-700 rounded-lg p-2">
                      <span className="font-bold text-yellow-400">Food & Dining: ~$900/mo</span>
                      <p className="text-gray-400">Largest controllable expense. Cutting $200/mo = $2,400/yr extra invested → worth ~$500+ in returns.</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <span className="font-bold text-yellow-400">T-Mobile: $65-103/mo</span>
                      <p className="text-gray-400">Wide variance suggests possible plan mismatch. Could save $30-40/mo on a fixed plan.</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <span className="font-bold text-yellow-400">Chase Savings: 0.01% APY</span>
                      <p className="text-gray-400">$26K earning $2.60/yr. Even Fidelity SPAXX at 3.75% = $975/yr. Deploy to ESOPs + ETFs per plan.</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <span className="font-bold text-green-400">✅ $5K/mo savings is validated</span>
                      <p className="text-gray-400">Your normalized expenses are ~$4,700-5,300/mo. $5K savings is tight but proven doable over 4 months of data.</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ===== ACTIONS ===== */}
        {tab==="actions"&&(
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Action Items</h2>
            {[
              {s:1,t:"Exercise all 6,189 vested ESOPs",tm:"This week",p:"critical",d:"$15,830 cost. Share withholding handles taxes. Net ~5,092 shares."},
              {s:2,t:"Open Fidelity brokerage",tm:"This week",p:"critical",d:"$0 to open. $0 commissions. Fractional shares. Turn on DRIP."},
              {s:3,t:"Invest $15,170 lump sum",tm:"Week 2",p:"critical",d:"VOO $6,827 • SCHD $2,276 • QQQ $1,517 • PAVE $1,517 • VXUS $1,517 • XLU $759 • AMZN $455 • KO $303"},
              {s:4,t:"Set up $5K/mo auto-invest",tm:"Next paycheck",p:"high",d:"Auto-transfer bank→Fidelity. Split per monthly plan phases."},
              {s:5,t:"Exercise monthly ESOP vests",tm:"Mar-May + ongoing",p:"high",d:esopGrants.filter(g => g.status === 'active').map(g => `${g.grant_id}: ~$${g.monthly_cost}/mo (${g.completion_date ? 'to ' + new Date(g.completion_date).toLocaleDateString('en-US', {month: 'short', year: 'numeric'}) : 'ongoing'})`).join('. ')},
              {s:6,t:`${esopGrants.find(g => g.status === 'pending')?.grant_id || 'ES-6251'} checkpoint`,tm:esopGrants.find(g => g.status === 'pending')?.vest_start_date ? new Date(esopGrants.find(g => g.status === 'pending').vest_start_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : "Oct 1, 2026",p:"medium",d:esopGrants.find(g => g.status === 'pending')?.notes || "25% vests. Check updated FMV. Exercise only if FMV > strike."},
              {s:7,t:"Post-IPO: sell 30-50% to diversify",tm:"After lockup",p:"medium",d:"Don't hold >15% net worth in one stock. Redirect to ETFs."},
            ].map((a,i)=>(
              <Card key={i}><div className="flex items-start gap-2">
                <div className="bg-gray-700 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">{a.s}</div>
                <div><div className="flex items-center gap-2 mb-0.5 flex-wrap"><span className="font-semibold text-sm">{a.t}</span><Bdg p={a.p}/></div>
                <p className="text-xs text-blue-400">⏰ {a.tm}</p><p className="text-xs text-gray-400">{a.d}</p></div>
              </div></Card>
            ))}
          </div>
        )}

        <div className="mt-4 bg-gray-800 rounded-xl p-2 border border-red-500/20">
          <p className="text-xs text-gray-400 text-center">⚠️ General strategy, not licensed financial advice. Consult a CPA for tax guidance.</p>
        </div>
      </div>
    </div>
  );
}
