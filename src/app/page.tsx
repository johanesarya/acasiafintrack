"use client";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  ShieldCheck,
  ReceiptText,
  Sparkles,
  Activity,
  Calendar,
  Layers,
  Search,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Transaction {
  id: string;
  transaction_date: string;
  type: "income" | "expense";
  category: string;
  item_name: string;
  amount: number;
  notes?: string;
  raw_source?: string;
}

interface FinancialRatio {
  display_month: string;
  savings_ratio: number;
  liquidity_ratio: number;
}

const CATEGORY_COLORS = [
  "#f8fafc", // slate-50
  "#60a5fa", // blue-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#f87171", // red-400
  "#a78bfa", // violet-400
  "#94a3b8", // slate-400
];

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ratios, setRatios] = useState<FinancialRatio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<
    "all" | "income" | "expense"
  >("all");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false })
        .limit(50);

      const { data: ratioData } = await supabase
        .from("view_financial_ratios_5m")
        .select("*");

      if (txData) setTransactions(txData as Transaction[]);
      if (ratioData) setRatios(ratioData as FinancialRatio[]);
      setLoading(false);
    }

    fetchData();

    // Realtime Supabase listener
    const channel = supabase
      .channel("realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        (payload) => {
          setTransactions((prev) => [payload.new as Transaction, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter & Agregasi
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = selectedType === "all" || t.type === selectedType;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        t.item_name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [transactions, selectedType, searchQuery]);

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce((acc, curr) => acc + Number(curr.amount), 0),
    [transactions],
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((acc, curr) => acc + Number(curr.amount), 0),
    [transactions],
  );

  const netCashFlow = totalIncome - totalExpense;

  const currentRatio = ratios[ratios.length - 1] || {
    savings_ratio: 0,
    liquidity_ratio: 0,
  };

  // Data Pie Chart
  const pieData = useMemo(() => {
    const expenseByCat = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc: Record<string, number>, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
        return acc;
      }, {});

    return Object.keys(expenseByCat)
      .map((cat) => ({
        name: cat,
        value: expenseByCat[cat],
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400 font-mono text-sm tracking-widest uppercase">
        <Activity className="w-4 h-4 mr-2 animate-pulse" />
        Synchronizing ledger...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar Minimalis */}
      <nav className="border-b border-slate-800/80 px-6 md:px-10 py-4 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden ring-1 ring-slate-700/60">
            <Image
              src="/favicon.ico" // ganti sesuai path logo kamu di /public
              alt="Acasia Studio logo"
              fill
              sizes="36px"
              priority
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">
              Acasia Studio
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              Automated Financial Intelligence
            </p>
          </div>
        </div>
      </nav>

      <main className="px-6 md:px-10 py-8 space-y-8 max-w-7xl mx-auto">
        {/* Hero Section / Primary Financial Health Score */}
        <section className="border-b border-slate-800/80 pb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">
            Net Cash Flow (Current Month)
          </p>
          <h2
            className={`text-3xl md:text-5xl font-serif tracking-tight break-words ${
              netCashFlow >= 0 ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            Rp {netCashFlow.toLocaleString("id-ID")}
          </h2>
          <p className="mt-4 text-sm text-slate-400 max-w-2xl leading-relaxed">
            Pemasukan tercatat{" "}
            <p className="text-lg md:text-xl font-serif mt-2 text-emerald-300 break-words">
              +Rp {totalIncome.toLocaleString("id-ID")}
            </p>{" "}
            vs Pengeluaran{" "}
            <p className="text-lg md:text-xl font-serif mt-2 text-emerald-300 break-words">
              -Rp {totalExpense.toLocaleString("id-ID")}
            </p>
            .
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden">
            <div className="bg-slate-950 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest">
                <TrendingUp className="w-3 h-3" /> Savings Ratio
              </div>
              <p className="text-2xl font-serif mt-2 text-slate-100">
                {currentRatio.savings_ratio}%
              </p>
              <p className="text-[10px] text-slate-600 mt-1">Benchmark: ≥20%</p>
            </div>
            <div className="bg-slate-950 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> Liquidity Ratio
              </div>
              <p className="text-2xl font-serif mt-2 text-slate-100">
                {currentRatio.liquidity_ratio}x
              </p>
              <p className="text-[10px] text-slate-600 mt-1">
                Emergency Buffer: 3-6x
              </p>
            </div>
            <div className="bg-slate-950 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest">
                <ArrowUpRight className="w-3 h-3" /> Total Income
              </div>
              <p className="text-2xl font-serif mt-2 text-emerald-300">
                Rp {totalIncome.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-600 mt-1">
                Dari {transactions.filter((t) => t.type === "income").length}{" "}
                entri
              </p>
            </div>
            <div className="bg-slate-950 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest">
                <ArrowDownLeft className="w-3 h-3" /> Total Expense
              </div>
              <p className="text-2xl font-serif mt-2 text-rose-300">
                Rp {totalExpense.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-600 mt-1">
                Dari {transactions.filter((t) => t.type === "expense").length}{" "}
                entri
              </p>
            </div>
          </div>
        </section>

        {/* 2 Kolom Chart: Tren 5 Bulan & Breakdown Pengeluaran */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart: Tren 5 Bulan */}
          <div className="lg:col-span-2 border border-slate-800/80 rounded-2xl p-6 bg-slate-900/30">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-serif tracking-tight">
                  Financial Health Dynamics
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tren Savings Ratio (%) dan Rasio Likuiditas 5 bulan terakhir
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Savings (%)
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  Liquidity (x)
                </div>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={ratios}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorSavings"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorLiquidity"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="display_month"
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      color: "#f8fafc",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings_ratio"
                    stroke="#34d399"
                    strokeWidth={2}
                    fill="url(#colorSavings)"
                  />
                  <Area
                    type="monotone"
                    dataKey="liquidity_ratio"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    fill="url(#colorLiquidity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart: Kategori Pengeluaran */}
          <div className="border border-slate-800/80 rounded-2xl p-6 bg-slate-900/30">
            <div className="mb-6">
              <h3 className="text-lg font-serif tracking-tight">
                Kategori Pengeluaran
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Proporsi alokasi dana belanja
              </p>
            </div>

            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((_, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) =>
                      `Rp ${Number(val).toLocaleString("id-ID")}`
                    }
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "8px",
                      border: "1px solid #334155",
                      color: "#f8fafc",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
              {pieData.slice(0, 4).map((item, idx) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                      }}
                    />
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-slate-500 font-mono">
                    Rp {item.value.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabel Transaksi Terkini + Smart Filter */}
        <section className="border border-slate-800/80 rounded-2xl bg-slate-900/30 overflow-hidden">
          {/* Controls Bar */}
          <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-serif tracking-tight flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-slate-400" />
                Ledger Transaksi Realtime
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sinkronisasi otomatis dengan bot Telegram & analisa Gemini
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-500 font-sans"
                />
              </div>

              {/* Type Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                {(["all", "income", "expense"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedType(tab)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                      selectedType === tab
                        ? "bg-slate-100 text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800/80">
                  <th className="text-left py-3 px-6 font-normal">Tanggal</th>
                  <th className="text-left py-3 px-6 font-normal">
                    Deskripsi Transaksi
                  </th>
                  <th className="text-left py-3 px-6 font-normal">Kategori</th>
                  <th className="text-right py-3 px-6 font-normal">Nominal</th>
                  <th className="text-left py-3 px-6 font-normal">
                    AI Persona Commentary
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-slate-500 text-xs italic"
                    >
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-4 px-6 text-slate-400 whitespace-nowrap font-mono text-xs">
                        {tx.transaction_date}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {tx.type === "income" ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span className="text-slate-100">{tx.item_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-2 py-0.5 rounded-full border border-slate-700 text-slate-400 text-[10px] uppercase tracking-wider">
                          {tx.category}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-6 text-right font-mono whitespace-nowrap ${
                          tx.type === "income"
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"} Rp{" "}
                        {Number(tx.amount).toLocaleString("id-ID")}
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        {tx.notes ? (
                          <div className="flex items-start gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                            <span className="text-slate-400 italic text-xs leading-relaxed">
                              {tx.notes}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-700">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[10px] uppercase tracking-widest text-slate-600">
          <p>© Acasia Financial Studio · Automated Ledger v2</p>
          <p className="flex items-center gap-2">
            <Layers className="w-3 h-3" />
            Powered by Supabase · Gemini · Telegram Bot
          </p>
        </footer>
      </main>
    </div>
  );
}
