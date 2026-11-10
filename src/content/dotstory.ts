// The dot story at the top of the Data page (pack §2, beats 1–7; DotStory.dc.html). Beat copy
// is the pack's, word for word; the stage's labels, legend and screen-reader text are the
// prototype's. Templates fill from tb-ph-data.json at build time.
import { pack, ui, type Dict } from './types.ts';

const file = 'DotStory.dc.html';

export const dotStory = {
  // Beats (pack :44–87)
  b1_h1: pack('In 2024, about 724,000 Filipinos fell ill with TB.', 'Noong 2024, tinatayang 724,000 Pilipino ang nagkasakit ng TB.', 44, 46),
  b1_line: pack('Each dot is 1,000 people.', 'Bawat tuldok ay 1,000 katao.', 45, 47),
  b1_small: pack('WHO estimate. The true number is likely between 399,000 and 1.18 million.', 'Tantiya ng WHO. Malamang na nasa pagitan ng 399,000 at 1.18 milyon ang tunay na bilang.', 48, 49),
  b2: pack("That's about 2,000 people every day, more than one every minute.", 'Mga 2,000 katao iyan bawat araw, higit sa isa kada minuto.', 53, 54),
  b3_h2: pack('One in four was never found.', 'Isa sa bawat apat ang hindi natagpuan.', 58, 60),
  b3_line: pack(
    "About 179,000 people with TB weren't diagnosed or weren't reported in 2024. Without treatment, they stay sick and can keep spreading it.",
    'Mga 179,000 taong may TB ang hindi na-diagnose o hindi naiulat noong 2024. Kapag hindi nagamot, patuloy silang may sakit at maaaring makahawa pa.',
    59,
    61,
  ),
  b4_h2: pack('TB took about 37,000 lives, nearly 100 every day.', 'Mga 37,000 buhay ang kinuha ng TB, halos 100 bawat araw.', 65, 66),
  b5_h2: pack(
    'The Philippines has the 3rd-most TB cases in the world, and the highest TB rate in Southeast Asia.',
    'Pangatlo ang Pilipinas sa pinakamaraming kaso ng TB sa mundo, at pinakamataas ang antas ng TB nito sa Timog-Silangang Asya.',
    70,
    71,
  ),
  b6_h2: pack("Since 2015, our TB rate rose 14%. The world's fell 12%.", 'Mula 2015, tumaas nang 14% ang antas ng TB sa atin. Sa buong mundo, bumaba ito nang 12%.', 75, 76),
  b7_h2: pack('TB is curable. Testing and treatment are free at public health centers.', 'Nagagamot ang TB. Libre ang pagsusuri at gamutan sa mga pampublikong health center.', 80, 83),
  b7_line: pack('A cough that lasts 2 weeks deserves a test.', 'Ang ubong umabot na nang dalawang linggo ay dapat ipasuri.', 81, 84),
  b7_check: pack('Check your symptoms', 'Suriin ang iyong sintomas', 82, 85),
  b7_find: {
    en: 'Find TB care near you',
    fil: 'Hanapin ang gamutan malapit sa iyo',
    origin: 'override',
    src: ['readme:236', `proto:${file}`],
    flags: ['FIL-REVIEW'],
    note: 'Pack :82 and :85 say "Find a TB-DOTS center" / "Hanapin ang TB-DOTS center".',
  },
  b7_sources: pack(
    'Sources: WHO Global Tuberculosis Report 2025 (2024 estimates), DOH. Details on the {link}.',
    'Pinagmulan: WHO Global Tuberculosis Report 2025 (tantiya para sa 2024), DOH. Detalye sa {link}.',
    86,
    87,
  ),
  b7_link: pack('Data page', 'pahinang Datos', 86, 87),

  // Screen-reader text for the bar chart and the slope (beats 5 and 6)
  seaCaption: ui('TB rate per 100,000 people in Southeast Asia, 2024', 'Antas ng TB bawat 100,000 katao sa Timog-Silangang Asya, 2024', file),
  change: ui('Change in TB rate, 2015 to 2024', 'Pagbabago sa antas ng TB, 2015 hanggang 2024', file),
} satisfies Dict;

/** The stage island's strings: the legend, what the canvas draws, and its label per beat. */
export const dotStage = {
  // Legend
  ill: ui('Fell ill', 'Nagkasakit', file),
  missed: ui('Never found', 'Hindi natagpuan', file),
  died: ui('Died', 'Namatay', file),
  unit: ui('1 dot = 1,000 people', '1 tuldok = 1,000 katao', file),

  // Drawn on the canvas
  day: ui('One day ≈ 2 dots', 'Isang araw ≈ 2 tuldok', file),
  rate: ui('TB rate per 100,000 people, 2024', 'Antas ng TB bawat 100,000 katao, 2024', file),
  index: ui('Index: 2015 = 100', 'Indeks: 2015 = 100', file),
  ph: ui('Philippines', 'Pilipinas', file),
  world: ui('World', 'Mundo', file),

  // The canvas's label follows the beat
  label1: ui('A field of {n} dots. Each dot is 1,000 people who fell ill with TB in 2024.', 'Isang hanay ng {n} tuldok. Bawat tuldok ay 1,000 taong nagkasakit ng TB noong 2024.', file),
  label2: ui('The same field. About two dots fall ill every day.', 'Ang parehong hanay. Mga dalawang tuldok ang nagkakasakit bawat araw.', file),
  label3: ui('{missed} of the {n} dots are hollow: people who were never found.', '{missed} sa {n} tuldok ang walang laman: mga taong hindi natagpuan.', file),
  label4: ui('{died} dots are solid ink: people who died.', '{died} tuldok ang kulay itim: mga taong namatay.', file),
  label5: ui(
    'Bar chart of TB rates per 100,000 people in Southeast Asia, 2024. The Philippines is highest, at {rate}.',
    'Bar chart ng antas ng TB bawat 100,000 katao sa Timog-Silangang Asya, 2024. Pinakamataas ang Pilipinas, sa {rate}.',
    file,
  ),
  label6: ui(
    "Since 2015, the Philippines' TB rate rose {ph}%, while the world's fell {world}%.",
    'Mula 2015, tumaas nang {ph}% ang antas ng TB sa Pilipinas, habang bumaba nang {world}% sa buong mundo.',
    file,
  ),
} satisfies Dict;

export type DotStageStrings = { [K in keyof typeof dotStage]: string };
