import type { ClientQuestion, NumeracyQuestion, Phase, VerticalMath } from './types.ts';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildOptions(answer: number, nearOffsets: number[]): number[] {
  const set = new Set<number>([answer]);
  const shuffledOffsets = shuffle(nearOffsets);

  for (const offset of shuffledOffsets) {
    if (set.size >= 4) break;
    const candidate = answer + offset;
    if (candidate >= 0 && candidate !== answer) {
      set.add(candidate);
    }
  }

  let fallback = 1;
  while (set.size < 4) {
    const candidate = answer + fallback;
    if (!set.has(candidate)) {
      set.add(candidate);
    }
    fallback++;
  }

  return shuffle(Array.from(set));
}

function generateFaseBQuestion(index: number): NumeracyQuestion {
  const id = `B-${Date.now()}-${index}-${randInt(100, 999)}`;
  const kind = randInt(1, 5);

  // 1: Penjumlahan sederhana atau bersusun (Kelas 3-4)
  if (kind === 1) {
    const a = randInt(14, 68);
    const b = randInt(12, 49);
    const answer = a + b;
    const useVertical = Math.random() < 0.45;
    const vertical: VerticalMath | undefined = useVertical
      ? { top: a, bottom: b, operator: '+' }
      : undefined;

    return {
      id,
      prompt: useVertical ? 'Hitunglah penjumlahan bersusun berikut:' : `${a} + ${b} = ...`,
      vertical,
      answer,
      options: buildOptions(answer, [-10, 10, -1, 1, -2, 2, 11, -9]),
    };
  }

  // 2: Pengurangan sederhana atau bersusun (Kelas 3-4)
  if (kind === 2) {
    const b = randInt(12, 45);
    const answer = randInt(11, 52);
    const a = b + answer;
    const useVertical = Math.random() < 0.45;
    const vertical: VerticalMath | undefined = useVertical
      ? { top: a, bottom: b, operator: '-' }
      : undefined;

    return {
      id,
      prompt: useVertical ? 'Hitunglah pengurangan bersusun berikut:' : `${a} − ${b} = ...`,
      vertical,
      answer,
      options: buildOptions(answer, [-10, 10, -1, 1, -2, 2, 9, -8]),
    };
  }

  // 3: Perkalian dasar (Kelas 3-4)
  if (kind === 3) {
    const a = randInt(3, 12);
    const b = randInt(3, 9);
    const answer = a * b;
    return {
      id,
      prompt: `${a} × ${b} = ...`,
      answer,
      options: buildOptions(answer, [-a, a, -b, b, -2, 2, 4, -4]),
    };
  }

  // 4: Pembagian habis (Kelas 3-4)
  if (kind === 4) {
    const divisor = randInt(3, 9);
    const answer = randInt(3, 12);
    const dividend = divisor * answer;
    return {
      id,
      prompt: `${dividend} : ${divisor} = ...`,
      answer,
      options: buildOptions(answer, [-1, 1, -2, 2, -3, 3, 4]),
    };
  }

  // 5: Soal cerita sederhana Fase B
  const templates = [
    () => {
      const a = randInt(15, 38);
      const b = randInt(12, 29);
      const answer = a + b;
      const nama = pick(['Siti', 'Budi', 'Dayu', 'Edo', 'Lani']);
      return {
        prompt: `${nama} memetik ${a} jeruk dan ${b} mangga di kebun. Berapa jumlah seluruh buah yang dipetik?`,
        answer,
        offsets: [-10, 10, -2, 2, -1, 1],
      };
    },
    () => {
      const total = randInt(35, 75);
      const given = randInt(12, 28);
      const answer = total - given;
      const nama = pick(['Udin', 'Rani', 'Rudi', 'Maya']);
      return {
        prompt: `${nama} memiliki ${total} kelereng. Sebanyak ${given} kelereng diberikan kepada adiknya. Sisa kelereng ${nama} adalah...`,
        answer,
        offsets: [-10, 10, -2, 2, -3, 3],
      };
    },
    () => {
      const kotak = randInt(4, 8);
      const isi = randInt(5, 9);
      const answer = kotak * isi;
      return {
        prompt: `Di kelas ada ${kotak} kotak pensil. Setiap kotak berisi ${isi} pensil. Berapa jumlah seluruh pensil?`,
        answer,
        offsets: [-isi, isi, -kotak, kotak, -2, 2],
      };
    },
    () => {
      const anak = randInt(4, 8);
      const answer = randInt(4, 9);
      const permen = anak * answer;
      return {
        prompt: `Ibu guru membagikan ${permen} permen sama rata kepada ${anak} siswa. Berapa permen yang diterima setiap siswa?`,
        answer,
        offsets: [-1, 1, -2, 2, 3, -3],
      };
    },
  ];

  const chosen = pick(templates)();
  return {
    id,
    prompt: chosen.prompt,
    answer: chosen.answer,
    options: buildOptions(chosen.answer, chosen.offsets),
  };
}

function generateFaseCQuestion(index: number): NumeracyQuestion {
  const id = `C-${Date.now()}-${index}-${randInt(100, 999)}`;
  const kind = randInt(1, 5);

  // 1: Perkalian dua angka bersusun (Kelas 5-6)
  if (kind === 1) {
    const a = randInt(12, 34);
    const b = randInt(11, 24);
    const answer = a * b;
    const useVertical = Math.random() < 0.65;
    const vertical: VerticalMath | undefined = useVertical
      ? { top: a, bottom: b, operator: '×' }
      : undefined;

    return {
      id,
      prompt: useVertical ? 'Hitunglah perkalian bersusun berikut:' : `${a} × ${b} = ...`,
      vertical,
      answer,
      options: buildOptions(answer, [-10, 10, -a, a, -b, b, -20, 20]),
    };
  }

  // 2: Penjumlahan / pengurangan bilangan ratusan bersusun
  if (kind === 2) {
    const isAdd = Math.random() < 0.5;
    if (isAdd) {
      const a = randInt(125, 485);
      const b = randInt(115, 395);
      const answer = a + b;
      return {
        id,
        prompt: 'Hitunglah penjumlahan bersusun berikut:',
        vertical: { top: a, bottom: b, operator: '+' },
        answer,
        options: buildOptions(answer, [-10, 10, -100, 100, -2, 2, -20, 20]),
      };
    } else {
      const b = randInt(115, 295);
      const answer = randInt(120, 340);
      const a = b + answer;
      return {
        id,
        prompt: 'Hitunglah pengurangan bersusun berikut:',
        vertical: { top: a, bottom: b, operator: '-' },
        answer,
        options: buildOptions(answer, [-10, 10, -100, 100, -2, 2, -20, 20]),
      };
    }
  }

  // 3: Pembagian dua angka / ratusan
  if (kind === 3) {
    const divisor = randInt(6, 15);
    const answer = randInt(11, 24);
    const dividend = divisor * answer;
    return {
      id,
      prompt: `${dividend} : ${divisor} = ...`,
      answer,
      options: buildOptions(answer, [-1, 1, -2, 2, -10, 10, 3]),
    };
  }

  // 4: Operasi hitung campuran
  if (kind === 4) {
    const a = randInt(12, 35);
    const b = randInt(3, 9);
    const c = randInt(4, 9);
    const answer = a + b * c;
    return {
      id,
      prompt: `${a} + ${b} × ${c} = ...`,
      answer,
      options: buildOptions(answer, [(a + b) * c - answer, -10, 10, -b, b, -2, 2]),
    };
  }

  // 5: Soal cerita sehari-hari Fase C
  const templates = [
    () => {
      const kursiPerBaris = randInt(12, 18);
      const jumlahBaris = randInt(11, 16);
      const answer = kursiPerBaris * jumlahBaris;
      return {
        prompt: `Aula SDN Lendang Telaga memiliki ${jumlahBaris} baris kursi. Setiap baris berisi ${kursiPerBaris} kursi. Berapa seluruh kursi di aula?`,
        answer,
        offsets: [-10, 10, -kursiPerBaris, kursiPerBaris, -20, 20],
      };
    },
    () => {
      const kelompok = randInt(8, 14);
      const answer = randInt(12, 22);
      const buku = kelompok * answer;
      return {
        prompt: `Perpustakaan menerima ${buku} buku cerita baru yang dibagikan sama rata ke ${kelompok} rak buku. Berapa buku di setiap rak?`,
        answer,
        offsets: [-1, 1, -2, 2, -4, 4],
      };
    },
    () => {
      const jarakPerPutaran = randInt(150, 250);
      const putaran = randInt(4, 8);
      const answer = jarakPerPutaran * putaran;
      const nama = pick(['Ahmad', 'Nisa', 'Fajar', 'Putri']);
      return {
        prompt: `${nama} berlari mengelilingi lapangan sejauh ${jarakPerPutaran} meter setiap putaran. Jika berlari ${putaran} putaran, berapa meter jarak totalnya?`,
        answer,
        offsets: [-100, 100, -50, 50, -jarakPerPutaran, jarakPerPutaran],
      };
    },
    () => {
      const awal = randInt(180, 320);
      const tambah = randInt(45, 95);
      const keluar = randInt(30, 80);
      const answer = awal + tambah - keluar;
      return {
        prompt: `Koperasi sekolah memiliki ${awal} buku tulis. Hari ini datang kiriman ${tambah} buku, lalu terjual ${keluar} buku. Berapa sisa buku tulis sekarang?`,
        answer,
        offsets: [-10, 10, -20, 20, -5, 5],
      };
    },
  ];

  const chosen = pick(templates)();
  return {
    id,
    prompt: chosen.prompt,
    answer: chosen.answer,
    options: buildOptions(chosen.answer, chosen.offsets),
  };
}

export function generateQuestion(phase: Phase, index: number): NumeracyQuestion {
  return phase === 'B' ? generateFaseBQuestion(index) : generateFaseCQuestion(index);
}

export function generateQuestionSet(phase: Phase, count = 25): NumeracyQuestion[] {
  const list: NumeracyQuestion[] = [];
  for (let i = 0; i < count; i++) {
    list.push(generateQuestion(phase, i));
  }
  return list;
}

export function toClientQuestion(q: NumeracyQuestion): ClientQuestion {
  return {
    id: q.id,
    prompt: q.prompt,
    vertical: q.vertical,
    options: q.options,
  };
}
