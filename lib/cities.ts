export const CITIES = [
  'Prishtinë',
  'Prizren',
  'Ferizaj',
  'Pejë',
  'Gjakovë',
  'Gjilan',
  'Mitrovicë',
  'Podujevë',
  'Vushtrri',
  'Suharekë',
  'Rahovec',
  'Malishevë',
  'Lipjan',
  'Skenderaj',
  'Drenas',
  'Istog',
  'Klinë',
  'Deçan',
  'Dragash',
  'Kaçanik',
  'Shtime',
  'Fushë Kosovë',
  'Obiliq',
  'Graçanicë',
  'Vitia',
  'Kamenicë',
  'Han i Elezit',
  'Junik',
  'Mamushë',
] as const

export type City = (typeof CITIES)[number]

export function isCity(value: string): value is City {
  return (CITIES as readonly string[]).includes(value)
}
