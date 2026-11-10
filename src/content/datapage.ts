// The Data page around the charts (Data.dc.html): intro, "On this page", Methods and
// "TB in numbers". Chart copy is in charts.ts.
import { pack, ui, type Dict } from './types.ts';

const file = 'Data.dc.html';

export const dataPage = {
  h2: pack("The data", "Ang datos", 21, 21),
  intro: pack("These are the numbers behind TB in the Philippines. Most come from the World Health Organization's Global Tuberculosis Report 2025, which covers 2024. Estimates carry uncertainty, so we show ranges where they matter.", "Ito ang mga numero sa likod ng TB sa Pilipinas. Karamihan ay galing sa Global Tuberculosis Report 2025 ng World Health Organization, na sumasaklaw sa 2024. May kaakibat na di-katiyakan ang mga tantiya, kaya ipinapakita namin ang saklaw kapag mahalaga.", 428, 429),
  method1: pack("*Estimated* cases are WHO's model of how many people actually fell ill. *Notified* cases are those reported to DOH. The gap between them is the people who were missed.", "Ang *tantiyang* kaso ay modelo ng WHO kung ilan talaga ang nagkasakit. Ang *naiulat* ay ang mga kasong iniulat sa DOH. Ang agwat ay ang mga hindi natagpuan.", 452, 458),
  method2: pack("WHO re-estimates the whole time series every year. When the 2026 report comes out, every series gets replaced, not just extended.", "Taon-taon, muling tinatantiya ng WHO ang buong serye. Kapag lumabas ang ulat ng 2026, papalitan ang lahat ng serye, hindi lang dadagdagan.", 453, 459),
  method3: pack("Monthly figures for 2025–26 are provisional and will change.", "Pansamantala at maaaring magbago ang buwanang datos para sa 2025–26.", 454, 460),
  method4: pack("Risk-factor numbers overlap. A person can be both a smoker and diabetic, for example.", "Nagsasapawan ang mga numero ng risk factor. Halimbawa, maaaring naninigarilyo at may diabetes ang isang tao.", 455, 461),
  method5: pack("The 2016 prevalence survey screened adults with symptoms and chest X-rays and confirmed TB in the lab. It's the most recent survey with regional breakdowns.", "Sa prevalence survey noong 2016, sinuri ang mga nasa hustong gulang sa pamamagitan ng tanong tungkol sa sintomas at chest X-ray, at kinumpirma sa laboratoryo ang TB. Ito ang pinakabagong survey na may hati ayon sa rehiyon.", 456, 462),
  method6: pack("Current regional case counts aren't published as open data. DOH reported over 102,000 cases in Metro Manila in March 2026.", "Walang open data ng kasalukuyang bilang ng kaso ayon sa rehiyon. Iniulat ng DOH na higit 102,000 ang kaso sa Metro Manila noong Marso 2026.", 457, 463),
  onPage: ui("On this page", "Sa pahinang ito", file),
  top: ui("Back to top", "Bumalik sa itaas", file),
  inNumbers: ui("TB in numbers", "Ang TB sa mga numero", file),
  inNumbersLead: ui("Every number on this site, with its source. Estimates and provisional figures say so.", "Lahat ng numero sa site na ito, kasama ang pinagmulan. Nakasaad kung tantiya o pansamantala ang datos.", file),
  topic: ui("Topic", "Paksa", file),
  methods: ui("Methods and caveats", "Mga paraan at paalala", file),
  topic_all: ui("All", "Lahat", file),
  topic_burden: ui("How many fall ill", "Ilan ang nagkakasakit", file),
  topic_detection: ui("Finding cases", "Pagtukoy ng kaso", file),
  topic_who: pack("Who gets TB", "Sino ang nagkaka-TB", 439, 439),
  topic_drivers: pack("What drives TB", "Ano ang nagtutulak sa TB", 440, 440),
  topic_testing: pack("Testing", "Pagsusuri", 80, 324),
  topic_treatment: pack("Treatment", "Gamutan", 132, 132),
  topic_prevention: pack("Prevention", "Pag-iwas", 738, 150),
  topic_cost: ui("Costs to families", "Gastos ng pamilya", file),
  topic_funding: ui("Funding", "Pondo", file),
  topic_targets: ui("Targets", "Mga target", file),
  topic_regional: ui("Regions", "Mga rehiyon", file),
} satisfies Dict;
