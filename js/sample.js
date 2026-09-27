// Sample data so the app can be explored before entering your own. Dates are relative to today.

import { uid, blank } from './store.js';
import { todayISO } from './ui.js';

const ing = (s) => s.split(';').map((x) => {
  const [name, qty = ''] = x.split('|').map((t) => t.trim());
  return { name, qty };
});
const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${q} recipe`)}`;

export function sampleData() {
  const d = (n) => todayISO(-n);
  const data = blank();
  data.settings = { cookName: 'Didi', cookPhone: '', lang: 'en' };

  const dish = (o) => {
    const x = {
      id: uid(), status: 'can_make', rating: null, favorite: false, cuisine: 'North Indian', meals: ['lunch', 'dinner'],
      ingredients: [], links: [], cookTime: null, tags: [], instructions: '', notes: '', from: null, addedOn: d(120), ...o,
    };
    data.dishes.push(x);
    return x;
  };

  const palak = dish({ name: 'Palak Paneer', rating: 9, favorite: true, cookTime: 40, tags: ['vegetarian', 'high protein'],
    ingredients: ing('Spinach|2 bunches; Paneer|200 g; Onion|1; Tomato|2; Ginger garlic paste|1 tbsp; Green chilli|2; Cream|2 tbsp; Garam masala|½ tsp; Cumin seeds|1 tsp'),
    instructions: 'Blanch the spinach so it stays bright green. Less oil please.', links: [yt('palak paneer')] });
  const dal = dish({ name: 'Dal Tadka', rating: 8, cookTime: 35, tags: ['comfort'],
    ingredients: ing('Toor dal|1 cup; Onion|1; Tomato|1; Garlic|6 cloves; Cumin seeds|1 tsp; Ghee|1 tbsp; Red chilli powder|½ tsp; Turmeric|¼ tsp') });
  const rajma = dish({ name: 'Rajma Chawal', rating: 9, favorite: true, cookTime: 60, tags: ['comfort', 'sunday'],
    ingredients: ing('Rajma|1 cup; Rice|1½ cups; Onion|2; Tomato|3; Ginger garlic paste|1 tbsp; Garam masala|1 tsp'),
    instructions: 'Soak the rajma the night before.' });
  const aloogobi = dish({ name: 'Aloo Gobi', rating: 7, cookTime: 30,
    ingredients: ing('Potato|3; Cauliflower|1 small; Onion|1; Tomato|1; Turmeric|½ tsp; Coriander leaves|handful') });
  const bhindi = dish({ name: 'Bhindi Masala', rating: 6, cookTime: 30, ingredients: ing('Bhindi|500 g; Onion|2; Amchur|1 tsp; Turmeric|¼ tsp') });
  const chole = dish({ name: 'Chole', rating: 8, cookTime: 50,
    ingredients: ing('Kabuli chana|1 cup; Onion|2; Tomato|2; Chole masala|2 tsp; Ginger garlic paste|1 tbsp') });
  const poha = dish({ name: 'Poha', rating: 7, cookTime: 20, meals: ['breakfast'],
    ingredients: ing('Poha|2 cups; Onion|1; Peanuts|¼ cup; Curry leaves|1 sprig; Mustard seeds|1 tsp; Turmeric|¼ tsp; Lemon|1; Coriander leaves|handful') });
  const paratha = dish({ name: 'Aloo Paratha', rating: 8, cookTime: 40, meals: ['breakfast', 'lunch'],
    ingredients: ing('Atta|2 cups; Potato|3; Green chilli|2; Coriander leaves|handful; Ghee|to cook; Curd|to serve') });
  const omelette = dish({ name: 'Masala Omelette', rating: 7, cookTime: 10, meals: ['breakfast'], tags: ['quick', 'high protein'],
    ingredients: ing('Eggs|3; Onion|1 small; Tomato|1; Green chilli|1; Coriander leaves|handful; Bread|4 slices') });
  const khichdi = dish({ name: 'Moong Dal Khichdi', rating: 6, cookTime: 30, meals: ['dinner'], tags: ['light', 'comfort'],
    ingredients: ing('Moong dal|½ cup; Rice|½ cup; Ghee|1 tbsp; Cumin seeds|1 tsp; Turmeric|¼ tsp') });

  // Restaurants
  const place = (o) => {
    const r = { id: uid(), status: 'been', area: '', cuisine: '', mapUrl: '', recommendedBy: '', notes: '', addedOn: d(200), dishes: [], ...o };
    r.dishes = r.dishes.map((x) => ({ id: uid(), tried: true, rating: null, verdict: '', notes: '', addedOn: r.addedOn, ...x }));
    data.restaurants.push(r);
    return r;
  };
  const xyz = place({ name: 'XYZ', area: 'GK 1', cuisine: 'Italian', recommendedBy: 'Riya', notes: 'Ask for a table on the terrace.', addedOn: d(60),
    dishes: [
      { name: 'Truffle Pizza', rating: 9, verdict: 'reorder', notes: 'Thin crust, generous with the truffle.' },
      { name: 'Burrata', rating: 8 },
      { name: 'Tiramisu', rating: 6, verdict: 'skip', notes: 'Too sweet.' },
      { name: 'Aglio Olio', tried: false, notes: 'Riya says it’s the best thing here.' },
    ] });
  const bangkok = place({ name: 'Bangkok Street', area: 'Hauz Khas', cuisine: 'Thai', addedOn: d(40),
    dishes: [
      { name: 'Thai Green Curry', rating: 9, verdict: 'reorder', notes: 'Proper heat, lots of basil.' },
      { name: 'Pad Thai', rating: 7 },
      { name: 'Som Tam', rating: 5, verdict: 'skip', notes: 'Way too sour.' },
    ] });
  const saffron = place({ name: 'Saffron Lane', area: 'Khan Market', cuisine: 'North Indian', addedOn: d(150),
    dishes: [
      { name: 'Dal Makhani', rating: 9, verdict: 'reorder', notes: 'Better than home, honestly.' },
      { name: 'Garlic Naan', rating: 8, verdict: 'reorder' },
      { name: 'Paneer Tikka', rating: 7 },
    ] });
  place({ name: 'The Dumpling Room', status: 'want', area: 'GK 2', cuisine: 'Asian', recommendedBy: 'Arjun', addedOn: d(12),
    notes: 'Arjun: go on a weekday, weekends are packed.', dishes: [{ name: 'Chilli oil dumplings', tried: false }] });
  place({ name: 'Coastal Curry House', status: 'want', area: 'Defence Colony', cuisine: 'Kerala', recommendedBy: 'Meera (Instagram)', addedOn: d(5),
    dishes: [{ name: 'Appam with stew', tried: false }] });
  place({ name: 'Olive Tree Café', status: 'want', area: 'GK 1', cuisine: 'Café', addedOn: d(20) });

  // The restaurant → home loop, in progress.
  dish({ name: 'Thai Green Curry', status: 'learning', cuisine: 'Thai', meals: ['dinner'], addedOn: d(30),
    ingredients: ing('Coconut milk|400 ml; Thai green curry paste|3 tbsp; Mixed vegetables|2 cups; Tofu|200 g; Basil|handful'),
    links: [yt('thai green curry')], notes: 'Loved it at Bangkok Street (9/10). Proper heat, lots of basil.',
    from: { restaurantId: bangkok.id, rdishId: bangkok.dishes[0].id } });
  dish({ name: 'Shakshuka', status: 'want_to_try', cuisine: 'Middle Eastern', meals: ['breakfast'], addedOn: d(8),
    ingredients: ing('Eggs|4; Tomato|4; Onion|1; Bell pepper|1; Paprika|1 tsp'), links: [yt('shakshuka')], notes: 'Saw a reel, looked easy.' });

  // What's in the kitchen
  const pantry = (kind, names, status = 'have', ageDays = 30) => {
    for (const name of names.split(',').map((n) => n.trim())) data.pantry.push({ id: uid(), name, kind, status, since: d(ageDays) });
  };
  pantry('staple', 'Rice, Atta, Toor dal, Moong dal, Rajma, Poha, Onion, Potato, Ginger garlic paste, Garam masala, Cumin seeds, Turmeric, Red chilli powder, Mustard seeds, Ghee, Oil, Peanuts');
  pantry('staple', 'Kabuli chana', 'low');
  pantry('fresh', 'Spinach', 'have', 4);
  pantry('fresh', 'Tomato', 'have', 2);
  pantry('fresh', 'Green chilli', 'have', 5);
  pantry('fresh', 'Coriander leaves, Curd', 'have', 2);
  pantry('fresh', 'Cauliflower', 'have', 1);
  pantry('fresh', 'Curry leaves', 'have', 6);
  pantry('fresh', 'Eggs, Lemon', 'have', 3);
  pantry('fresh', 'Bread', 'low', 4);
  pantry('fresh', 'Paneer, Bhindi', 'out', 9);
  pantry('special', 'Thai green curry paste');
  pantry('special', 'Cream', 'low', 10);
  pantry('special', 'Coconut milk', 'out');

  // The food log
  const ate = (x, days, slot = 'dinner') => data.meals.push({ id: uid(), date: d(days), slot, kind: 'home', dishId: x.id, label: x.name });
  const went = (r, days, kind = 'out') => data.meals.push({ id: uid(), date: d(days), slot: 'dinner', kind, restaurantId: r.id, label: r.name });
  ate(palak, 9); ate(palak, 31); ate(dal, 2, 'lunch'); ate(dal, 15, 'lunch'); ate(rajma, 16, 'lunch'); ate(rajma, 44, 'lunch');
  ate(aloogobi, 6); ate(bhindi, 12, 'lunch'); ate(chole, 21, 'lunch'); ate(poha, 3, 'breakfast'); ate(poha, 10, 'breakfast');
  ate(paratha, 8, 'breakfast'); ate(omelette, 1, 'breakfast'); ate(omelette, 5, 'breakfast'); ate(khichdi, 27); ate(dal, 4); ate(aloogobi, 19, 'lunch');
  went(xyz, 18); went(xyz, 52); went(bangkok, 25); went(saffron, 5, 'order'); went(saffron, 13, 'order'); went(saffron, 33, 'order'); went(saffron, 150);

  // Tonight's plan: the example from the vision doc (paneer is out, so it lands on the shopping list).
  data.plan.push({ id: uid(), dishId: palak.id, date: todayISO(), slot: 'dinner', sent: false });
  data.shopExtra.push({ id: uid(), name: 'Bananas' });

  return data;
}
