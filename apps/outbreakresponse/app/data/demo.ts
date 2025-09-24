export type Outbreak = {
  id: string
  date: string
  state: string
  etiology: string
  vehicle?: string
  illnesses: number
  hospitalizations: number
  deaths: number
  source: string
}

export type Recall = {
  id: string
  date: string
  stateScope: string[]
  product: string
  reason: string
  illnessesReported?: number
  hospitalizationsReported?: number
  source: string
}

export const outbreaks: Outbreak[] = [
  { id: "ob1", date: "2025-08-12", state: "NM", etiology: "Salmonella", vehicle: "Produce", illnesses: 14, hospitalizations: 3, deaths: 0, source: "CDC-NORS" },
  { id: "ob2", date: "2025-07-02", state: "NM", etiology: "Norovirus", vehicle: "Restaurant", illnesses: 28, hospitalizations: 1, deaths: 0, source: "CDC-NORS" },
  { id: "ob3", date: "2025-06-22", state: "TX", etiology: "E. coli O157", vehicle: "Beef", illnesses: 9, hospitalizations: 2, deaths: 0, source: "CDC-NORS" },
  { id: "ob4", date: "2025-05-15", state: "CA", etiology: "Cyclospora", vehicle: "Produce", illnesses: 41, hospitalizations: 4, deaths: 0, source: "CDC-NORS" },
  { id: "ob5", date: "2025-04-18", state: "NM", etiology: "Campylobacter", vehicle: "Dairy", illnesses: 7, hospitalizations: 1, deaths: 0, source: "CDC-NORS" },
  { id: "ob6", date: "2025-03-09", state: "NY", etiology: "Listeria", vehicle: "RTE", illnesses: 6, hospitalizations: 6, deaths: 1, source: "CDC-NORS" },
  { id: "ob7", date: "2025-02-03", state: "CO", etiology: "Salmonella", vehicle: "Poultry", illnesses: 18, hospitalizations: 2, deaths: 0, source: "CDC-NORS" },
  { id: "ob8", date: "2025-01-25", state: "AZ", etiology: "Norovirus", vehicle: "Catering", illnesses: 52, hospitalizations: 0, deaths: 0, source: "CDC-NORS" }
]

export const recalls: Recall[] = [
  { id: "rc1", date: "2025-08-20", stateScope: ["National"], product: "Bagged Salad", reason: "Possible Cyclospora", illnessesReported: 12, hospitalizationsReported: 2, source: "FDA" },
  { id: "rc2", date: "2025-07-11", stateScope: ["NM","TX","CO"], product: "Queso Fresco", reason: "Possible Listeria", illnessesReported: 3, hospitalizationsReported: 2, source: "FDA" },
  { id: "rc3", date: "2025-06-06", stateScope: ["National"], product: "Frozen Berries", reason: "Possible Hepatitis A", source: "FDA" },
  { id: "rc4", date: "2025-05-28", stateScope: ["NM"], product: "Ground Beef", reason: "Possible E. coli O157", source: "USDA-FSIS" },
  { id: "rc5", date: "2025-04-09", stateScope: ["AZ","NM"], product: "Sprouts", reason: "Possible Salmonella", illnessesReported: 5, hospitalizationsReported: 1, source: "FDA" }
]
