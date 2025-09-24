export type Recall = {
  rec_id: string
  date: string
  agency: 'FDA'|'USDA'
  klass?: 'I'|'II'|'III'
  product: string
  pathogen?: string
  firm?: string
  states?: string[]
  url?: string
}
export type Outbreak = {
  ob_id: string
  onset_date: string
  state: string
  county?: string
  pathogen?: string
  food_cat?: string
  cases?: number
  hospitalizations?: number
  deaths?: number
  status?: string
  url?: string
}
