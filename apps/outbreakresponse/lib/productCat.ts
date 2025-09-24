export function productCategory(s?: string) {
  const t = (s || "").toLowerCase()
  if (/beef|chicken|poultry|pork|ground|sausage|meat/.test(t)) return "Meat/Poultry"
  if (/milk|cheese|dairy|yogurt|ice cream/.test(t)) return "Dairy"
  if (/lettuce|salad|greens|spinach|romaine|sprout|produce|vegetable|fruit|berry|melon/.test(t)) return "Produce"
  if (/seafood|fish|tuna|salmon|shrimp|shellfish/.test(t)) return "Seafood"
  if (/ready-to-eat|rte|deli|sandwich/.test(t)) return "RTE"
  return "Other"
}
