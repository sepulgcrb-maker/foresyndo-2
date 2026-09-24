-- ====================================================================
-- SKEMA SQL LENGKAP: REKANAN SUPPLIER, PURCHASE ORDER (PO) & KEUANGAN
-- APLIKASI: MONITORING PROYEK GEDUNG FORESYNDO 2
-- KONTRAKTOR UTAMA: PT. GONG MBE LINK PAMUNGKAS
-- OWNER: PT. FORESYNDO GLOBAL INDONESIA
-- KONSULTAN MK: PT. ARCON ENJINIRING KONSULTAN
-- DIALECT: PostgreSQL 14+ / Supabase
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. TABEL: supplier_partners (Direktori Mitra Supplier & Subkontraktor)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.supplier_partners (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  pic_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  npwp TEXT,
  top TEXT NOT NULL DEFAULT 'NET 14 Hari',
  rating NUMERIC(3,2) DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 5.0),
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Prioritas', 'On Hold', 'Nonaktif')),
  notes TEXT,
  total_orders_count INTEGER DEFAULT 0,
  total_spent NUMERIC(15,2) DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.supplier_partners IS 'Direktori mitra pemasok bahan bangunan, ready mix, baja, dan subkontraktor PT. Gong Mbe Link Pamungkas.';
COMMENT ON COLUMN public.supplier_partners.top IS 'Term of Payment (e.g. CBD, NET 14 Hari, NET 30 Hari, DP 20% Sisa COD).';

-- Indeks Performa Supplier
CREATE INDEX IF NOT EXISTS idx_supplier_partners_project_id ON public.supplier_partners(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_partners_category ON public.supplier_partners(category);
CREATE INDEX IF NOT EXISTS idx_supplier_partners_status ON public.supplier_partners(status);
CREATE INDEX IF NOT EXISTS idx_supplier_partners_rating ON public.supplier_partners(rating DESC);


-- ====================================================================
-- 2. TABEL: purchase_orders (Surat Pesanan / Purchase Order Material)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  supplier_id TEXT NOT NULL REFERENCES public.supplier_partners(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  supplier_name TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
  delivery_date TEXT,
  material_item TEXT NOT NULL,
  quantity NUMERIC(15,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit TEXT NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'Belum Lunas' CHECK (payment_status IN ('Belum Lunas', 'DP Dibayar', 'Lunas', 'Dibatalkan')),
  delivery_status TEXT NOT NULL DEFAULT 'Draft' CHECK (delivery_status IN ('Draft', 'Dipesan', 'Sebagian Terkirim', 'Diterima Lengkap', 'Selesai', 'Dibatalkan')),
  delivery_order_ref TEXT,
  notes TEXT,
  signed_by TEXT NOT NULL DEFAULT 'EKO YULIANTO',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.purchase_orders IS 'Surat Pesanan Bahan (Purchase Order) resmi yang diterbitkan Site Manager kepada mitra supplier.';
COMMENT ON COLUMN public.purchase_orders.po_number IS 'Nomor unik PO dengan format PO-GMP/YYYY/MM-XXX.';
COMMENT ON COLUMN public.purchase_orders.delivery_order_ref IS 'Nomor Surat Jalan (DO) pengiriman barang dari supplier.';

-- Indeks Performa Purchase Orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON public.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON public.purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON public.purchase_orders(date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_payment_status ON public.purchase_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_delivery_status ON public.purchase_orders(delivery_status);


-- ====================================================================
-- 3. TABEL: purchase_order_items (Rincian Item Material Multi-Item PO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id TEXT PRIMARY KEY DEFAULT ('POI-' || substr(md5(random()::text), 1, 8)),
  po_id TEXT NOT NULL REFERENCES public.purchase_orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  quantity NUMERIC(15,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit TEXT NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items(po_id);


-- ====================================================================
-- 4. TABEL: contractor_transactions (Buku Kas & Keuangan Proyek Kontraktor)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.contractor_transactions (
  id TEXT PRIMARY KEY,
  transaction_number TEXT UNIQUE NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
  type TEXT NOT NULL CHECK (type IN ('Pemasukan', 'Pengeluaran')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'Transfer Bank' CHECK (payment_method IN ('Transfer Bank', 'Tunai / Kas Kecil', 'Cek / Bilyet Giro')),
  recipient_or_payer TEXT NOT NULL,
  receipt_ref TEXT,
  approved_by TEXT NOT NULL DEFAULT 'EKO YULIANTO',
  status TEXT NOT NULL DEFAULT 'Terverifikasi' CHECK (status IN ('Terverifikasi', 'Menunggu Verifikasi', 'Draf', 'Dibatalkan')),
  notes TEXT,
  po_id TEXT REFERENCES public.purchase_orders(id) ON UPDATE CASCADE ON DELETE SET NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.contractor_transactions IS 'Pencatatan realisasi arus kas keluar-masuk (Cash Flow) PT. Gong Mbe Link Pamungkas di lapangan.';

-- Indeks Performa Transaksi Kontraktor
CREATE INDEX IF NOT EXISTS idx_contractor_trx_number ON public.contractor_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_contractor_trx_project_id ON public.contractor_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_contractor_trx_type ON public.contractor_transactions(type);
CREATE INDEX IF NOT EXISTS idx_contractor_trx_category ON public.contractor_transactions(category);
CREATE INDEX IF NOT EXISTS idx_contractor_trx_date ON public.contractor_transactions(date);
CREATE INDEX IF NOT EXISTS idx_contractor_trx_po_id ON public.contractor_transactions(po_id);


-- ====================================================================
-- 5. TRIGGER & FUNCTION: Otomatisasi Statistik Rekanan Supplier
-- ====================================================================
CREATE OR REPLACE FUNCTION public.fn_sync_supplier_po_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_sup_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_sup_id := OLD.supplier_id;
  ELSE
    target_sup_id := NEW.supplier_id;
  END IF;

  UPDATE public.supplier_partners
  SET
    total_orders_count = (
      SELECT COUNT(*)::INTEGER
      FROM public.purchase_orders
      WHERE supplier_id = target_sup_id AND delivery_status != 'Dibatalkan'
    ),
    total_spent = COALESCE((
      SELECT SUM(total_amount)::NUMERIC(15,2)
      FROM public.purchase_orders
      WHERE supplier_id = target_sup_id AND delivery_status != 'Dibatalkan'
    ), 0),
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_sup_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_supplier_po_stats ON public.purchase_orders;
CREATE TRIGGER trg_sync_supplier_po_stats
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_supplier_po_stats();


-- ====================================================================
-- 6. VIEW ANALITIK: Rekap Transaksi, PO & Monitoring Pembayaran
-- ====================================================================
CREATE OR REPLACE VIEW public.v_supplier_orders_summary AS
SELECT
  s.id AS supplier_id,
  s.name AS supplier_name,
  s.category,
  s.pic_name,
  s.phone,
  s.rating,
  s.status AS supplier_status,
  COUNT(po.id) AS total_po_count,
  COALESCE(SUM(po.total_amount), 0) AS total_po_amount,
  COALESCE(SUM(CASE WHEN po.payment_status = 'Lunas' THEN po.total_amount ELSE 0 END), 0) AS total_paid_amount,
  COALESCE(SUM(CASE WHEN po.payment_status != 'Lunas' AND po.delivery_status != 'Dibatalkan' THEN po.total_amount ELSE 0 END), 0) AS total_unpaid_amount,
  COUNT(CASE WHEN po.delivery_status = 'Diterima Lengkap' OR po.delivery_status = 'Selesai' THEN 1 END) AS completed_orders_count
FROM public.supplier_partners s
LEFT JOIN public.purchase_orders po ON s.id = po.supplier_id
GROUP BY s.id, s.name, s.category, s.pic_name, s.phone, s.rating, s.status;

CREATE OR REPLACE VIEW public.v_contractor_cashflow_summary AS
SELECT
  project_id,
  COALESCE(SUM(CASE WHEN type = 'Pemasukan' THEN amount ELSE 0 END), 0) AS total_inflow,
  COALESCE(SUM(CASE WHEN type = 'Pengeluaran' THEN amount ELSE 0 END), 0) AS total_outflow,
  COALESCE(SUM(CASE WHEN type = 'Pemasukan' THEN amount ELSE -amount END), 0) AS net_cash_balance,
  COUNT(id) AS total_transactions
FROM public.contractor_transactions
GROUP BY project_id;


-- ====================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.supplier_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_transactions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'supplier_partners',
    'purchase_orders',
    'purchase_order_items',
    'contractor_transactions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Akses publik %s" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Akses publik %s" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;


-- ====================================================================
-- 8. PUBLIKASI REALTIME SUPABASE
-- ====================================================================
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'supplier_partners',
    'purchase_orders',
    'purchase_order_items',
    'contractor_transactions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;


-- ====================================================================
-- 9. SEED DATA AWAL (KONTRAKTOR PT. GONG MBE LINK PAMUNGKAS)
-- ====================================================================
-- Data Mitra Supplier Terverifikasi
INSERT INTO public.supplier_partners (
  id, project_id, name, category, pic_name, phone, whatsapp, email,
  address, city, bank_name, bank_account_number, bank_account_holder,
  npwp, top, rating, status, notes, total_orders_count, total_spent
) VALUES
(
  'SUP-001',
  'FORESYNDO-PROJECT-2',
  'PT. SCG ReadyMix Indonesia (Batching Plant Kertajati)',
  'Beton & Semen',
  'Ir. Bambang Triyono',
  '+62 812-9844-3211',
  '+62 812-9844-3211',
  'readymix.kertajati@scg.co.id',
  'Jl. Raya Bandara Kertajati Km 7, Sukamulya, Kertajati',
  'Kabupaten Majalengka',
  'Bank Mandiri',
  '131-00-9821443-1',
  'PT SCG ReadyMix Indonesia',
  '01.324.556.7-438.000',
  'NET 14 Hari',
  4.9,
  'Prioritas',
  'Pemasok utama beton ready mix mutu K-350 struktur kolom, balok, dan plat lantai. Kapasitas suplai 60 m3/jam.',
  8,
  420000000
),
(
  'SUP-002',
  'FORESYNDO-PROJECT-2',
  'PT. Krakatau Wajatama Steel (Distributor Resmi Cirebon)',
  'Besi & Baja Tulangan',
  'Hendri Kusuma, ST',
  '+62 813-2211-7788',
  '+62 813-2211-7788',
  'sales@krakatauwajatama-crb.com',
  'Kawasan Pergudangan Weru No. 18, Plered',
  'Cirebon',
  'BCA (Bank Central Asia)',
  '142-887-9911',
  'PT Krakatau Wajatama Steel',
  '01.889.332.1-422.000',
  'NET 30 Hari',
  4.8,
  'Prioritas',
  'Pemasok baja tulangan sirip/ulir BjTS 420B (D10, D13, D16, D19, D22) berstandar SNI 2052:2017 & bersertifikat uji tarik.',
  5,
  785000000
),
(
  'SUP-003',
  'FORESYNDO-PROJECT-2',
  'CV. Pasir Galunggung Quarry Mandiri',
  'Agregat & Pasir',
  'H. Komarudin',
  '+62 852-2009-4455',
  '+62 852-2009-4455',
  'pasirgalunggung.quarry@gmail.com',
  'Jl. Raya Kadipaten - Tomo No. 45',
  'Kabupaten Majalengka',
  'BRI (Bank Rakyat Indonesia)',
  '0109-01-002344-50-8',
  'CV Pasir Galunggung Quarry',
  '31.445.889.2-438.000',
  'CBD / Cash On Delivery per Dump Truck',
  4.7,
  'Aktif',
  'Suplai pasir beton cuci gunung Galunggung kadar lumpur <3% dan batu split pecah 1/2 & 2/3.',
  14,
  96000000
),
(
  'SUP-004',
  'FORESYNDO-PROJECT-2',
  'PT. Broco Aerated Concrete & Mortar Utama',
  'Bata Ringan & Mortar',
  'Denny Kurnia',
  '+62 811-9988-234',
  '+62 811-9988-234',
  'denny.broco@mortarutama.com',
  'Kawasan Industri Dawuan Blok B4',
  'Karawang - Majalengka Depo',
  'Bank Danamon',
  '358-992-1002',
  'PT Broco Aerated Concrete',
  '02.112.554.9-054.000',
  'DP 20% Sisa NET 14 Hari',
  4.6,
  'Aktif',
  'Bata ringan AAC presisi 60x20x10 cm, semen instan thin bed mortar perekat & plesteran dinding gedung.',
  4,
  124500000
),
(
  'SUP-005',
  'FORESYNDO-PROJECT-2',
  'CV. Triputra Jaya Elektrik & Mechanical',
  'MEP & Elektrikal',
  'Ricky Sanjaya, ST',
  '+62 818-0912-3344',
  '+62 818-0912-3344',
  'triputra.mep@yahoo.co.id',
  'Jl. KH Abdul Halim No. 182, Tonjong',
  'Kabupaten Majalengka',
  'Bank BJB',
  '0012-9988-12001',
  'CV Triputra Jaya Elektrik',
  '24.998.112.5-438.000',
  'NET 14 Hari',
  4.8,
  'Aktif',
  'Kabel Supreme NYM/NYY, pipa conduit Clipsal, panel distribusi MDP/SDP, dan aksesoris tray kabel.',
  6,
  88500000
),
(
  'SUP-006',
  'FORESYNDO-PROJECT-2',
  'PT. Sinar Majalengka Heavy Equipment & Safety',
  'Alat Berat & Safety Tools',
  'Dedi Supriadi',
  '+62 821-1776-9080',
  '+62 821-1776-9080',
  'sinarmajalengka.rental@gmail.com',
  'Jl. Lingkar Luar Baribis No. 12',
  'Kabupaten Majalengka',
  'Bank Mandiri',
  '131-00-7766551-9',
  'PT Sinar Majalengka Rental',
  '03.221.776.4-438.000',
  'CBD Sewa Mingguan',
  4.7,
  'Aktif',
  'Sewa Bar Bender, Bar Cutter, Scaffolding 500 set, Genset Silent 100kVA, dan APD K3.',
  9,
  165000000
)
ON CONFLICT (id) DO NOTHING;

-- Data Purchase Orders Awal
INSERT INTO public.purchase_orders (
  id, po_number, project_id, supplier_id, supplier_name, date, delivery_date,
  material_item, quantity, unit, unit_price, total_amount, payment_status,
  delivery_status, delivery_order_ref, notes, signed_by
) VALUES
(
  'PO-001',
  'PO-GMP/2026/09-001',
  'FORESYNDO-PROJECT-2',
  'SUP-002',
  'PT. Krakatau Wajatama Steel (Distributor Cirebon)',
  '2026-09-02',
  '2026-09-04',
  'Besi Beton Ulir D16 & D13 BjTS 420B SNI (Panjang 12m)',
  2500,
  'batang',
  125000,
  312500000,
  'Lunas',
  'Diterima Lengkap',
  'DO-KW/2026/09/881',
  'Telah diperiksa QC Lapangan (KIKI) dan disahkan Site Manager (EKO YULIANTO). Surat jalan & uji lab lengkap.',
  'EKO YULIANTO'
),
(
  'PO-002',
  'PO-GMP/2026/09-002',
  'FORESYNDO-PROJECT-2',
  'SUP-001',
  'PT. SCG ReadyMix Indonesia (Kertajati)',
  '2026-09-05',
  '2026-09-06',
  'Beton Ready Mix K-350 NFA Slump 12±2 cm (Pengecoran Kolom Lt. 1)',
  45,
  'm³',
  950000,
  42750000,
  'DP Dibayar',
  'Diterima Lengkap',
  'DO-SCG/09-4412',
  'Pengecoran shift pagi menggunakan Concrete Pump Truck. Slump test 11 cm lolos uji MK.',
  'EKO YULIANTO'
),
(
  'PO-003',
  'PO-GMP/2026/09-003',
  'FORESYNDO-PROJECT-2',
  'SUP-003',
  'CV. Pasir Galunggung Quarry Mandiri',
  '2026-09-06',
  '2026-09-07',
  'Pasir Cor Galunggung & Batu Split 1/2',
  80,
  'm³',
  320000,
  25600000,
  'Lunas',
  'Diterima Lengkap',
  'DO-PGQ/09-012',
  'Dropping 10 rit dump truck ke stockpile barat proyek. Kondisi bersih bebas sampah/lumpur.',
  'COKRO'
),
(
  'PO-004',
  'PO-GMP/2026/09-004',
  'FORESYNDO-PROJECT-2',
  'SUP-004',
  'PT. Broco Aerated Concrete & Mortar Utama',
  '2026-09-10',
  '2026-09-16',
  'Bata Ringan AAC Tebal 10 cm & Semen Mortar Thin Bed',
  75,
  'm³',
  650000,
  48750000,
  'Belum Lunas',
  'Dipesan',
  'DO-PENDING',
  'Pengiriman terjadwal mulai pekerjaan pasangan dinding lantai semi-basement & lantai 1.',
  'EKO YULIANTO'
),
(
  'PO-005',
  'PO-GMP/2026/09-005',
  'FORESYNDO-PROJECT-2',
  'SUP-006',
  'PT. Sinar Majalengka Heavy Equipment & Safety',
  '2026-09-12',
  '2026-09-13',
  'Sewa Bulanan Mesin Bar Bender, Bar Cutter & Genset 100kVA Silent',
  1,
  'Paket / Bulan',
  18500000,
  18500000,
  'Lunas',
  'Diterima Lengkap',
  'DO-SMH/2026/09-03',
  'Alat berat tiba di lokasi dalam kondisi prima dan dioperasikan oleh operator bersertifikat SIO.',
  'EKO YULIANTO'
)
ON CONFLICT (id) DO NOTHING;

-- Data Transaksi Arus Kas Kontraktor Awal
INSERT INTO public.contractor_transactions (
  id, transaction_number, project_id, date, type, category, description,
  amount, payment_method, recipient_or_payer, receipt_ref, approved_by, status, notes, po_id
) VALUES
(
  'TRX-001',
  'TRX-GMP/2026/08-001',
  'FORESYNDO-PROJECT-2',
  '2026-08-25',
  'Pemasukan',
  'Penerimaan Termin Owner',
  'Pencairan Uang Muka (Down Payment 25%) dari Owner PT. FORESYNDO GLOBAL INDONESIA',
  3615440245,
  'Transfer Bank',
  'PT. FORESYNDO GLOBAL INDONESIA',
  'KWT-FGI/DP-001',
  'Rohman Priyambodo',
  'Terverifikasi',
  'Ditransfer via Bank Mandiri Rekening PT. Gong Mbe Link Pamungkas.',
  NULL
),
(
  'TRX-002',
  'TRX-GMP/2026/08-002',
  'FORESYNDO-PROJECT-2',
  '2026-08-28',
  'Pemasukan',
  'Modal Awal / Kas Kontraktor',
  'Injeksi Modal Kas Lapangan Operasional Site Office PT. GONG MBE LINK PAMUNGKAS',
  100000000,
  'Transfer Bank',
  'Kas Kantor Pusat PT. Gong Mbe Link',
  'BKT-PST/2026/08',
  'Rohman Priyambodo',
  'Terverifikasi',
  'Dana kas kecil (petty cash) dan operasional awal mobilisasi alat.',
  NULL
),
(
  'TRX-003',
  'TRX-GMP/2026/09-001',
  'FORESYNDO-PROJECT-2',
  '2026-09-02',
  'Pengeluaran',
  'Pengadaan Material & Supplier',
  'Pembayaran Pelunasan Besi Beton D16/D13 ke PT. Krakatau Wajatama Steel (PO-001)',
  312500000,
  'Transfer Bank',
  'PT. Krakatau Wajatama Steel',
  'TRF-BCA/0902-881',
  'EKO YULIANTO',
  'Terverifikasi',
  'Pelunasan faktur PO-001 sesuai kesepakatan TOP NET 30 Hari yang dipercepat.',
  'PO-001'
),
(
  'TRX-004',
  'TRX-GMP/2026/09-002',
  'FORESYNDO-PROJECT-2',
  '2026-09-06',
  'Pengeluaran',
  'Pengadaan Material & Supplier',
  'Pembayaran Pasir Cor & Batu Split 10 rit ke CV. Pasir Galunggung Quarry (PO-003)',
  25600000,
  'Transfer Bank',
  'CV. Pasir Galunggung Quarry',
  'TRF-BRI/0906-112',
  'COKRO',
  'Terverifikasi',
  'Pembayaran tunai transfer per pengiriman dump truck.',
  'PO-003'
),
(
  'TRX-005',
  'TRX-GMP/2026/09-003',
  'FORESYNDO-PROJECT-2',
  '2026-09-07',
  'Pengeluaran',
  'Upah Tenaga Kerja & Mandor',
  'Pembayaran Upah Borongan & Harian Tukang / Mandor Periode Minggu ke-1 (42 Pekerja)',
  38750000,
  'Tunai / Kas Kecil',
  'Mandor Sukirno, Mandor Rohmat, & Mandor Daryono',
  'BKT-UPH/09-01',
  'EKO YULIANTO',
  'Terverifikasi',
  'Slip absensi mingguan telah divalidasi dan dihitung oleh Admin Keuangan.',
  NULL
),
(
  'TRX-006',
  'TRX-GMP/2026/09-004',
  'FORESYNDO-PROJECT-2',
  '2026-09-12',
  'Pengeluaran',
  'Sewa Alat Berat & Solar BBM',
  'Pembayaran Sewa Bulanan Bar Bender, Bar Cutter & Genset Silent 100kVA (PO-005)',
  18500000,
  'Transfer Bank',
  'PT. Sinar Majalengka Heavy Equipment',
  'TRF-MDR/0912-77',
  'EKO YULIANTO',
  'Terverifikasi',
  'Periode sewa 12 September - 12 Oktober 2026.',
  'PO-005'
)
ON CONFLICT (id) DO NOTHING;
