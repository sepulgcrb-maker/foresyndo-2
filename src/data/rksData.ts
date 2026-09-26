import { RKSChapter } from '../types';

export interface RKSMetaInfo {
  projectTitle: string;
  documentTitle: string;
  documentNumber: string;
  revision: string;
  effectiveDate: string;
  ownerName: string;
  ownerRepresentative: string;
  consultantMK: string;
  contractorName: string;
  contractorSiteManager: string;
  contractValueIDR: number;
  durationDays: number;
  totalChapters: number;
  totalClauses: number;
  tripartiteSignatories: {
    role: string;
    name: string;
    organization: string;
    signed: boolean;
    date: string;
  }[];
}

export const RKS_META_INFO: RKSMetaInfo = {
  projectTitle: 'Pembangunan Gedung Kantor & Fasilitas PT Foresyndo Global Indonesia (FORESYNDO 2)',
  documentTitle: 'RENCANA KERJA DAN SYARAT-SYARAT (RKS) & SPESIFIKASI TEKNIS PELAKSANAAN',
  documentNumber: 'RKS-TEK-01/FGI-KONT/VIII/2026',
  revision: 'Rev. 01 (Final Disetujui Bersama)',
  effectiveDate: '01 September 2026',
  ownerName: 'PT. FORESYNDO GLOBAL INDONESIA',
  ownerRepresentative: 'HASANUDIN (Direktur Utama)',
  consultantMK: 'PT. BINA REKAYASA KONSULTAN (Ir. SAEPUL ANWAR, MT)',
  contractorName: 'PT. BANGUN CIPTA KARYA UTAMA',
  contractorSiteManager: 'EKO YULIANTO, ST',
  contractValueIDR: 14461760981,
  durationDays: 270,
  totalChapters: 10,
  totalClauses: 38,
  tripartiteSignatories: [
    {
      role: 'Pemberi Tugas (Owner)',
      name: 'HASANUDIN',
      organization: 'PT. Foresyndo Global Indonesia',
      signed: true,
      date: '2026-08-31',
    },
    {
      role: 'Konsultan MK / Pengawas',
      name: 'Ir. SAEPUL ANWAR, MT',
      organization: 'PT. Bina Rekayasa Konsultan',
      signed: true,
      date: '2026-08-31',
    },
    {
      role: 'Kontraktor Pelaksana',
      name: 'Rohman Priyambodo / Eko Yulianto, ST',
      organization: 'PT. Bangun Cipta Karya Utama',
      signed: true,
      date: '2026-08-31',
    },
  ],
};

export const OFFICIAL_RKS_CHAPTERS: RKSChapter[] = [
  {
    id: 'bab-1',
    chapterNumber: 'BAB I',
    title: 'KETENTUAN UMUM & SYARAT ADMINISTRASI KONTRAK',
    category: 'Administrasi',
    description: 'Landasan hukum, hierarki dokumen teknis, hubungan kerja para pihak, masa pelaksanaan, jaminan, asuransi, dan prosedur korespondensi resmi proyek.',
    clauses: [
      {
        number: 'Pasal 1.1',
        title: 'Penjelasan Umum & Hierarki Dokumen Proyek',
        standards: ['UU No. 2 Tahun 2017 tentang Jasa Konstruksi', 'Perlem LKPP No. 12 Tahun 2021'],
        content:
          'Pekerjaan yang tercakup dalam dokumen ini adalah Pembangunan Gedung PT Foresyndo Global Indonesia (FORESYNDO 2) 14 Sektor. Apabila terdapat pertentangan klausul antara dokumen lelang dan pelaksanaan, maka berlaku hierarki hukum berikut: (1) Surat Perjanjian Kontrak Utama & Addendum, (2) Surat Perintah Kerja (SPK), (3) Rencana Kerja dan Syarat-Syarat (RKS), (4) Gambar Kerja Terlaksana (DED/Approved Shop Drawing), (5) Rencana Anggaran Biaya (RAB resmi).',
        subClauses: [
          {
            code: '1.1.a',
            text: 'Kontraktor wajib meneliti seluruh gambar kerja dan RKS sebelum memulai pekerjaan pada setiap sektor.',
            requirement: 'Wajib diteliti & dilaporkan tertulis selambat-lambatnya 7 hari sebelum pekerjaan dimulai',
          },
          {
            code: '1.1.b',
            text: 'Ketidaksesuaian ukuran lapangan dengan gambar kerja wajib dikonfirmasikan tertulis kepada Konsultan MK melalui Request for Information (RFI).',
            requirement: 'Toleransi pengukuran Uitzet mak. 3 mm',
          },
        ],
      },
      {
        number: 'Pasal 1.2',
        title: 'Waktu Pelaksanaan, Denda Keterlambatan & Jaminan',
        standards: ['Permen PUPR No. 14 Tahun 2020'],
        content:
          'Jangka waktu penyelesaian seluruh pekerjaan fisik ditetapkan selama 270 (dua ratus tujuh puluh) hari kalender terhitung sejak tanggal diterbitkannya Surat Perintah Mulai Kerja (SPMK). Kontraktor wajib menyerahkan Jaminan Pelaksanaan sebesar 5% dari nilai kontrak dari Bank Pemerintah atau Asuransi rekanan resmi sebelum penandatanganan kontrak.',
        subClauses: [
          {
            code: '1.2.a',
            text: 'Denda keterlambatan ditetapkan sebesar 1‰ (satu permil) per hari keterlambatan dari bagian kontrak yang belum diselesaikan, setinggi-tingginya 5% dari total nilai kontrak.',
            requirement: 'Maksimal 5% dari Nilai Kontrak Rp 14.461.760.981',
          },
          {
            code: '1.2.b',
            text: 'Masa Pemeliharaan ditetapkan selama 180 (seratus delapan puluh) hari kalender terhitung sejak tanggal Serah Terima Pertama (BAST-1 / PHO).',
            requirement: 'Retensi 5% senilai Rp 723.088.049 ditahan hingga BAST-2 FHO',
          },
        ],
      },
      {
        number: 'Pasal 1.3',
        title: 'Sistem Pembayaran Termin & Rekonsiliasi Opname Lapangan',
        standards: ['Standar Akuntansi Konstruksi Indonesia'],
        content:
          'Pembayaran prestasi pekerjaan dilaksanakan berdasarkan 4 tahapan termin (DP 25%, Termin 2 bobot 25%, Termin 3 bobot 50%, dan Termin Pelunasan 100% saat BAST-1). Setiap pengajuan termin wajib dilengkapi Berita Acara Pemeriksaan Fisik (BAP), foto dokumentasi progres 0%-100%, kurva-S tervalidasi, dan ditandatangani ketiga pihak.',
      },
    ],
  },
  {
    id: 'bab-2',
    chapterNumber: 'BAB II',
    title: 'SISTEM MANAJEMEN KESELAMATAN KONSTRUKSI (SMKK / K3)',
    category: 'K3',
    description: 'Penerapan standar keselamatan kerja, kesehatan lingkungan proyek, APD wajib, mitigasi kecelakaan kerja (Zero Accident), dan asuransi tenaga kerja.',
    clauses: [
      {
        number: 'Pasal 2.1',
        title: 'Kewajiban Penggunaan Alat Pelindung Diri (APD)',
        standards: ['Permen PUPR No. 10 Tahun 2021 tentang SMKK', 'Permenakertrans No. 08/MEN/VII/2010'],
        content:
          'Setiap personil yang berada di area proyek wajib mengenakan APD standar: Helm Keselamatan SNI (Putih untuk Owner/MK/Tamu, Kuning untuk Pekerja, Biru untuk Mekanik/Listrik, Hijau untuk Safety/K3), Rompi Reflektor Scotchlite, dan Sepatu Keselamatan (Safety Shoes berkepala baja). Pekerja pada ketinggian > 1.8 meter wajib menggunakan Full Body Harness dengan double lanyard berpengait karabiner baja.',
        subClauses: [
          {
            code: '2.1.a',
            text: 'Kontraktor wajib menyediakan APD cadangan bagi seluruh tamu proyek dan personil pengawas.',
            requirement: 'Minimal 15 set APD cadangan siap pakai di kantor proyek',
          },
          {
            code: '2.1.b',
            text: 'Pelanggaran terhadap penggunaan APD dikenakan sanksi peringatan lisan, tertulis, dan denda administratif Rp 250.000,- per kejadian.',
            requirement: 'Zero Tolerance Policy untuk keselamatan kerja',
          },
        ],
      },
      {
        number: 'Pasal 2.2',
        title: 'Safety Induction, Tool Box Meeting & Asuransi BPJS TK',
        standards: ['UU No. 24 Tahun 2011 tentang BPJS'],
        content:
          'Seluruh tenaga kerja wajib didaftarkan pada program BPJS Ketenagakerjaan Sektor Jasa Konstruksi. Setiap pagi sebelum aktivitas dimulai pukul 07.45 WIB, Petugas K3 Kontraktor bersama Mandor wajib menyelenggarakan Safety Morning Talk / Tool Box Meeting selama 10-15 menit untuk mengidentifikasi bahaya harian (Job Safety Analysis).',
      },
    ],
  },
  {
    id: 'bab-3',
    chapterNumber: 'BAB III',
    title: 'PEKERJAAN PERSIAPAN & PENGUKURAN (UITZET)',
    category: 'Administrasi',
    description: 'Pembersihan lapangan, pengukuran patok acuan Bench Mark (BM), pemasangan bouwplank presisi, penyediaan kantor direksi keet, pagar pengaman, dan utilitas kerja.',
    clauses: [
      {
        number: 'Pasal 3.1',
        title: 'Pengukuran & Pemasangan Bouwplank Titik Duga (Bench Mark)',
        standards: ['SNI 03-2835-2002', 'Tata Cara Pengukuran Topografi Konstruksi'],
        content:
          'Titik duga elevasi ±0.00 lantai dasar harus ditentukan berdasarkan Bench Mark (BM) permanen yang disetujui bersama oleh Konsultan MK dan Owner. Papan bouwplank menggunakan kayu meranti kelas II ukuran 2/20 cm yang diserut lurus pada sisi atasnya, dipasang kokoh dengan tiang kaso 5/7 cm setiap jarak 1.50 meter.',
        subClauses: [
          {
            code: '3.1.a',
            text: 'Pengecekan kesikuan sudut bangunan menggunakan alat Total Station / Theodolite digital bersertifikat kalibrasi aktif.',
            requirement: 'Akurasi pembacaan sudut minimal 2 detik, toleransi jarak ±2 mm',
          },
          {
            code: '3.1.b',
            text: 'Penandaan as kolom dan garis as pondasi pada bouwplank diberi tanda cat merah terang dan paku baja.',
            requirement: 'Wajib divalidasi tanda tangan bersama pada Berita Acara Uitzet',
          },
        ],
      },
      {
        number: 'Pasal 3.2',
        title: 'Kantor Direksi Keet, Gudang Semen & Fasilitas Sementara',
        standards: ['Standar Sarana Penunjang Proyek PUPR'],
        content:
          'Kontraktor wajib mendirikan Direksi Keet yang representatif untuk ruang rapat bersama tiga pihak lengkap dengan meja rapat, whiteboard, pendingin ruangan (AC), komputer, printer, kotak P3K, dan display gambar kerja terlaksana. Gudang semen wajib dibuat dengan lantai panggung kayu minimal 20 cm dari permukaan tanah dan tertutup kedap air.',
      },
    ],
  },
  {
    id: 'bab-4',
    chapterNumber: 'BAB IV',
    title: 'PEKERJAAN STRUKTUR PONDASI & TANAH',
    category: 'Struktur',
    description: 'Galian tanah, pemancangan tiang pancang prestressed concrete, bobok kepala tiang, lantai kerja, dan pembuatan pile cap bertulang.',
    clauses: [
      {
        number: 'Pasal 4.1',
        title: 'Pemancangan Tiang Pancang Spun Pile Ø 40 cm',
        standards: ['SNI 8460:2017 tentang Persyaratan Perancangan Geoteknik', 'ASTM D1143 (Pile Load Test)'],
        content:
          'Tiang pancang menggunakan Prestressed Concrete Spun Pile diameter 40 cm kelas B/C dengan kuat tekan beton minimal K-500 (f\'c 41.5 MPa) produk pabrikasi berlisensi SNI. Pemancangan menggunakan hydraulic static pile driver (HSPD) atau drop hammer dengan energi pukulan yang cukup tanpa merusak integritas tiang pancang.',
        subClauses: [
          {
            code: '4.1.a',
            text: 'Kedalaman pemancangan tiang wajib mencapai lapisan tanah keras dengan nilai N-SPT ≥ 50 atau berdasarkan final kalendering hitungan Hiley / formula EN.',
            requirement: 'Kalendering akhir maksimal 10 pukulan menghasilkan penurunan < 25 mm',
          },
          {
            code: '4.1.b',
            text: 'Pengujian integritas tiang (Pile Integrity Test - PIT) dilakukan pada 100% tiang terpasang, serta uji beban statik (Loading Test) pada tiang uji yang ditentukan Konsultan MK.',
            requirement: 'Uji PIT 100% tiang, PDA test minimal 2 titik tiang uji',
          },
        ],
      },
      {
        number: 'Pasal 4.2',
        title: 'Pemotongan Kepala Tiang, Lantai Kerja & Pile Cap',
        standards: ['SNI 2847:2019 Persyaratan Beton Struktural'],
        content:
          'Kepala tiang pancang dibobok rapi dengan menyisakan stek besi tulangan minimal 40D (40 kali diameter tulangan) masuk ke dalam badan pile cap sebagai pengikat monolitik. Di bawah pile cap dan tie beam wajib diberi lantai kerja (Lean Concrete) beton mutu f\'c 10 MPa (K-125) tebal minimal 10 cm di atas lapisan pasir urug padat 10 cm.',
      },
    ],
  },
  {
    id: 'bab-5',
    chapterNumber: 'BAB V',
    title: 'PEKERJAAN STRUKTUR BETON BERTULANG & PEMBESIAN',
    category: 'Struktur',
    description: 'Spesifikasi material semen, agregat, slump test, pengecoran beton ready mix K-300, pembesian tulangan ulir SNI, bekisting film face, dan masa curing beton.',
    clauses: [
      {
        number: 'Pasal 5.1',
        title: 'Mutu Beton Ready Mix K-300 / f\'c 25 MPa',
        standards: ['SNI 2847:2019', 'SNI 03-2493-2002', 'ASTM C39 (Compressive Strength)'],
        content:
          'Seluruh struktur beton bertulang (Pile Cap, Tie Beam, Kolom Struktur K1/K2, Balok Induk/Anak, dan Plat Lantai) wajib menggunakan beton siap pakai (Ready Mix) dari batching plant tersertifikasi dengan mutu minimal K-300 (f\'c = 24.9 MPa ~ 25 MPa). Nilai slump saat tiba di lokasi proyek adalah 10 ± 2 cm.',
        subClauses: [
          {
            code: '5.1.a',
            text: 'Setiap truk mixer tiba di lokasi proyek wajib dilakukan Slump Test oleh QC Kontraktor disaksikan Petugas MK sebelum beton diizinkan dituang.',
            requirement: 'Slump 10±2 cm. Dilarang menambah air ke dalam truk mixer di lapangan',
          },
          {
            code: '5.1.b',
            text: 'Pengambilan benda uji silinder Ø 15 cm x 30 cm atau kubus 15x15x15 cm diambil 1 set (3 sampel) untuk setiap 5 m³ pengecoran atau minimal 1 set per truk mixer.',
            requirement: 'Uji tekan pada usia 7 hari (min. 65%), 14 hari (min. 88%), dan 28 hari (100% K-300)',
          },
          {
            code: '5.1.c',
            text: 'Pengecoran wajib dipadatkan menggunakan concrete vibrator mekanis dengan sudut penusukan tegak lurus dan dilarang menyentuh tulangan pembesian.',
            requirement: 'Durasi vibrasi 10-15 detik per titik tusukan hingga gelembung udara hilang',
          },
        ],
      },
      {
        number: 'Pasal 5.2',
        title: 'Besi Tulangan Baja (BjTS 420B Ulir & BjTP 280 Polos)',
        standards: ['SNI 2052:2017 tentang Baja Tulangan Beton', 'ASTM A615'],
        content:
          'Besi tulangan harus baru, bebas karat mengelupas, oli, dan minyak. Tulangan diameter ≥ 10 mm (D10, D13, D16, D19, D22, D25) menggunakan baja tulangan sirip/ulir mutu BjTS 420B (tegangan leleh fy = 420 MPa). Tulangan diameter < 10 mm (Ø6, Ø8) menggunakan baja tulangan polos mutu BjTP 280 (fy = 280 MPa). Setiap pengiriman wajib disertai Mill Certificate asli dari pabrik terdaftar SNI.',
        subClauses: [
          {
            code: '5.2.a',
            text: 'Toleransi diameter nominal tulangan tidak boleh melebihi ketentuan toleransi SNI 2052:2017 (maksimal deviasi berat/panjang ±3.5%).',
            requirement: 'Dilarang menggunakan besi non-SNI atau besi banci/bekas',
          },
          {
            code: '5.2.b',
            text: 'Panjang lewatan sambungan tulangan (lap splice) minimal 40D untuk daerah tarik dan 30D untuk daerah tekan, diikat kuat kawat bendrat galvanis rangkap dua.',
            requirement: 'Jarak selimut beton: Pondasi 75 mm, Balok/Kolom 40 mm, Plat lantai 20 mm',
          },
        ],
      },
      {
        number: 'Pasal 5.3',
        title: 'Bekisting Film Faced Plywood & Scaffolding Baja',
        standards: ['SNI 03-3430-1994', 'ACI 347 (Formwork for Concrete)'],
        content:
          'Bekisting beton ekspos menggunakan multiplex tebal minimal 12-15 mm dilapisi lapisan film phenolic (Film Faced Plywood) tahan air dan minyak. Perancah penopang menggunakan pipa baja scaffolding modular lengkap dengan U-head jack, base plate, dan cross brace yang terpasang kokoh.',
        subClauses: [
          {
            code: '5.3.a',
            text: 'Pembongkaran bekisting sisi samping (kolom & dinding balok) diizinkan setelah beton berumur minimal 3 hari.',
            requirement: 'Kuat tekan mencapai minimal 40% f\'c',
          },
          {
            code: '5.3.b',
            text: 'Pembongkaran bekisting dasar plat dan dasar balok diizinkan setelah beton berumur minimal 21 hari atau uji kuat tekan kubus mencapai ≥ 85% f\'c.',
            requirement: 'Tetap dipasang perancah penopang antara (re-shoring) hingga usia 28 hari',
          },
        ],
      },
    ],
  },
  {
    id: 'bab-6',
    chapterNumber: 'BAB VI',
    title: 'PEKERJAAN ARSITEKTUR & PASANGAN DINDING',
    category: 'Arsitektur',
    description: 'Pemasangan dinding bata ringan hebel AAC, adukan mortar instan semen, plesteran acian, kolom praktis, dan balok latei beton.',
    clauses: [
      {
        number: 'Pasal 6.1',
        title: 'Pasangan Dinding Bata Ringan AAC (Autoclaved Aerated Concrete)',
        standards: ['SNI 03-6825-2002', 'Standar Mortar Instan Perekat Bata Ringan'],
        content:
          'Bata ringan menggunakan tipe AAC presisi ukuran 60 x 20 x 10 cm, berat volume kering 550-650 kg/m³, kuat tekan minimal 4.0 N/mm² setara merek Hebel / Citicon / Grand Elephant. Perekat menggunakan semen instan thin bed mortar tebal 3 mm diaduk mesin mixer.',
        subClauses: [
          {
            code: '6.1.a',
            text: 'Setiap luasan dinding maksimal 12 m² atau bentang horizontal > 3.0 m wajib dipasang kolom praktis beton 10x10 cm bertulang 4Ø8 sengkang Ø6-150.',
            requirement: 'Kolom praktis dan balok latei wajib diangkur ke kolom struktur utama',
          },
          {
            code: '6.1.b',
            text: 'Di atas setiap kusen pintu dan jendela dengan bentang > 1.0 m wajib dipasang balok latei (lintel beam) beton bertulang.',
            requirement: 'Tebal balok latei minimal 10 cm dengan tumpuan minimal 20 cm di kedua sisi',
          },
        ],
      },
      {
        number: 'Pasal 6.2',
        title: 'Plesteran & Acian Semen Instan Halus',
        standards: ['SNI 03-6882-2002 Spesifikasi Mortar Plesteran'],
        content:
          'Plesteran dinding bata ringan menggunakan mortar instan tebal rata-rata 10 mm. Sebelum diplester, celah sambungan dibersihkan dan dibasahi. Acian semen instan diaplikasikan setelah plesteran berumur minimal 3 hari dengan ketebalan 1.5 - 2 mm menghasilkan permukaan yang halus, rata waterpass, dan tidak bergelombang.',
      },
    ],
  },
  {
    id: 'bab-7',
    chapterNumber: 'BAB VII',
    title: 'PEKERJAAN KUSEN, PINTU, JENDELA & KACA FASADE',
    category: 'Arsitektur',
    description: 'Spesifikasi profil aluminium powder coating, kaca stopsol/tempered, aksesoris kunci & engsel heavy duty SUS 304, sealant elastis kedap air.',
    clauses: [
      {
        number: 'Pasal 7.1',
        title: 'Kusen Aluminium 4 Inch Powder Coating Standar SNI',
        standards: ['SNI 07-0603-1989 Produk Ekstrusi Aluminium', 'Qualicoat Coating Standard'],
        content:
          'Kusen pintu dan jendela menggunakan profil aluminium alloy 6063-T5 ukuran profil 4 inch (44 x 101 mm) dengan ketebalan dinding profil minimal 1.35 mm setara Alexindo / YKK AP / Forta. Finishing powder coating warna Dark Grey / Hitam Anodized dengan ketebalan lapisan cat minimal 60-80 micron bersertifikat garansi 10 tahun.',
        subClauses: [
          {
            code: '7.1.a',
            text: 'Pertemuan sudut kusen disambung rapat dengan sistem spigot sekrup stainless steel dan diberi seal joint silicone elastis kedap air.',
            requirement: 'Celah antara kusen aluminium dan dinding diisi backer rod dan di-sealant netral',
          },
          {
            code: '7.1.b',
            text: 'Kaca fasade eksterior menggunakan kaca stopsol reflective tebal 8 mm warna Dark Blue / Bronze, sedangkan kaca jendela interior menggunakan float glass bening tebal 6 mm.',
            requirement: 'Kaca bebas dari cacat gelombang, gelembung udara, dan retak rambut',
          },
        ],
      },
      {
        number: 'Pasal 7.2',
        title: 'Aksesoris Kunci, Engsel & Handle Pintu (Hardware)',
        standards: ['Standar Hardware Stainless Steel SUS 304'],
        content:
          'Seluruh engsel pintu utama menggunakan tipe ball bearing stainless steel SUS 304 ukuran 4" x 3" x 3 mm (3 unit per daun pintu). Kunci pintu menggunakan mortise lock cylinder double key dengan handle lever stainless steel SUS 304 setara merek Dekkson / Solid / Kend.',
      },
    ],
  },
  {
    id: 'bab-8',
    chapterNumber: 'BAB VIII',
    title: 'PEKERJAAN PENUTUP LANTAI & DINDING (GRANIT TILE)',
    category: 'Arsitektur',
    description: 'Pemasangan homogeneous tile 60x60 cm, keramik lantai kamar mandi anti-slip, nat waterproof, dan plint dinding granit.',
    clauses: [
      {
        number: 'Pasal 8.1',
        title: 'Homogeneous Tile (Granit) 60x60 cm Lantai Utama',
        standards: ['SNI ISO 13006:2014 Keramik Lantai & Dinding', 'Toleransi Kerataan B1a'],
        content:
          'Lantai area kantor, koridor, dan ruang publik menggunakan granit tile polished ukuran 60 x 60 cm kualitas KW-1 (First Grade) setara merek Roman Granit / Indogress / Granito. Permukaan rata tanpa cacat bintik dan presisi sudut 90 derajat. Perekat menggunakan semen mortar instan tebal 3-5 mm.',
        subClauses: [
          {
            code: '8.1.a',
            text: 'Garis nat lantai dipasang lurus, seragam dengan lebar nat 2 mm menggunakan tile spacer plastik.',
            requirement: 'Pengisian celah nat menggunakan semen grout polimer anti-jamur dan kedap air',
          },
          {
            code: '8.1.b',
            text: 'Di sekeliling dinding ruangan dipasang plint lantai dari material granit yang sama tinggi 10 cm dengan bevel atas 45 derajat.',
            requirement: 'Pemasangan rata benang dengan permukaan dinding',
          },
        ],
      },
      {
        number: 'Pasal 8.2',
        title: 'Lantai & Dinding Toilet / Kamar Mandi (Anti-Slip & Waterproofing)',
        standards: ['SNI 03-6861.1-2002'],
        content:
          'Lantai kamar mandi menggunakan keramik unpolished tekstur kasar anti-slip ukuran 30 x 30 cm dengan kemiringan lantai 1-2% ke arah floor drain. Sebelum keramik dipasang, seluruh permukaan lantai beton dan dinding setinggi 1.80 meter wajib dilapisi waterproofing coating berbasis semen fleksibel (2 komponen) tebal minimal 1.5 mm diuji rendam air 2x24 jam tanpa rembes.',
      },
    ],
  },
  {
    id: 'bab-9',
    chapterNumber: 'BAB IX',
    title: 'PEKERJAAN MEKANIKAL, ELEKTRIKAL & PLUMBING (MEP)',
    category: 'MEP',
    description: 'Instalasi pipa air bersih PVC-AW / PPR, pipa air kotor & ventilasi PVC-D, kabel listrik kabel NYM/NYY SNI, panel SDP MCB, dan sistem pentanahan (grounding).',
    clauses: [
      {
        number: 'Pasal 9.1',
        title: 'Instalasi Plambing Air Bersih & Air Kotor',
        standards: ['SNI 8153:2015 Sistem Plambing pada Bangunan Gedung', 'SNI 06-0084-2002 (Pipa PVC AW)'],
        content:
          'Pipa instalasi air bersih bertekanan menggunakan pipa PVC kelas AW tekanan kerja 10 kg/cm² atau pipa PPR PN-10/16 untuk instalasi air panas setara merek Wavin / Rucika / Maspion. Pipa air kotor dan air bekas menggunakan PVC kelas D diameter minimal 3" dan 4" dengan kemiringan aliran minimal 1-2%.',
        subClauses: [
          {
            code: '9.1.a',
            text: 'Seluruh jaringan instalasi pipa air bersih wajib dilakukan uji tekan hidrolis (Hydrostatic Pressure Test) sebesar 8 bar (8 kg/cm²) selama minimal 24 jam.',
            requirement: 'Penurunan tekanan tidak boleh melebihi 0.1 bar selama 24 jam',
          },
          {
            code: '9.1.b',
            text: 'Pipa air kotor yang melewati ruang void atau shaft wajib dipasang klem pipa penggantung berbahan baja galvanis setiap jarak 1.5 meter.',
            requirement: 'Dilengkapi clean out (CO) pada setiap belokan 90 derajat',
          },
        ],
      },
      {
        number: 'Pasal 9.2',
        title: 'Instalasi Kelistrikan, Panel SDP & Pentanahan (Grounding)',
        standards: ['PUIL 2011 (Persyaratan Umum Instalasi Listrik)', 'SNI 04-0225-2011', 'SPLN'],
        content:
          'Kabel distribusi daya utama menggunakan jenis NYY 4x16 mm², sedangkan kabel instalasi penerangan dan stop kontak menggunakan NYM 3x2.5 mm² berisolasi ganda standar SNI setara Supreme / Kabelindo / Kabelmetal dalam pipa conduit PVC high impact 20 mm. Panel SDP dilengkapi MCB/MCCB setara Schneider Electric.',
        subClauses: [
          {
            code: '9.2.a',
            text: 'Uji tahanan isolasi (Megger Test) dilakukan pada seluruh sirkuit instalasi listrik dengan tegangan uji 500V DC.',
            requirement: 'Nilai tahanan isolasi minimal 1 Mega Ohm',
          },
          {
            code: '9.2.b',
            text: 'Sistem pentanahan (grounding rod) menggunakan batang tembaga solid tembus tanah kedalaman 6-12 meter.',
            requirement: 'Nilai tahanan grounding wajib < 2 Ohm diukur dengan Earth Ground Tester',
          },
        ],
      },
    ],
  },
  {
    id: 'bab-10',
    chapterNumber: 'BAB X',
    title: 'PENGUJIAN MUTU, TOLERANSI DIMENSI & SERAH TERIMA (BAST)',
    category: 'Mutu & Serah Terima',
    description: 'Prosedur quality control, penanganan cacat mutu (punch list), toleransi deviasi dimensi fisik, syarat terbit BAST-1 PHO dan BAST-2 FHO.',
    clauses: [
      {
        number: 'Pasal 10.1',
        title: 'Standar Toleransi Deviasi Dimensi Fisik Lapangan',
        standards: ['PBI 1971 / SNI 2847', 'Standar Mutu Pengawasan Konstruksi'],
        content:
          'Seluruh komponen struktur dan arsitektur wajib mematuhi batasan toleransi deviasi fisik: (a) Ketidakrataan permukaan lantai granit maksimal 2 mm per bentang 2.0 meter; (b) Ketegaklurusan kolom struktur maksimal deviasi 5 mm per tinggi 3.0 meter; (c) Ketebalan selimut beton deviasi maksimal ±3 mm; (d) Dimensi penampang balok/kolom deviasi maksimal -3 mm s/d +6 mm.',
      },
      {
        number: 'Pasal 10.2',
        title: 'Tata Cara Serah Terima Pertama (BAST-1 PHO) & As-Built Drawing',
        standards: ['Permen PUPR No. 14 Tahun 2020 Pasal 102'],
        content:
          'Kontraktor dapat mengajukan permohonan Serah Terima Pertama (PHO) secara tertulis kepada Owner apabila progres fisik telah mencapai 100%. Tim Panitia Penerima Hasil Pekerjaan bersama Konsultan MK akan melaksanakan pemeriksaan lapangan gabungan untuk menyusun Daftar Cacat Mutu (Defects & Punch List).',
        subClauses: [
          {
            code: '10.2.a',
            text: 'Kontraktor wajib menyelesaikan seluruh perbaikan daftar cacat mutu dalam batas waktu maksimal 14 hari kalender.',
            requirement: 'Penyelesaian punch list diverifikasi tanda tangan bersama MK & Owner',
          },
          {
            code: '10.2.b',
            text: 'Kontraktor wajib menyerahkan As-Built Drawing cetak 3 rangkap kalkir/HVS A3 dan softcopy CAD/DWG, serta Manual Operasi & Pemeliharaan (O&M Manual).',
            requirement: 'Diserahkan lengkap sebelum penandatanganan naskah BAST-1 resmi',
          },
        ],
      },
    ],
  },
];
