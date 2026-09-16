import { RABDetailItem, RABSector } from './initialData';

export const TOTAL_KONTRAK = 14461760981;
export const SUBTOTAL_FISIK = 13028613496;
export const PPN_11_PERCENT = 1433147485;

export const OFFICIAL_UPLOADED_SECTORS: RABSector[] = [
  { sectorNumber: 1, name: 'Pekerjaan Persiapan', budget: 229621500, percentage: 1.6 },
  { sectorNumber: 2, name: 'Pekerjaan Pondasi Substruktur', budget: 1300030000, percentage: 9.0 },
  { sectorNumber: 3, name: 'Pekerjaan Superstruktur', budget: 2499690112, percentage: 17.3 },
  { sectorNumber: 4, name: 'Pekerjaan Arsitektur', budget: 1721070000, percentage: 11.9 },
  { sectorNumber: 5, name: 'Pekerjaan Finishing Kamar Mandi', budget: 807714000, percentage: 5.6 },
  { sectorNumber: 6, name: 'Pekerjaan MEP - Listrik', budget: 1543370100, percentage: 10.7 },
  { sectorNumber: 7, name: 'Pekerjaan MEP - Plumbing', budget: 1188940000, percentage: 8.2 },
  { sectorNumber: 8, name: 'Pekerjaan MEP - Fire Fighting', budget: 2294690000, percentage: 15.9 },
  { sectorNumber: 9, name: 'Pekerjaan MEP - HVAC', budget: 475175784, percentage: 3.3 },
  { sectorNumber: 10, name: 'Pekerjaan Kolam Renang', budget: 120375000, percentage: 0.8 },
  { sectorNumber: 11, name: 'Pekerjaan Cafe', budget: 5625000, percentage: 0.0 },
  { sectorNumber: 12, name: 'Pekerjaan Luar', budget: 97312000, percentage: 0.7 },
  { sectorNumber: 13, name: 'Testing & Commissioning', budget: 10000000, percentage: 0.1 },
  { sectorNumber: 14, name: 'Sewa Mobil Crane', budget: 735000000, percentage: 5.1 },
];

export const OFFICIAL_UPLOADED_DETAIL_ITEMS: RABDetailItem[] = [
  // --- HALAMAN 2: SEKTOR 1 (A.1 - A.11) ---
  { code: 'A.1', sectorNumber: 1, description: 'Pembersihan lahan (land clearing)', volume: 240, unit: 'm2', unitPrice: 9000, totalPrice: 2160000, bobotPercent: (2160000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'A.2', sectorNumber: 1, description: 'Pemagaran sementara proyek (Seng 2m Tinggi)', volume: 84, unit: 'm1', unitPrice: 271000, totalPrice: 22764000, bobotPercent: (22764000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'A.3', sectorNumber: 1, description: 'Direksi keet & Kantor Lapangan (4x 6 m, semi permanen)', volume: 1, unit: 'unit', unitPrice: 33000000, totalPrice: 33000000, bobotPercent: (33000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'A.4', sectorNumber: 1, description: 'Gudang material sementara (3x 4 m, semi permanen)', volume: 1, unit: 'unit', unitPrice: 10200000, totalPrice: 10200000, bobotPercent: (10200000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'A.5', sectorNumber: 1, description: 'Mobilisasi alat berat (excavator, dump truck)', volume: 1, unit: 'ls', unitPrice: 15750000, totalPrice: 15750000, bobotPercent: (15750000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'A.6', sectorNumber: 1, description: 'Pembuatan jalan kerja sementara (batu belah, 3 x 30 m)', volume: 90, unit: 'm2', unitPrice: 462000, totalPrice: 41580000, bobotPercent: (41580000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'A.7', sectorNumber: 1, description: 'Pembuangan sampah/limbah lahan ke TPA', volume: 30, unit: 'm3', unitPrice: 175000, totalPrice: 5250000, bobotPercent: (5250000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'A.08', sectorNumber: 1, description: 'Papan nama proyek (1,5 x 2 m, besi hollow + ACP)', volume: 1, unit: 'unit', unitPrice: 7500000, totalPrice: 7500000, bobotPercent: (7500000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'A.9', sectorNumber: 1, description: 'Alat pengaman & APD awal (helm, rompi, sepatu, rambu)', volume: 1, unit: 'ls', unitPrice: 10000000, totalPrice: 10000000, bobotPercent: (10000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'A.10', sectorNumber: 1, description: 'Instalasi listrik sementara (kWh proyek + Panel + Kabel) Asumsi 160 kVA', volume: 1, unit: 'ls', unitPrice: 65880000, totalPrice: 65880000, bobotPercent: (65880000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'A.11', sectorNumber: 1, description: 'Instalasi air bersih sementara (toren 1000 L + pipa)', volume: 1, unit: 'ls', unitPrice: 15537500, totalPrice: 15537500, bobotPercent: (15537500 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },

  // --- HALAMAN 2: SEKTOR 2 (B.1 - B.17) ---
  { code: 'B.1', sectorNumber: 2, description: 'Galian tanah basement & pondasi asumsi Excavator', volume: 600, unit: 'm3', unitPrice: 141000, totalPrice: 84600000, bobotPercent: (84600000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.2', sectorNumber: 2, description: 'Transport & pembuangan tanah ke TPA', volume: 72, unit: 'm3', unitPrice: 95000, totalPrice: 6840000, bobotPercent: (6840000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.3', sectorNumber: 2, description: 'Dewatering & sump temporary (Instalasion)', volume: 1, unit: 'ls', unitPrice: 65200000, totalPrice: 65200000, bobotPercent: (65200000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.4', sectorNumber: 2, description: 'Lapisan cor LCB (lean concrete) 0,10 m (Rabat beton 100 mm K-125)', volume: 24, unit: 'm3', unitPrice: 726000, totalPrice: 17424000, bobotPercent: (17424000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.5', sectorNumber: 2, description: 'Bored Pile Kombinasi ø600 mm x 12 m (linear m) Include Alat berat', volume: 144, unit: 'lm', unitPrice: 1060000, totalPrice: 152640000, bobotPercent: (152640000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.6', sectorNumber: 2, description: 'Pile cap beton & tulangan (per unit m3 total)', volume: 30, unit: 'm3', unitPrice: 1729000, totalPrice: 51870000, bobotPercent: (51870000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.7', sectorNumber: 2, description: 'Footing terisolasi (typical) 6 unit (2x2x0,6m)', volume: 13, unit: 'm3', unitPrice: 1872000, totalPrice: 24336000, bobotPercent: (24336000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.8', sectorNumber: 2, description: 'Basement slab waterproofed (Integral) (including concrete & finishing) -area', volume: 240, unit: 'm2', unitPrice: 1025000, totalPrice: 246000000, bobotPercent: (246000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.9', sectorNumber: 2, description: 'Beton struktur untuk slab basement (m3)', volume: 60, unit: 'm3', unitPrice: 1586000, totalPrice: 95160000, bobotPercent: (95160000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.10', sectorNumber: 2, description: 'Dinding penahan tanah / retaining wall (basement wall) -area', volume: 192, unit: 'm2', unitPrice: 774000, totalPrice: 148608000, bobotPercent: (148608000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.11', sectorNumber: 2, description: 'Waterproofing membrane * protection (basement roof/slab/wall)', volume: 240, unit: 'm2', unitPrice: 232750, totalPrice: 55860000, bobotPercent: (55860000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.12', sectorNumber: 2, description: 'Sump pump & drainage system (ls)', volume: 1, unit: 'ls', unitPrice: 50400000, totalPrice: 50400000, bobotPercent: (50400000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.13', sectorNumber: 2, description: 'Backfill & compaction (select fill)', volume: 606, unit: 'm3', unitPrice: 56000, totalPrice: 33936000, bobotPercent: (33936000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.14', sectorNumber: 2, description: 'Formwork & perancah (area estimated)', volume: 216, unit: 'm2', unitPrice: 117000, totalPrice: 25272000, bobotPercent: (25272000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.15', sectorNumber: 2, description: 'Tulangan Baja (rebar) untuk pondasi & slab (kg)', volume: 14160, unit: 'kg', unitPrice: 14500, totalPrice: 205320000, bobotPercent: (205320000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.16', sectorNumber: 2, description: 'Beton tambahan untuk pile cap, beam & blinding (m3)', volume: 14, unit: 'm3', unitPrice: 1326000, totalPrice: 18564000, bobotPercent: (18564000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'B.17', sectorNumber: 2, description: 'Uji lab tanah & pengawasan geoteknik (ls) (sondir & PDA Test)', volume: 1, unit: 'ls', unitPrice: 18000000, totalPrice: 18000000, bobotPercent: (18000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },

  // --- HALAMAN 2 & 3: SEKTOR 3 (C.1.a - C.7) ---
  { code: 'C.1.a', sectorNumber: 3, description: 'Pekerjaan Pelat slab uk Tb 150 mm - beton mutu K-350', volume: 201.6, unit: 'm3', unitPrice: 1259900, totalPrice: 253995840, bobotPercent: (253995840 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'C.1.b', sectorNumber: 3, description: 'Pekerjaan Pelat slab - Mesh ø10 mm @200 mm both ways +Tulangan Utama ø12 @200 mm', volume: 24192, unit: 'kg', unitPrice: 14500, totalPrice: 350784000, bobotPercent: (350784000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'C.1.c', sectorNumber: 3, description: 'Pekerjaan Pelat slab - Bekisting', volume: 1680, unit: 'm2', unitPrice: 150000, totalPrice: 252000000, bobotPercent: (252000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'C.2.a', sectorNumber: 3, description: 'Pekerjaan Balok BP Uk 400 x 600 mm & BS Uk 300 x 500 mm - Beton mutu K-350', volume: 138.24, unit: 'm3', unitPrice: 1259000, totalPrice: 174044160, bobotPercent: (174044160 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'C.2.b', sectorNumber: 3, description: 'Pekerjaan Balok - Besi BP 6ø20 mm - 48ø16 mm Sengkang ø12 mm @100-150mm, BS 4ø16 mm - 2ø12 mm sengkang 150 - 200 mm', volume: 20736, unit: 'kg', unitPrice: 14200, totalPrice: 294451200, bobotPercent: (294451200 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'C.2.c', sectorNumber: 3, description: 'Pekerjaan Balok - Bekisting', volume: 1382, unit: 'm2', unitPrice: 150000, totalPrice: 207300000, bobotPercent: (207300000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'C.3.a', sectorNumber: 3, description: 'Pekerjaan Kolom Uk 500 x 500 mm & 400 x 400 mm - Beton mutu K-350', volume: 64.8, unit: 'm3', unitPrice: 1259900, totalPrice: 81641520, bobotPercent: (81641520 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'C.3.b', sectorNumber: 3, description: 'Pekerjaan Kolom - Besi K1 Uk 500 x 500 mm (8ø22 mm sengkang ...), K2 Uk 400 x 400 mm (12ø22 mm sengkang ...)', volume: 11664, unit: 'kg', unitPrice: 14500, totalPrice: 169128000, bobotPercent: (169128000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'C.3.c', sectorNumber: 3, description: 'Pekerjaan Kolom - Bekisting', volume: 518, unit: 'm2', unitPrice: 150000, totalPrice: 77700000, bobotPercent: (77700000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'C.4.a', sectorNumber: 3, description: 'Pekerjaan Dinding Inti - Beton mutu K-350', volume: 86.4, unit: 'm3', unitPrice: 1259900, totalPrice: 108855360, bobotPercent: (108855360 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'C.4.b', sectorNumber: 3, description: 'Pekerjaan Dinding Inti - Besi TUV Uk Ø16 mm @ 150 - 200 mm, TH Uk Ø12 mm @ 200 mm', volume: 12960, unit: 'kg', unitPrice: 14500, totalPrice: 187920000, bobotPercent: (187920000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'C.4.c', sectorNumber: 3, description: 'Pekerjaan Dinding Inti - Bekisting', volume: 864, unit: 'm2', unitPrice: 150000, totalPrice: 129600000, bobotPercent: (129600000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'C.5.a', sectorNumber: 3, description: 'Pekerjaan Tangga - Beton mutu K-300', volume: 30, unit: 'm3', unitPrice: 1259900, totalPrice: 37797000, bobotPercent: (37797000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'C.5.b', sectorNumber: 3, description: 'Pekerjaan Tangga - Besi TU Ø16 mm D8 Ø10 mm @200 mm', volume: 3600, unit: 'kg', unitPrice: 14500, totalPrice: 52200000, bobotPercent: (52200000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'C.5.c', sectorNumber: 3, description: 'Pekerjaan Tangga - Bekisting', volume: 240, unit: 'm2', unitPrice: 150000, totalPrice: 36000000, bobotPercent: (36000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'C.6.a', sectorNumber: 3, description: 'Pekerjaan parapet tb 120 mm T 1 m - Beton mutu K-350', volume: 7.68, unit: 'm3', unitPrice: 1259900, totalPrice: 9676032, bobotPercent: (9676032 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'C.6.b', sectorNumber: 3, description: 'Pekerjaan parapet - Besi TU Ø10 mm @200 mm TH Ø8 @200 mm', volume: 706, unit: 'kg', unitPrice: 14500, totalPrice: 10237000, bobotPercent: (10237000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'C.6.c', sectorNumber: 3, description: 'Pekerjaan parapet - Bekisting', volume: 128, unit: 'm2', unitPrice: 150000, totalPrice: 19200000, bobotPercent: (19200000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'C.7', sectorNumber: 3, description: 'Waterproofing atap', volume: 240, unit: 'm2', unitPrice: 196500, totalPrice: 47160000, bobotPercent: (47160000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 3: SEKTOR 4 (D.1 - D.7) ---
  { code: 'D.1', sectorNumber: 4, description: 'Dinding Hebel Tbl 100 mm Plester + Aci (eksterior)', volume: 1382, unit: 'm2', unitPrice: 225000, totalPrice: 310950000, bobotPercent: (310950000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'D.2', sectorNumber: 4, description: 'Cat dinding interior (2 coats) Ex Jotun', volume: 3000, unit: 'm2', unitPrice: 50000, totalPrice: 150000000, bobotPercent: (150000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'D.3', sectorNumber: 4, description: 'Cat dinding eksterior (2 coats) Ex Jotun', volume: 1382, unit: 'm2', unitPrice: 60000, totalPrice: 82920000, bobotPercent: (82920000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'D.4', sectorNumber: 4, description: 'Lantai Granit (Lobby 800x800 hitam marmer, Lantai 2-6 putih marmer 600x600) Ex Sandimas atau setara', volume: 1680, unit: 'm2', unitPrice: 225000, totalPrice: 378000000, bobotPercent: (378000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'D.5', sectorNumber: 4, description: 'Plafon Gypsum + rangka hollow tbl rangka 0,35 mm & gypsum 9 mm', volume: 1440, unit: 'm2', unitPrice: 180000, totalPrice: 259200000, bobotPercent: (259200000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'D.6', sectorNumber: 4, description: 'Pintu kamar + kusen (solid core)', volume: 90, unit: 'unit', unitPrice: 3500000, totalPrice: 315000000, bobotPercent: (315000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'D.7', sectorNumber: 4, description: 'Jendela alumunium + kaca (per unit) hitam', volume: 90, unit: 'unit', unitPrice: 2500000, totalPrice: 225000000, bobotPercent: (225000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 3: SEKTOR 5 (E.1 - E.7) ---
  { code: 'E.1', sectorNumber: 5, description: 'Keramik dinding kamar mandi Uk, 200 x 400 mm (full tinggi 2400 mm) Ex Mulia', volume: 864, unit: 'm2', unitPrice: 150000, totalPrice: 129600000, bobotPercent: (129600000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'E.2', sectorNumber: 5, description: 'Keramik lantai kamar mandi Ex Mulia Signature', volume: 360, unit: 'm2', unitPrice: 182500, totalPrice: 65700000, bobotPercent: (65700000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'E.3', sectorNumber: 5, description: 'Plafon kamar mandi (PVC/Gypsum tahan lembab)', volume: 360, unit: 'm2', unitPrice: 155650, totalPrice: 56034000, bobotPercent: (56034000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'E.4', sectorNumber: 5, description: 'Sanitari per kamar (closet duduk, wastafel, shower, floor drain) Ex Toto', volume: 72, unit: 'set', unitPrice: 4452500, totalPrice: 320580000, bobotPercent: (320580000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'E.5', sectorNumber: 5, description: 'Pintu kamar mandi (PVC/WPC tahan air) Ex Platinum', volume: 72, unit: 'unit', unitPrice: 320000, totalPrice: 23040000, bobotPercent: (23040000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'E.6', sectorNumber: 5, description: 'Aksesoris kamar mandi (shower set, cermin, rak, handuk bracket) Ex Toto', volume: 72, unit: 'set', unitPrice: 945000, totalPrice: 68040000, bobotPercent: (68040000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'E.7', sectorNumber: 5, description: 'Instalasi plumbing air bersih & kotor (pipa, fitting, floor trap)', volume: 72, unit: 'set', unitPrice: 2010000, totalPrice: 144720000, bobotPercent: (144720000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 3 & 4: SEKTOR 6 (F.1 - F.21) ---
  { code: 'F.1', sectorNumber: 6, description: 'Panel Utama (MDP) 160 kVA (Incl MCCB, Push bar, Mounting)', volume: 1, unit: 'unit', unitPrice: 41540000, totalPrice: 41540000, bobotPercent: (41540000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.2', sectorNumber: 6, description: 'Sub-panel tiap lantai (Incl MCB, enclosure)', volume: 7, unit: 'unit', unitPrice: 5969500, totalPrice: 41786500, bobotPercent: (41786500 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.3', sectorNumber: 6, description: 'Panel distribusi kamar (MCB + meter per room) Ex 1300 watt per unit', volume: 72, unit: 'unit', unitPrice: 2722500, totalPrice: 196020000, bobotPercent: (196020000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.4', sectorNumber: 6, description: 'Trafo / Connection to utility (provision)', volume: 1, unit: 'ls', unitPrice: 86400000, totalPrice: 86400000, bobotPercent: (86400000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.5', sectorNumber: 6, description: 'Genset 200 kVA + ATS (supply & instal) perkins', volume: 1, unit: 'unit', unitPrice: 167040000, totalPrice: 167040000, bobotPercent: (167040000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.6', sectorNumber: 6, description: 'Kabel power utama (various sizes) - Total estimate', volume: 12000, unit: 'm', unitPrice: 26050, totalPrice: 312600000, bobotPercent: (312600000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.7', sectorNumber: 6, description: 'Conduit & Trunking (m)', volume: 8000, unit: 'm', unitPrice: 14037.5, totalPrice: 112300000, bobotPercent: (112300000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.8', sectorNumber: 6, description: 'Instalasi stop kontak & saklar per titik (incl box & wiring)', volume: 288, unit: 'titik', unitPrice: 250000, totalPrice: 72000000, bobotPercent: (72000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.9', sectorNumber: 6, description: 'Instalasi Pencahayaan (LED downlights, fixture) per titik philips lampu panel Led', volume: 720, unit: 'titik', unitPrice: 166320, totalPrice: 119750400, bobotPercent: (119750400 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.10', sectorNumber: 6, description: 'Lampu koridor & lobby (special fixture)', volume: 120, unit: 'titik', unitPrice: 129360, totalPrice: 15523200, bobotPercent: (15523200 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.11', sectorNumber: 6, description: 'Lampu eksterior & taman (incl wiring)', volume: 30, unit: 'titik', unitPrice: 672000, totalPrice: 20160000, bobotPercent: (20160000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.12', sectorNumber: 6, description: 'UPS (for critical loads)', volume: 1, unit: 'ls', unitPrice: 60000000, totalPrice: 60000000, bobotPercent: (60000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.13', sectorNumber: 6, description: 'Grounding system & lighting protection', volume: 1, unit: 'ls', unitPrice: 25000000, totalPrice: 25000000, bobotPercent: (25000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.14', sectorNumber: 6, description: 'penangkal petir (lighting arrestor) Radius 50 meter', volume: 1, unit: 'unit', unitPrice: 22500000, totalPrice: 22500000, bobotPercent: (22500000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.15', sectorNumber: 6, description: 'Installation testing & commissioning (electrical)', volume: 1, unit: 'ls', unitPrice: 30000000, totalPrice: 30000000, bobotPercent: (30000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.16', sectorNumber: 6, description: 'Cable tray & ladder (m)', volume: 1500, unit: 'm', unitPrice: 91500, totalPrice: 137250000, bobotPercent: (137250000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.17', sectorNumber: 6, description: 'Earthing pit & bonding (per pit)', volume: 4, unit: 'unit', unitPrice: 2500000, totalPrice: 10000000, bobotPercent: (10000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.18', sectorNumber: 6, description: 'Metering & submeters per Floor (incl CTs)', volume: 7, unit: 'unit', unitPrice: 3000000, totalPrice: 21000000, bobotPercent: (21000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.19', sectorNumber: 6, description: 'Distribution boards for services (lift, pumps)', volume: 5, unit: 'unit', unitPrice: 5000000, totalPrice: 25000000, bobotPercent: (25000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.20', sectorNumber: 6, description: 'Spare parts & consumables (allowance)', volume: 1, unit: 'ls', unitPrice: 12500000, totalPrice: 12500000, bobotPercent: (12500000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'F.21', sectorNumber: 6, description: 'Lift power connection & interface (per lift)', volume: 2, unit: 'unit', unitPrice: 7500000, totalPrice: 15000000, bobotPercent: (15000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 4: SEKTOR 7 (G.1 - G.19) ---
  { code: 'G.1', sectorNumber: 7, description: 'Sanitari set (WC duduk + lavabo + shower) - per kamar Ex Toto', volume: 72, unit: 'set', unitPrice: 4452500, totalPrice: 320580000, bobotPercent: (320580000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.2', sectorNumber: 7, description: 'Floor trap (per kamar)', volume: 72, unit: 'unit', unitPrice: 125000, totalPrice: 9000000, bobotPercent: (9000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.3', sectorNumber: 7, description: 'Water Heater portable per unit Ex Ariston Include instalation', volume: 12, unit: 'unit', unitPrice: 2807500, totalPrice: 33690000, bobotPercent: (33690000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.4', sectorNumber: 7, description: 'Roof water tank (incl mounting & piping)', volume: 1, unit: 'unit', unitPrice: 79800000, totalPrice: 79800000, bobotPercent: (79800000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.5', sectorNumber: 7, description: 'Ground water tank (tangki cadangan)', volume: 1, unit: 'unit', unitPrice: 79800000, totalPrice: 79800000, bobotPercent: (79800000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.6', sectorNumber: 7, description: 'Booster pump set (supply + panel)', volume: 1, unit: 'ls', unitPrice: 108900000, totalPrice: 108900000, bobotPercent: (108900000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.7', sectorNumber: 7, description: 'Sump pump system (basement)', volume: 1, unit: 'ls', unitPrice: 30000000, totalPrice: 30000000, bobotPercent: (30000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.8', sectorNumber: 7, description: 'Sewage treatment plant (Provision & instal)', volume: 1, unit: 'ls', unitPrice: 125000000, totalPrice: 125000000, bobotPercent: (125000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.9', sectorNumber: 7, description: 'Septic tank (alternatif / allowance)', volume: 1, unit: 'ls', unitPrice: 67200000, totalPrice: 67200000, bobotPercent: (67200000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.10', sectorNumber: 7, description: 'Grease Trap (kitchen)', volume: 1, unit: 'unit', unitPrice: 20000000, totalPrice: 20000000, bobotPercent: (20000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.11', sectorNumber: 7, description: 'Cold water supply piping (various sizes, total estimate)', volume: 3360, unit: 'm', unitPrice: 40000, totalPrice: 134400000, bobotPercent: (134400000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.12', sectorNumber: 7, description: 'Hot water piping (distributin, per room connection)', volume: 432, unit: 'm', unitPrice: 60000, totalPrice: 25920000, bobotPercent: (25920000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.13', sectorNumber: 7, description: 'Drainage & waste piping (roof & sanitari)', volume: 2520, unit: 'm', unitPrice: 22500, totalPrice: 56700000, bobotPercent: (56700000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.14', sectorNumber: 7, description: 'Stormwater downpipes & roof drains', volume: 288, unit: 'm', unitPrice: 50000, totalPrice: 14400000, bobotPercent: (14400000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.15', sectorNumber: 7, description: 'Valves & stop valves (allowance)', volume: 31, unit: 'set', unitPrice: 250000, totalPrice: 7750000, bobotPercent: (7750000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.16', sectorNumber: 7, description: 'Insulation for hot water piping', volume: 432, unit: 'm', unitPrice: 25000, totalPrice: 10800000, bobotPercent: (10800000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.17', sectorNumber: 7, description: 'Manholes for drainage (unit)', volume: 5, unit: 'unit', unitPrice: 2500000, totalPrice: 12500000, bobotPercent: (12500000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.18', sectorNumber: 7, description: 'Testing & commissioning (plumbing)', volume: 1, unit: 'ls', unitPrice: 12500000, totalPrice: 12500000, bobotPercent: (12500000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'G.19', sectorNumber: 7, description: 'Installation labour & miscellanesous (allowance)', volume: 1, unit: 'ls', unitPrice: 40000000, totalPrice: 40000000, bobotPercent: (40000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 4 & 5: SEKTOR 8 (H.1 - H.16) ---
  { code: 'H.1', sectorNumber: 8, description: 'Fire pump set (duty, jockey, diesel + control panel)', volume: 1, unit: 'set', unitPrice: 94500000, totalPrice: 94500000, bobotPercent: (94500000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.2', sectorNumber: 8, description: 'Fire water tank (ground tank 100 m3 + structure)', volume: 1, unit: 'unit', unitPrice: 75000000, totalPrice: 75000000, bobotPercent: (75000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.3', sectorNumber: 8, description: 'Pipa distribusi hydrant (standpipe + riser, steel)', volume: 840, unit: 'm', unitPrice: 316500, totalPrice: 265860000, bobotPercent: (265860000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.4', sectorNumber: 8, description: 'Pipa distribusi sprinkler (branch line)', volume: 1680, unit: 'm', unitPrice: 263750, totalPrice: 443100000, bobotPercent: (443100000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.5', sectorNumber: 8, description: 'Hydrant pillar (outdoor, double outlet)', volume: 2, unit: 'unit', unitPrice: 91500000, totalPrice: 183000000, bobotPercent: (183000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.6', sectorNumber: 8, description: 'Hydrant box indoor (per lantai 2 boks x 7 lantai)', volume: 14, unit: 'unit', unitPrice: 7320000, totalPrice: 102480000, bobotPercent: (102480000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.07', sectorNumber: 8, description: 'Hose reel (tiap lantai 1 reel x 6 lantai)', volume: 6, unit: 'unit', unitPrice: 5000000, totalPrice: 30000000, bobotPercent: (30000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.8', sectorNumber: 8, description: 'Sprinkler head (1 head / 12 m2)', volume: 140, unit: 'unit', unitPrice: 250000, totalPrice: 35000000, bobotPercent: (35000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.9', sectorNumber: 8, description: 'Valve, flow switch, pressure gauge (allowance)', volume: 12, unit: 'set', unitPrice: 2500000, totalPrice: 30000000, bobotPercent: (30000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.10', sectorNumber: 8, description: 'Fire alarm control panel (FACP)', volume: 1, unit: 'unit', unitPrice: 6000000, totalPrice: 6000000, bobotPercent: (6000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.11', sectorNumber: 8, description: 'Smoke & heat detector (1/25 m2)', volume: 67, unit: 'unit', unitPrice: 750000, totalPrice: 50250000, bobotPercent: (50250000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.12', sectorNumber: 8, description: 'Manual call point + bell/strobe (2 titik/lantai x 7 lantai)', volume: 14, unit: 'unit', unitPrice: 1250000, totalPrice: 17500000, bobotPercent: (17500000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.13', sectorNumber: 8, description: 'Kabel instalasi alarm & control', volume: 1200, unit: 'm', unitPrice: 22500, totalPrice: 27000000, bobotPercent: (27000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.14', sectorNumber: 8, description: 'Testing & commissioning system', volume: 1, unit: 'ls', unitPrice: 25000000, totalPrice: 25000000, bobotPercent: (25000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.15', sectorNumber: 8, description: 'Instalasi & pekerjaan mekanikal (allowance)', volume: 1, unit: 'ls', unitPrice: 60000000, totalPrice: 60000000, bobotPercent: (60000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'H.16', sectorNumber: 8, description: 'Instalasi & pekerjaan Pemasangan Lift (7 Lantai)', volume: 2, unit: 'Unit', unitPrice: 425000000, totalPrice: 850000000, bobotPercent: (850000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 5: SEKTOR 9 (I.1 - I.5) ---
  { code: 'I.1', sectorNumber: 9, description: 'AC split / VRF system (per room allowance) Ex Gree', volume: 71, unit: 'unit', unitPrice: 3075000, totalPrice: 218325000, bobotPercent: (218325000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'I.2', sectorNumber: 9, description: 'Ducting & ventilation shaft (m2)', volume: 504, unit: 'm2', unitPrice: 94446, totalPrice: 47600784, bobotPercent: (47600784 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'I.3', sectorNumber: 9, description: 'Exhaust fans toilet & kitchen (unit)', volume: 71, unit: 'unit', unitPrice: 1750000, totalPrice: 124250000, bobotPercent: (124250000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'I.4', sectorNumber: 9, description: 'Insulation & acoustic works (ls)', volume: 1, unit: 'ls', unitPrice: 60000000, totalPrice: 60000000, bobotPercent: (60000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'I.5', sectorNumber: 9, description: 'Testing & balancing HVAC (ls)', volume: 1, unit: 'ls', unitPrice: 25000000, totalPrice: 25000000, bobotPercent: (25000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 5: SEKTOR 10 (J.1 - J.2) ---
  { code: 'J.1', sectorNumber: 10, description: 'Pekerjaan Kolam Renang 3 x 7 M2', volume: 52.5, unit: 'M2', unitPrice: 2250000, totalPrice: 118125000, bobotPercent: (118125000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'J.2', sectorNumber: 10, description: 'Pengerjaan Toilet Kolam renang 1,5 x 1,5 & accesories', volume: 3, unit: 'm2', unitPrice: 750000, totalPrice: 2250000, bobotPercent: (2250000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 5: SEKTOR 11 (K.1) ---
  { code: 'K.1', sectorNumber: 11, description: 'Pekerjaan Cafe 2,5 x 3', volume: 7.5, unit: 'm2', unitPrice: 750000, totalPrice: 5625000, bobotPercent: (5625000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 5: SEKTOR 12 (L.1 - L.5) ---
  { code: 'L.1', sectorNumber: 12, description: 'Paving block / asphalt for ramp & parking (m2)', volume: 144, unit: 'm2', unitPrice: 111600, totalPrice: 16070400, bobotPercent: (16070400 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'L.2', sectorNumber: 12, description: 'Drainage luar & sumps (m)', volume: 48, unit: 'm', unitPrice: 109200, totalPrice: 5241600, bobotPercent: (5241600 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'L.3', sectorNumber: 12, description: 'Pagar & gerbang (m) Kolom praktis dan Hebel 10 cm', volume: 40, unit: 'm', unitPrice: 350000, totalPrice: 14000000, bobotPercent: (14000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'L.04', sectorNumber: 12, description: 'Landscape softscape & trees (ls) & jembatan Uk 3000 x 5000 mm', volume: 1, unit: 'ls', unitPrice: 32000000, totalPrice: 32000000, bobotPercent: (32000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },
  { code: 'L.5', sectorNumber: 12, description: 'Lampu luar & akses (ls)', volume: 1, unit: 'ls', unitPrice: 30000000, totalPrice: 30000000, bobotPercent: (30000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 5: SEKTOR 13 (M.1) ---
  { code: 'M.1', sectorNumber: 13, description: 'Dokumentasi & sertifikat (ls)', volume: 1, unit: 'ls', unitPrice: 10000000, totalPrice: 10000000, bobotPercent: (10000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 0 },

  // --- HALAMAN 5: SEKTOR 14 (N.1 - N.3) ---
  { code: 'N.1', sectorNumber: 14, description: 'Mobil Crane Kap.25 Ton', volume: 7, unit: 'bln', unitPrice: 35000000, totalPrice: 245000000, bobotPercent: (245000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'N.2', sectorNumber: 14, description: 'Operasional', volume: 7, unit: 'bln', unitPrice: 10000000, totalPrice: 70000000, bobotPercent: (70000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
  { code: 'N.3', sectorNumber: 14, description: 'Solar', volume: 7, unit: 'bln', unitPrice: 60000000, totalPrice: 420000000, bobotPercent: (420000000 / TOTAL_KONTRAK) * 100, targetProgress25Percent: 100 },
];
