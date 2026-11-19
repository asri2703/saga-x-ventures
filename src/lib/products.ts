/**
 * Products and courses.
 *
 * Names stay as Mastery Signal and Fukyaa because people already know them.
 * Neither name explains anything to a newcomer, though, so every surface
 * labels by the job and keeps the brand in support: "Trading Automatik —
 * Fukyaa". The label is what a visitor scans for; the brand is what they
 * remember afterwards.
 */

export type Track = "belajar" | "automatik";

export type Product = {
  slug: string;
  /** What it does — this leads, everywhere. */
  label: string;
  /** The brand name — always secondary. */
  brand: string;
  track: Track;
  summary: string;
  /** Who this is genuinely for. Naming the wrong fit filters bad leads early. */
  forYouIf: string[];
  notForYouIf: string[];
  /** External destination, when the product lives on its own domain. */
  external?: string;
};

export const products: Product[] = [
  {
    slug: "automatik",
    label: "Trading Automatik",
    brand: "Fukyaa",
    track: "automatik",
    summary:
      "Sistem yang trade pada akaun awak sendiri, tanpa awak perlu depan skrin. Awak pegang akaun; kami tidak pegang duit awak.",
    forYouIf: [
      "Masa awak kurang 30 minit sehari",
      "Awak tiada niat nak belajar baca carta",
      "Awak sudah ada modal dan mahu ia bekerja",
    ],
    notForYouIf: [
      "Awak mahu faham setiap keputusan yang dibuat",
      "Awak tidak selesa sistem bertindak tanpa kelulusan awak",
    ],
    external: "https://fukyaa.com",
  },
  {
    slug: "signal",
    label: "Signal & Self-Trade",
    brand: "Mastery Signal",
    track: "belajar",
    summary:
      "Signal dan analisis untuk awak yang buat keputusan sendiri. Awak tetap yang tekan butang — ini sokongan, bukan autopilot.",
    forYouIf: [
      "Awak sudah tahu asas dan mahu idea yang lebih baik",
      "Awak ada sejam dua sehari",
      "Awak mahu belajar daripada setiap posisi",
    ],
    notForYouIf: [
      "Awak belum pernah trade langsung — mula dengan Asas Trading dulu",
      "Awak mahu sesuatu yang jalan tanpa awak",
    ],
    external: "https://masterysignal.com",
  },
];

export type Course = {
  slug: string;
  name: string;
  summary: string;
  /** Stated as what they can do afterwards, not as topics covered. */
  outcomes: string[];
  level: "Mula dari sifar" | "Sudah ada asas" | "Sudah trade";
};

export const courses: Course[] = [
  {
    slug: "asas",
    name: "Asas Trading",
    summary:
      "Dari sifar sampai boleh buka posisi pertama dengan faham apa yang awak buat dan berapa yang awak pertaruhkan.",
    outcomes: [
      "Buka dan urus posisi tanpa teragak-agak",
      "Kira saiz lot ikut risiko, bukan ikut rasa",
      "Baca carta cukup untuk tahu bila nak duduk diam",
    ],
    level: "Mula dari sifar",
  },
  {
    slug: "news",
    name: "Trade The News",
    summary:
      "Berita gerakkan pasaran dalam beberapa saat. Kelas ini tentang bersedia sebelum ia keluar, bukan mengejar selepas.",
    outcomes: [
      "Tahu berita mana yang penting dan mana yang bising",
      "Sediakan pelan sebelum angka keluar",
      "Urus risiko waktu pasaran bergerak laju",
    ],
    level: "Sudah ada asas",
  },
  {
    slug: "strategi",
    name: "Trading Strategy",
    summary:
      "Bina satu sistem yang awak boleh ulang, uji dan percaya — dan tahu bila ia berhenti berfungsi.",
    outcomes: [
      "Tulis peraturan masuk dan keluar yang jelas",
      "Uji ke belakang sebelum pertaruh duit sebenar",
      "Kenal bila sistem rosak, bukan hanya bernasib malang",
    ],
    level: "Sudah trade",
  },
];
