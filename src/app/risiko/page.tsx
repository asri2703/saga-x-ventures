import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Penzahiran risiko",
  description:
    "Risiko yang terlibat dalam trading, dan batasan perkhidmatan Saga X Ventures.",
};

const points = [
  {
    h: "Trading membawa risiko kerugian",
    p: "Pasaran boleh bergerak menentang awak dengan cepat. Awak boleh kehilangan sebahagian atau keseluruhan modal, dan dalam keadaan tertentu kerugian boleh melebihi deposit awal bergantung kepada syarat broker awak.",
  },
  {
    h: "Prestasi lepas bukan jaminan",
    p: "Sebarang keputusan, rakaman atau contoh yang ditunjukkan menggambarkan apa yang telah berlaku, bukan apa yang akan berlaku. Sistem yang berfungsi sebelum ini boleh berhenti berfungsi.",
  },
  {
    h: "Kami tidak menguruskan dana",
    p: "Saga X Ventures menjual perisian, signal dan pendidikan. Kami tidak memegang wang pelanggan dan tidak berdagang bagi pihak sesiapa. Setiap akaun dagangan dibuka atas nama pelanggan dan kekal di bawah kawalan penuh pelanggan.",
  },
  {
    h: "Bukan nasihat pelaburan peribadi",
    p: "Kandungan, signal dan bahan pendidikan di laman ini bersifat umum. Ia tidak mengambil kira keadaan kewangan, objektif atau keperluan awak secara peribadi. Pertimbangkan sendiri, dan dapatkan nasihat berlesen jika awak perlukannya.",
  },
  {
    h: "Komisen broker",
    p: "Kami menerima komisen rujukan apabila awak membuka akaun melalui pautan kami. Ia tidak menambah kos kepada awak, tetapi ia bermakna kami mempunyai kepentingan kewangan dalam rujukan tersebut, dan awak berhak mengetahuinya.",
  },
  {
    h: "Sistem automatik boleh gagal",
    p: "Perisian, pelayan, sambungan internet dan broker semuanya boleh mengalami gangguan. Trading automatik mengurangkan kerja awak; ia tidak menghapuskan risiko, dan ia tidak berjalan sempurna sepanjang masa.",
  },
];

export default function RisikoPage() {
  return (
    <Section tone="base" className="pt-16 sm:pt-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-text sm:text-5xl">
          Penzahiran risiko
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-text-muted">
          {site.riskLine}
        </p>

        <div className="mt-12 space-y-10">
          {points.map((pt) => (
            <section key={pt.h}>
              <h2 className="font-display text-xl font-bold text-text">{pt.h}</h2>
              <p className="mt-3 leading-relaxed text-text-muted">{pt.p}</p>
            </section>
          ))}
        </div>
      </div>
    </Section>
  );
}
