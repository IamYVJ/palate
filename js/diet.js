// Veg / egg / non-veg, with a best guess from a dish's name and ingredients.

export const DIET = { veg: 'Veg', egg: 'Egg', nonveg: 'Non-veg' };

const NONVEG = /\b(chicken|mutton|lamb|goat|pork|beef|fish|prawns?|shrimps?|crab|lobster|keema|bacon|ham|salami|pepperoni|sausages?|anchov(y|ies)|tuna|salmon|squid|meat|fish sauce|oyster sauce)\b/i;
const EGG = /\b(eggs?|omelett?e|anda|mayonnaise)\b/i;

export function guessDiet(dish) {
  const text = [dish.name, ...(dish.ingredients || []).map((i) => i.name)].join(' ');
  return NONVEG.test(text) ? 'nonveg' : EGG.test(text) ? 'egg' : 'veg';
}
