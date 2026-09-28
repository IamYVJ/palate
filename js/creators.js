// Recommended YouTube cooking channels, and which ones suit a given dish.
// Used for the "find a video" searches on a dish page.

export const CREATORS = {
  ranveer: { name: 'Ranveer Brar', handle: 'RanveerBrar', bestFor: 'Rich gravies, Awadhi food, the why behind each step' },
  yourfoodlab: { name: 'Your Food Lab', handle: 'YourFoodLab', bestFor: 'Street food, café-style fusion, restaurant classics' },
  kunal: { name: 'Kunal Kapur', handle: 'KunalKapur', bestFor: 'Dals, North Indian and tandoori, festival specials' },
  sanjeev: { name: 'Sanjeev Kapoor Khazana', handle: 'sanjeevkapoorkhazana', bestFor: 'Foolproof versions of almost any Indian classic' },
  bharatz: { name: 'bharatzkitchen', handle: 'bharatzkitchenHINDI', bestFor: 'Doughs, restaurant gravy bases, crispy snacks' },
  nisha: { name: 'Nisha Madhulika', handle: 'nishamadhulika', bestFor: 'Pure-veg daily sabzis, sweets, no onion-garlic' },
  kabita: { name: 'Kabita’s Kitchen', handle: 'KabitasKitchen', bestFor: 'Quick weeknight and one-pot meals' },
  hebbars: { name: 'Hebbars Kitchen', handle: 'HebbarsKitchen', bestFor: 'South Indian breakfasts, quick snacks' },
  vahchef: { name: 'Vahchef', handle: 'vahrehvah', bestFor: 'Andhra and Hyderabadi food, biryanis' },
  bongeats: { name: 'Bong Eats', handle: 'BongEats', bestFor: 'Bengali heritage cooking' },
  shivesh: { name: 'Bake With Shivesh', handle: 'BakeWithShivesh', bestFor: 'Eggless desserts and baking' },
};

const BY_CUISINE = [
  [/south indian|kerala|tamil|udupi|karnataka|chettinad/i, ['hebbars', 'vahchef', 'sanjeev']],
  [/hyderabad|andhra|telangana/i, ['vahchef', 'hebbars', 'ranveer']],
  [/bengali|bong/i, ['bongeats', 'ranveer', 'sanjeev']],
  [/gujarati|maharashtrian|rajasthani/i, ['nisha', 'hebbars', 'kabita']],
  [/street|indo-chinese|chinese|italian|mexican|thai|burmese|tibetan|continental|american|greek|middle eastern|japanese|fusion|café|cafe/i, ['yourfoodlab', 'ranveer', 'kunal']],
  [/north indian|punjabi|mughlai|awadhi|lucknowi|dhaba/i, ['ranveer', 'kunal', 'nisha']],
];

/** The three creators most likely to have a good video for this dish. */
export function creatorsFor(dish) {
  const tags = (dish.tags || []).join(' ');
  if (/dessert|sweet|cake|bak(e|ing)|cookie|mithai/i.test(`${dish.name} ${tags}`)) return ['shivesh', 'nisha', 'ranveer'];
  const hit = BY_CUISINE.find(([re]) => re.test(dish.cuisine || ''));
  return hit ? hit[1] : ['sanjeev', 'kabita', 'nisha'];
}

export const creatorSearchUrl = (key, query) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${CREATORS[key].name} ${query}`)}`;
