# Saga X Ventures — Struktur Laman

Status: draf untuk disemak. Ditulis sebelum kod supaya pembetulan murah.

---

## 1. Seni bina brand

Dua lapisan sahaja. Lapisan ketiga akan buruk lagi masalah "susah orang cari".

```
Saga X Ventures  ·  "Beyond Trading."
│   brand induk — domain, identiti laman, muka korporat, yang broker nampak
│
├── Mastery Signal      produk — signal untuk orang yang trade sendiri
├── Fukyaa              produk — trading automatik (EA)
└── Traders Lounge      seksyen, bukan brand — pendidikan, video, event
```

**Traders Lounge tiada logo sendiri, tiada warna sendiri, tiada domain sendiri.**
Ia nama bahagian, macam "Academy". Satu sistem visual untuk semua.

Nama produk kekal `Mastery Signal` dan `Fukyaa` sebab orang dah kenal. Tetapi
kedua-duanya tidak menerangkan apa-apa kepada orang baru, jadi **navigasi
melabel ikut kerja, brand dalam kurungan**:

> Trading Automatik — Fukyaa
> Signal & Self-Trade — Mastery Signal

---

## 2. Audiens dan satu soalan teras

Trader runcit Malaysia. Dua segmen, dibezakan bukan oleh produk tetapi oleh
masa dan kesanggupan belajar.

```
                      "Awak nak belajar, atau nak automatik?"
                     ╱                                      ╲
          Nak faham pasaran                        Tiada masa / nak sistem
                 │                                           │
          Kursus (asas · news · strategi)              Fukyaa — EA
                 │                                           │
          Mastery Signal sebagai sokongan                     │
                 ╲                                          ╱
                  ╲                                        ╱
                        Buka akaun broker  (affiliate)
                                   │
              Video · artikel · webinar · seminar  → suap kedua-dua
```

---

## 3. Peta laman

```
/                         Laman utama
/mula                     Survey 3 soalan
/mula/keputusan           Keputusan survey — cadangan peribadi

/belajar                  Laluan A — belajar trade sendiri
/belajar/asas             Kursus: Asas Trading
/belajar/news             Kursus: Trade The News
/belajar/strategi         Kursus: Trading Strategy

/automatik                Laluan B — Trading Automatik (Fukyaa)
/automatik/mula           Onboarding 4 langkah

/signal                   Mastery Signal

/lounge                   Traders Lounge — pusat kandungan
/lounge/video             Pustaka video
/lounge/artikel           Artikel (enjin blog sedia ada)
/lounge/event             Event — akan datang dan lepas

/tentang                  Tentang Asri + Saga X Ventures
/hubungi                  Hubungi
/risiko                   Penzahiran risiko
/privasi                  Privasi
```

Slug Melayu sebab pembeli orang Malaysia dan mereka cari dalam Melayu
("belajar trading", "robot trading"). `signal` dan `automatik` kekal sebab itu
memang istilah yang digunakan. Boleh ditukar kemudian — kos rendah.

### Navigasi utama

```
[Saga X logo]   Mula di sini   Belajar   Automatik   Signal   Lounge   Tentang   [Hubungi]
```

"Mula di sini" adalah pintu survey dan butang paling menonjol.

---

## 4. Survey — bahagian paling penting

### Prinsip

Soalan tentang **dia**, bukan tentang produk kita. Pelanggan tak tahu apa itu
EA. Kalau soalan pertama tanya "Signal atau EA?", dia tekan back.

Tiga soalan. Tiada gate e-mel sebelum keputusan — tunjuk keputusan dahulu,
baru minta hubungan. Dan ada jalan pintas untuk orang yang dah tahu.

### Soalan

**1. Berapa masa awak boleh luangkan untuk trade setiap hari?**
- Kurang 30 minit
- Sejam dua
- Lebih dua jam

**2. Mana lebih dekat dengan apa awak mahu?**
- Saya nak faham pasaran dan buat keputusan sendiri
- Saya nak sistem yang jalan sendiri
- Belum pasti — saya nak tengok dulu

**3. Pengalaman trading awak?**
- Belum pernah
- Pernah cuba, tapi tak konsisten
- Dah trade, cuma nak perbaiki hasil

### Logik percabangan

| Keadaan | Cadangan utama | Alternatif |
|---|---|---|
| S2 = sistem jalan sendiri | Fukyaa | Kursus asas kemudian |
| S2 = faham sendiri, S3 = belum pernah | Asas Trading | Video percuma dulu |
| S2 = faham sendiri, S3 = tak konsisten | Asas + Strategi | Mastery Signal |
| S2 = faham sendiri, S3 = dah trade | Strategi / News + Signal | — |
| S1 = kurang 30 minit (apa pun S2) | Fukyaa | Kursus bila ada masa |
| S2 = belum pasti | Video percuma + Lounge | Webinar akan datang |

### Halaman keputusan

Satu cadangan utama. Satu alternatif. Satu langkah seterusnya. Sentiasa ada
pilihan percuma supaya orang yang belum sedia tidak terus hilang.

```
┌──────────────────────────────────────────┐
│  Berdasarkan jawapan awak                │
│                                          │
│  ▸ Laluan awak:  Trading Automatik       │
│    Sebab: masa awak kurang 30 minit      │
│    sehari dan awak nak sistem yang       │
│    jalan sendiri.                        │
│                                          │
│    [ Lihat cara ia berfungsi ]           │
│                                          │
│  Alternatif:  Asas Trading               │
│  Percuma dulu:  3 video pengenalan       │
│                                          │
│  [ Hantar pelan ini ke WhatsApp saya ]   │
└──────────────────────────────────────────┘
```

Butang WhatsApp itulah tangkapan lead — selepas nilai diberi, bukan sebelum.

---

## 5. Laman utama — seksyen ikut susunan

1. **Hero** — "Beyond Trading." dengan satu ayat biasa di bawahnya yang orang
   terus faham. CTA utama: *Mula — 3 soalan*. CTA kedua: *Saya dah tahu apa saya nak*.
2. **Dua laluan** — bukan dua kad serupa. Satu pertembungan sebenar, guna motif
   X daripada logo sebagai pemisah.
3. **Bukti** — nombor dan testimoni. *Kosong buat masa ini, menunggu isi Asri.*
4. **Apa itu Saga X Ventures** — payung dan dua produk di bawahnya, ringkas.
5. **Terbaru dari Traders Lounge** — tiga kad video atau artikel.
6. **Event akan datang** — kalau tiada, borang notifikasi.
7. **Kenyataan risiko** — nampak, bukan tersembunyi di footer.
8. **CTA akhir**.

---

## 6. Halaman Trading Automatik (Fukyaa)

Urutan ini penting sebab EA tidak boleh jalan tanpa akaun.

```
1. Buka akaun broker          ← link affiliate
2. Deposit dan sedia
3. Hantar borang di fukyaa.com
4. EA dipasang dan disambung ke VPS
```

Yang halaman ini **mesti** jawab terus terang:

- Akaun siapa — *awak pegang akaun sendiri, kami tak pegang duit awak*
- Modal minimum berapa
- VPS siapa sedia, berapa kos, siapa tanggung
- Apa boleh jadi silap — risiko spesifik, bukan ayat generik

Handoff ke `fukyaa.com` adalah titik kebocoran. Kurangkan dengan: beritahu awal
yang mereka akan dibawa ke sana dan kenapa, pastikan fukyaa.com nampak sekeluarga
dari segi visual, dan tunjuk "langkah 3 dari 4" supaya orang tahu dia masih
dalam proses yang sama.

**Istilah**: guna "Trading Automatik", bukan "Pengurusan Aset". Pengurusan aset
adalah aktiviti berlesen di bawah Akta Pasaran Modal dan Perkhidmatan. Produk
sebenar ialah perisian pada akaun pelanggan sendiri — nama kena padan dengan itu.

---

## 7. Lapisan pematuhan — merentas seluruh laman

- Penzahiran risiko pada **setiap** halaman produk, bukan satu di footer
- Penzahiran komisen broker pada langkah buka akaun, terbuka
- Tiada bahasa jaminan: tiada "pasti untung", tiada "confirm profit",
  tiada tangkapan skrin P&L tanpa konteks
- Halaman `/risiko` penuh

Ini bukan sekadar perlindungan. Dalam ruang yang penuh hype, menjadi yang
telus adalah pembezaan kepada pembeli yang ada duit dan tak mudah tertipu.

---

## 8. Sistem reka bentuk

Daripada brand board.

| Token | Nilai | Guna |
|---|---|---|
| `--color-navy` | `#0B1F44` | teks utama, seksyen gelap |
| `--color-sky` | `#65B9F2` | aksen, pautan atas navy |
| `--color-pink` | `#FF3D9A` | CTA, penonjolan |
| `--color-mist` | `#F7F9FC` | latar |

Manrope untuk tajuk. Inter untuk teks badan. Kedua-dua di Google Fonts.

### Logo

Mark ialah dua parallelogram pada slant yang sama, dilukis terus sebagai SVG
dalam komponen — bukan dimask daripada fail — kerana ia dua warna tetap dan
CSS mask hanya boleh mewarna satu.

Wordmark ialah teks hidup, bukan imej. Ia mewarisi `currentColor`, jadi satu
komponen berfungsi navy atas header terang dan hampir-putih dalam footer navy,
tanpa aset kedua, dan kekal tajam pada sebarang saiz.

PNG yang dibekalkan merender warna lebih gelap daripada board — lebih kurang
`#2AA5EF` dan `#EB0A78`. Warna board digunakan, kerana pada `#EB0A78` teks
putih hanya mencapai 4.33:1 dan navy 3.77:1: kedua-duanya gagal AA, dan dua
pink berbeza atas skrin nampak seperti kesilapan.

### Pembetulan kontras — wajib

Teks putih atas Hot Pink ≈ **3.3:1**. Piawai WCAG AA untuk teks biasa ialah
4.5:1, jadi ia gagal. Butang pink guna **teks Ink Navy** (≈ 5.0:1), bukan putih.
Nampak lebih tajam juga.

Selamat: pink atas navy ≈ 5.0:1. Sky Blue atas navy ≈ 7.7:1 — itu warna
pautan terbaik dalam seksyen gelap.

### Nota

Laman bertukar dari gelap ke **terang** — latar Mist White, seksyen hero navy.
Pink tidak masuk carta: dalam konteks trading, magenta boleh terbaca sebagai
rugi bersebelahan hijau. Pink untuk brand dan CTA sahaja.

Motif X daripada logo jadi peranti struktur — potongan pepenjuru antara
seksyen, dan pemisah pada percabangan dua laluan.

---

## 9. Fasa

### Fasa 1 — bina rumah, tangkap minat

Semua halaman di atas, tetapi butang produk ialah **"Daftar minat"** atau
WhatsApp, bukan "Beli". Tiada checkout. Tiada login. Tiada sistem event penuh.

Keluarannya bukan jualan. Ia **senarai nama dan tahu siapa nak apa** — setiap
orang yang habis survey dah segmen dirinya sendiri. Data itu menentukan kursus
mana dirakam dahulu.

### Fasa 2 — bila kandungan sedia

Checkout sebenar, kawasan ahli untuk kursus, sistem event bertarikh.

Bina Fasa 2 sekarang bermakna bina sistem pembayaran untuk sifar pelanggan.

---

## 10. Model kandungan — menerbit kena senang

Risiko terbesar bukan reka bentuk. Laman ini **mesin penukar, bukan mesin
penarik** — yang bawa orang datang ialah video, yang belum dirakam. Kalau
menerbit menyusahkan, ia takkan berlaku, dan laman ini duduk mati macam yang
sebelumnya.

Jadi semua kandungan ialah fail, bukan borang CMS:

```
content/blog/*.md      artikel      (sudah ada)
content/video/*.md     video        (baru — embed YouTube/FB)
content/event/*.md     event        (baru)
src/lib/courses.ts     kursus       (ikut corak services.ts)
src/lib/products.ts    produk
```

Tambah video = tambah satu fail. Itu sahaja.

---

## 11. Yang diparkir

Kawasan ahli dengan login · checkout dalam talian · komuniti berbayar ·
halaman perbandingan broker · dwibahasa BM/EN · pengajar lain dalam Lounge.

---

## 12. Lubang yang belum diisi

**Halaman Tentang.** Belum ada bukti: berapa lama trade, pernah ajar berapa
orang, testimoni atau rekod, latar belakang. Struktur disediakan, isi menunggu.

Bukti lemah yang jujur masih lebih baik daripada bukti kuat yang orang tak
percaya.
