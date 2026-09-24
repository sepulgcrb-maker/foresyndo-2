import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  Download,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Receipt,
  FileText,
  AlertCircle,
  X,
  PieChart as PieChartIcon,
  ShieldCheck,
  Building,
  HardHat,
  ChevronRight,
  Printer,
} from 'lucide-react';
import {
  ContractorTransaction,
  ContractorTransactionType,
  ContractorExpenseCategory,
  ProjectInfo,
  PaymentTerm,
  UserRole,
  ActiveTab,
} from '../../types';
import { formatIDR } from '../../utils/calculations';

interface ContractorFinanceProps {
  project: ProjectInfo;
  transactions: ContractorTransaction[];
  paymentTerms: PaymentTerm[];
  userRole: UserRole;
  activeUserName: string;
  onAddTransaction: (trx: ContractorTransaction) => void;
  onUpdateTransaction: (trx: ContractorTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddAuditLog?: (action: string, details: string) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

const CATEGORIES: ContractorExpenseCategory[] = [
  'Penerimaan Termin Owner',
  'Modal Awal / Kas Kontraktor',
  'Pengadaan Material & Supplier',
  'Upah Tenaga Kerja & Mandor',
  'Sewa Alat Berat & Solar BBM',
  'Operasional Lapangan & Site Office',
  'Kasbon Mandor & Subkontraktor',
  'K3, Perizinan & Biaya QA/QC',
];

export const ContractorFinance: React.FC<ContractorFinanceProps> = ({
  project,
  transactions,
  paymentTerms,
  userRole,
  activeUserName,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddAuditLog,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'transactions' | 'breakdown' | 'cashflow' | 'owner_termin'>('transactions');
  const [filterType, setFilterType] = useState<'all' | 'Pemasukan' | 'Pengeluaran'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTrxModalOpen, setIsTrxModalOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<ContractorTransaction | null>(null);

  // Form states
  const [trxType, setTrxType] = useState<ContractorTransactionType>('Pengeluaran');
  const [trxCategory, setTrxCategory] = useState<ContractorExpenseCategory>('Pengadaan Material & Supplier');
  const [trxDate, setTrxDate] = useState(new Date().toISOString().split('T')[0]);
  const [trxDescription, setTrxDescription] = useState('');
  const [trxAmount, setTrxAmount] = useState<number>(5000000);
  const [trxPaymentMethod, setTrxPaymentMethod] = useState<'Transfer Bank' | 'Tunai / Kas Kecil' | 'Cek / Bilyet Giro'>('Transfer Bank');
  const [trxRecipientOrPayer, setTrxRecipientOrPayer] = useState('');
  const [trxReceiptRef, setTrxReceiptRef] = useState('');
  const [trxNotes, setTrxNotes] = useState('');

  // Financial calculations
  const totalInflow = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const totalOutflow = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const netBalance = totalInflow - totalOutflow;

  // Realized Termin from Owner
  const terminReceivedFromOwner = useMemo(() => {
    return paymentTerms
      .filter((term) => term.status === 'Paid')
      .reduce((acc, term) => acc + term.amount, 0);
  }, [paymentTerms]);

  // Expenses Breakdown by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    CATEGORIES.forEach((cat) => (map[cat] = 0));
    transactions.forEach((t) => {
      if (t.type === 'Pengeluaran') {
        map[t.category] = (map[t.category] || 0) + t.amount;
      }
    });
    return map;
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = filterType === 'all' || t.type === filterType;
      const matchCat = filterCategory === 'all' || t.category === filterCategory;
      const matchSearch =
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.recipientOrPayer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.receiptRef && t.receiptRef.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchCat && matchSearch;
    });
  }, [transactions, filterType, filterCategory, searchQuery]);

  // Submit new transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxDescription.trim() || trxAmount <= 0) return;

    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = transactions.length + 1;
    const trxNumber = `TRX-GMP/${yearMonth}-${String(seq).padStart(3, '0')}`;

    const newTrx: ContractorTransaction = {
      id: `TRX-${Date.now().toString().slice(-4)}`,
      transactionNumber: trxNumber,
      date: trxDate,
      type: trxType,
      category: trxCategory,
      description: trxDescription.trim(),
      amount: Number(trxAmount),
      paymentMethod: trxPaymentMethod,
      recipientOrPayer: trxRecipientOrPayer.trim() || 'Internal Lapangan',
      receiptRef: trxReceiptRef.trim() || `KWT-${Date.now().toString().slice(-6)}`,
      approvedBy: activeUserName || project.siteManager || 'EKO YULIANTO',
      status: 'Terverifikasi',
      notes: trxNotes.trim(),
    };

    onAddTransaction(newTrx);
    onAddAuditLog?.(
      'ADD_TRANSACTION',
      `Mencatat ${trxType} proyek ${trxNumber} senilai ${formatIDR(trxAmount)} (${trxCategory})`
    );

    // Reset and close
    setTrxDescription('');
    setTrxAmount(5000000);
    setTrxRecipientOrPayer('');
    setTrxReceiptRef('');
    setTrxNotes('');
    setIsTrxModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
              <Wallet className="w-3.5 h-3.5" />
              <span>Sistem Pembukuan &amp; Arus Kas Kontraktor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Keuangan Proyek (Cash Flow Kontraktor)
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Pencatatan realisasi arus kas keluar-masuk, kontrol pengeluaran supplier &amp; mandor, serta pemantauan termin dari Owner untuk <strong>{project.name}</strong>.
            </p>
            <div className="pt-1 text-xs text-indigo-200/80 flex items-center gap-2">
              <span>Badan Usaha:</span>
              <strong className="text-amber-300 font-bold">
                {project.contractor || 'PT. GONG MBE LINK PAMUNGKAS'}
              </strong>
              <span>&bull; Admin Keuangan:</span>
              <strong className="text-white font-medium">{project.financeAdmin || 'COKRO'}</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setTrxType('Pengeluaran');
                setTrxCategory('Pengadaan Material & Supplier');
                setIsTrxModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 cursor-pointer transition-all active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Catat Pengeluaran</span>
            </button>
            <button
              onClick={() => {
                setTrxType('Pemasukan');
                setTrxCategory('Penerimaan Termin Owner');
                setIsTrxModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ Catat Pemasukan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Kas Masuk</p>
            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
              {formatIDR(totalInflow)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Termin + Modal Kerja Kontraktor
            </p>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Kas Keluar (Biaya)</p>
            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 truncate">
              {formatIDR(totalOutflow)}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Material, Upah, Alat, &amp; Ops</p>
          </div>
        </div>

        {/* Current Net Balance */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sisa Saldo Kas Proyek</p>
            <h3 className="text-lg font-black text-blue-600 dark:text-blue-400 truncate">
              {formatIDR(netBalance)}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Likuiditas Kas Lapangan</p>
          </div>
        </div>

        {/* Contract Value & Target Margin */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nilai Kontrak Proyek</p>
            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
              {formatIDR(project.contractValue)}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Sisa Termin: {formatIDR(project.contractValue - terminReceivedFromOwner)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'transactions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Buku Kas Transaksi ({transactions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('breakdown')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'breakdown'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Rekap Biaya per Kategori
          </button>
          <button
            onClick={() => setActiveSubTab('owner_termin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'owner_termin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Pencairan Termin Owner</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px] font-bold">
              {paymentTerms.filter((p) => p.status === 'Paid').length} Cair
            </span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi, nomor kwitansi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">Semua Arus</option>
            <option value="Pemasukan">Pemasukan (+)</option>
            <option value="Pengeluaran">Pengeluaran (-)</option>
          </select>
        </div>
      </div>

      {/* SUB-TAB 1: BUKU KAS & TRANSAKSI */}
      {activeSubTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Buku Jurnal Keuangan Kontraktor Pelaksana
              </h3>
              <p className="text-xs text-slate-500">
                Setiap mutasi dana diverifikasi oleh Site Manager &amp; Admin Keuangan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Cetak Jurnal</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">No. Transaksi &amp; Tgl</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Kategori Biaya</th>
                  <th className="py-3 px-4">Uraian / Keterangan</th>
                  <th className="py-3 px-4">Penerima / Pembayar</th>
                  <th className="py-3 px-4 text-right">Nominal (IDR)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{trx.transactionNumber}</div>
                      <div className="text-[11px] text-slate-500">{trx.date}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          trx.type === 'Pemasukan'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {trx.type === 'Pemasukan' ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        <span>{trx.type}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {trx.category}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                        {trx.description}
                      </p>
                      {trx.receiptRef && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {trx.receiptRef}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {trx.recipientOrPayer}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-black font-mono text-sm ${
                        trx.type === 'Pemasukan'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {trx.type === 'Pemasukan' ? '+' : '-'} {formatIDR(trx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{trx.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingReceipt(trx)}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Lihat Kuitansi / Voucher Kas"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus transaksi ${trx.transactionNumber}?`)) {
                              onDeleteTransaction(trx.id);
                            }
                          }}
                          className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600"
                          title="Hapus Transaksi"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada data transaksi yang sesuai dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REKAP BIAYA PER KATEGORI */}
      {activeSubTab === 'breakdown' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-500" />
              <span>Distribusi Pengeluaran Riil Proyek</span>
            </h3>
            <p className="text-xs text-slate-500">
              Alokasi biaya langsung terhadap pelaksanaan konstruksi fisik Gedung Foresyndo 2
            </p>

            <div className="space-y-4 pt-2">
              {CATEGORIES.filter((c) => c !== 'Penerimaan Termin Owner' && c !== 'Modal Awal / Kas Kontraktor').map((cat) => {
                const amount = expenseByCategory[cat] || 0;
                const percent = totalOutflow > 0 ? (amount / totalOutflow) * 100 : 0;

                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">{formatIDR(amount)}</span>
                        <span className="text-slate-400 text-[11px] ml-1.5">({percent.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Analisis Finansial &amp; Margin Kontraktor</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Perbandingan nilai kontrak terhadap realisasi pengeluaran fisik saat ini
              </p>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Total Nilai Kontrak RAB Netto</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{formatIDR(project.contractValue)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Total Dana Diterima dari Owner</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatIDR(totalInflow)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Realisasi Pengeluaran Aktual</span>
                  <strong className="font-mono text-rose-600 dark:text-rose-400">{formatIDR(totalOutflow)}</strong>
                </div>
                <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                  <span className="text-slate-900 dark:text-white">Sisa Likuiditas Saldo Kas Kontraktor</span>
                  <strong className="font-mono text-blue-600 dark:text-blue-400">{formatIDR(netBalance)}</strong>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Status Kesehatan Finansial Proyek: AMAN (SURPLUS KAS)</p>
                <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                  Penerimaan Uang Muka Termin 1 (25%) telah mencukupi pembiayaan pengadaan besi, beton, dan upah awal minggu ke-1 hingga ke-4 tanpa hambatan likuiditas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PENCAIRAN TERMIN OWNER */}
      {activeSubTab === 'owner_termin' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Tahapan Pencairan Termin dari Owner (PT. FORESYNDO GLOBAL INDONESIA)
              </h3>
              <p className="text-xs text-slate-500">
                Pemberian hak tagihan klaim kontraktor berdasarkan progres opname fisik yang divalidasi Konsultan MK
              </p>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('termin')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Buka Modul Termin Utama</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentTerms.map((term) => (
              <div
                key={term.termNumber}
                className={`p-4 rounded-xl border transition-all ${
                  term.status === 'Paid'
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : term.status === 'Verified'
                    ? 'border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    TERMIN {term.termNumber} ({term.percentage}%)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      term.status === 'Paid'
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        : term.status === 'Verified'
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                        : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {term.status === 'Paid' ? 'Sudah Cair' : term.status === 'Verified' ? 'Siap Dicairkan' : 'Proses Pengajuan'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">{term.title}</h4>
                <p className="text-base font-black text-slate-900 dark:text-white font-mono mt-1">
                  {formatIDR(term.amount)}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <p>Syarat Progres Fisik: <strong>{term.targetProgress}%</strong></p>
                  {term.paymentDate && <p>Tgl Pencairan: <strong className="text-emerald-600">{term.paymentDate}</strong></p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: INPUT TRANSAKSI KEUANGAN */}
      {isTrxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-indigo-700 to-blue-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Pencatatan Mutasi Kas Proyek Kontraktor</h3>
                <p className="text-xs text-indigo-200">
                  Form mutasi kas masuk / kas keluar resmi PT. GONG MBE LINK PAMUNGKAS
                </p>
              </div>
              <button
                onClick={() => setIsTrxModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Mutasi Kas *
                  </label>
                  <select
                    value={trxType}
                    onChange={(e) => setTrxType(e.target.value as ContractorTransactionType)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Pengeluaran">Kas Keluar / Biaya (-)</option>
                    <option value="Pemasukan">Kas Masuk / Termin (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Transaksi *
                  </label>
                  <input
                    type="date"
                    required
                    value={trxDate}
                    onChange={(e) => setTrxDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Biaya / Akun Pembukuan *
                </label>
                <select
                  value={trxCategory}
                  onChange={(e) => setTrxCategory(e.target.value as ContractorExpenseCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Uraian / Deskripsi Pembayaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembayaran pengadaan pasir pasang 10 rit ke CV Pasir Galunggung"
                  value={trxDescription}
                  onChange={(e) => setTrxDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal Biaya (IDR) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={trxAmount}
                    onChange={(e) => setTrxAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                    {formatIDR(trxAmount)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={trxPaymentMethod}
                    onChange={(e) => setTrxPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Tunai / Kas Kecil">Tunai / Kas Kecil</option>
                    <option value="Cek / Bilyet Giro">Cek / Bilyet Giro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Penerima / Pembayar
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: PT. SCG ReadyMix / Mandor Sukirno"
                    value={trxRecipientOrPayer}
                    onChange={(e) => setTrxRecipientOrPayer(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Bukti / Kuitansi
                  </label>
                  <input
                    type="text"
                    placeholder="KWT-2026/09/012 / No Bilyet"
                    value={trxReceiptRef}
                    onChange={(e) => setTrxReceiptRef(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan opname lapangan, nota toko, atau instruksi site manager..."
                  value={trxNotes}
                  onChange={(e) => setTrxNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTrxModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KUITANSI / VOUCHER KAS DETAIL */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Bukti Kas Keluar / Masuk Proyek</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 text-xs">
              {/* Slip Kop */}
              <div className="border-b pb-3 flex justify-between items-start">
                <div>
                  <h3 className="font-black text-sm uppercase">{project.contractor || 'PT. GONG MBE LINK PAMUNGKAS'}</h3>
                  <p className="text-[11px] text-slate-500">Proyek: {project.name}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs">{viewingReceipt.transactionNumber}</span>
                  <p className="text-[10px] text-slate-400">{viewingReceipt.date}</p>
                </div>
              </div>

              {/* Detail fields */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Jenis Transaksi:</span>
                  <strong className={viewingReceipt.type === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'}>
                    {viewingReceipt.type} ({viewingReceipt.category})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Penerima / Pembayar:</span>
                  <strong>{viewingReceipt.recipientOrPayer}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Bayar:</span>
                  <strong>{viewingReceipt.paymentMethod}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uraian:</span>
                  <strong className="text-right max-w-xs">{viewingReceipt.description}</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-sm">Nominal:</span>
                  <span className="font-black font-mono text-base text-blue-600 dark:text-blue-400">
                    {formatIDR(viewingReceipt.amount)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t text-center">
                <div>
                  <p className="text-slate-400 mb-10">Penerima / Penyetor,</p>
                  <p className="font-bold">( {viewingReceipt.recipientOrPayer} )</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-10">Disetujui Site Manager,</p>
                  <p className="font-bold">( {viewingReceipt.approvedBy || project.siteManager || 'EKO YULIANTO'} )</p>
                  <p className="text-[10px] text-slate-500">Site Manager Pelaksana</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
