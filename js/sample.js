// Sample data so the app can be explored before entering your own. Dates are relative to today.
// A vegetarian household: the dish library is built from the catalogue; egg dishes are archived.

import { uid, blank } from './store.js';
import { todayISO } from './ui.js';
import { CATALOG, videoFields } from './catalog.js';

const ing = (s) => s.split(';').map((x) => {
  const [name, qty = ''] = x.split('|').map((t) => t.trim());
  return { name, qty };
});

export function sampleData() {
  const d = (n) => todayISO(-n);
  const data = blank();
  data.settings = { cookName: 'Didi', cookPhone: '', lang: 'en' };

  const dish = (o) => {
    const x = {
      id: uid(), status: 'can_make', diet: 'veg', archived: false, rating: null, favorite: false, cuisine: 'North Indian',
      meals: ['lunch', 'dinner'], ingredients: [], links: [], linkInfo: {}, cookTime: null, tags: [], instructions: '', notes: '', from: null,
      addedOn: d(120), ...o,
    };
    data.dishes.push(x);
    return x;
  };
  // Take a dish from the catalogue, with this household's status, rating and notes on top.
  const pick = (name, o = {}) => {
    const c = CATALOG.find((x) => x.name === name);
    if (!c) throw new Error(`sample: "${name}" is not in the catalogue`);
    const { region, ...fields } = c;
    return dish({
      ...fields, ingredients: fields.ingredients.map((i) => ({ ...i })), tags: [...fields.tags],
      links: [...fields.links], linkInfo: { ...fields.linkInfo }, ...o,
    });
  };

  // ---- Indian: what Didi makes ----
  const palak = pick('Palak Paneer', { rating: 9, favorite: true,
    instructions: 'Blanch the spinach so it stays bright green. Less oil please.' });
  const pbm = pick('Paneer Butter Masala', { rating: 8 });
  const matar = pick('Matar Paneer', { rating: 7 });
  const kadai = pick('Kadai Paneer', { rating: 8 });
  const bhurji = pick('Paneer Bhurji', { rating: 7 });
  const dal = pick('Dal Tadka', { rating: 8 });
  const makhani = pick('Dal Makhani', { rating: 7, notes: 'Saffron Lane’s is still better.' });
  const rajma = pick('Rajma Chawal', { rating: 9, favorite: true, instructions: 'Soak the rajma the night before.' });
  const chole = pick('Chole', { rating: 8 });
  const kadhi = pick('Kadhi Pakora', { rating: 7 });
  const aloogobi = pick('Aloo Gobi', { rating: 7 });
  pick('Aloo Matar', { rating: 6 });
  const bhindi = pick('Bhindi Masala', { rating: 6 });
  const baingan = pick('Baingan Bharta', { rating: 7 });
  const mixveg = pick('Mix Veg', { rating: 6 });
  const paratha = pick('Aloo Paratha', { rating: 8 });
  const chilla = pick('Besan Chilla', { rating: 7 });
  const khichdi = pick('Moong Dal Khichdi', { rating: 6 });
  const jeera = pick('Jeera Rice', { rating: 7 });
  const pulao = pick('Veg Pulao', { rating: 7 });
  const biryani = pick('Veg Biryani', { rating: 8 });
  const pavbhaji = pick('Pav Bhaji', { rating: 9, favorite: true });
  const poha = pick('Poha', { rating: 7 });
  const thepla = pick('Methi Thepla', { rating: 7 });
  const upma = pick('Upma', { rating: 6 });
  pick('Malai Kofta', { status: 'learning' });
  pick('Masala Dosa', { status: 'learning', notes: 'Buy ready dosa batter to start with.' });
  pick('Idli Sambar', { status: 'want_to_try' });

  // ---- International ----
  const hakka = pick('Veg Hakka Noodles', { rating: 8 });
  const friedrice = pick('Veg Fried Rice', { rating: 7 });
  const chillipaneer = pick('Chilli Paneer', { rating: 9, favorite: true });
  const manchurian = pick('Veg Manchurian', { rating: 7 });
  const arrabbiata = pick('Penne Arrabbiata', { rating: 8 });
  const mac = pick('Mac and Cheese', { rating: 7 });
  const soup = pick('Tomato Basil Soup', { rating: 7 });
  const quesadilla = pick('Cheese Quesadilla', { rating: 7 });
  pick('Pesto Pasta', { status: 'learning' });
  pick('Margherita Pizza', { status: 'learning', notes: 'Start with ready pizza bases.' });
  pick('Mushroom Risotto', { status: 'want_to_try' });
  pick('Falafel & Hummus', { status: 'want_to_try', notes: 'Saw a reel, looked easy.' });
  pick('Veg Burrito Bowl', { status: 'want_to_try' });
  pick('Greek Salad', { status: 'want_to_try' });

  // ---- Egg dishes: archived for now (history kept) ----
  const omelette = dish({ name: 'Masala Omelette', diet: 'egg', archived: true, rating: 7, cookTime: 10, meals: ['breakfast'], tags: ['quick', 'high protein'],
    ingredients: ing('Eggs|3; Onion|1 small; Tomato|1; Green chilli|1; Coriander leaves|handful; Bread|4 slices'), ...videoFields('Masala Omelette') });
  dish({ name: 'Shakshuka', diet: 'egg', archived: true, status: 'want_to_try', cuisine: 'Middle Eastern', meals: ['breakfast'], addedOn: d(8),
    ingredients: ing('Eggs|4; Tomato|4; Onion|1; Capsicum|1; Paprika|1 tsp'), ...videoFields('Shakshuka') });

  // ---- Restaurants ----
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
      { name: 'Thai Green Curry', rating: 9, verdict: 'reorder', notes: 'Proper heat, lots of basil. Ask for the veg version.' },
      { name: 'Veg Pad Thai', rating: 7 },
      { name: 'Tofu Satay', rating: 5, verdict: 'skip', notes: 'Dry, and the sauce was too sweet.' },
    ] });
  const saffron = place({ name: 'Saffron Lane', area: 'Khan Market', cuisine: 'North Indian', addedOn: d(150),
    dishes: [
      { name: 'Dal Makhani', rating: 9, verdict: 'reorder', notes: 'Better than home, honestly.' },
      { name: 'Garlic Naan', rating: 8, verdict: 'reorder' },
      { name: 'Paneer Tikka', rating: 7 },
    ] });
  place({ name: 'The Dumpling Room', status: 'want', area: 'GK 2', cuisine: 'Asian', recommendedBy: 'Arjun', addedOn: d(12),
    notes: 'Arjun: go on a weekday, weekends are packed.', dishes: [{ name: 'Chilli oil veg dumplings', tried: false }] });
  place({ name: 'Coastal Curry House', status: 'want', area: 'Defence Colony', cuisine: 'Kerala', recommendedBy: 'Meera (Instagram)', addedOn: d(5),
    dishes: [{ name: 'Appam with veg stew', tried: false }] });
  place({ name: 'Olive Tree Café', status: 'want', area: 'GK 1', cuisine: 'Café', addedOn: d(20) });

  // The restaurant → home loop, in progress.
  pick('Thai Green Curry', { status: 'learning', addedOn: d(30),
    notes: 'Loved it at Bangkok Street (9/10). Proper heat, lots of basil.',
    from: { restaurantId: bangkok.id, rdishId: bangkok.dishes[0].id } });

  // ---- What's in the kitchen ----
  const pantry = (kind, names, status = 'have', ageDays = 30) => {
    for (const name of names.split(',').map((n) => n.trim())) data.pantry.push({ id: uid(), name, kind, status, since: d(ageDays) });
  };
  pantry('staple', 'Rice, Atta, Maida, Besan, Rava, Poha, Toor dal, Moong dal, Whole urad dal, Rajma, Onion, Potato, Garlic, Ginger garlic paste, Peas, '
    + 'Garam masala, Cumin seeds, Turmeric, Red chilli powder, Mustard seeds, Kasuri methi, Kadai masala, Pav bhaji masala, Biryani masala, '
    + 'Ghee, Oil, Butter, Peanuts, Cashews, Cornflour, Pasta, Noodles, Olive oil, Chilli flakes, Soy sauce, Vinegar');
  pantry('staple', 'Kabuli chana, Chole masala', 'low');
  pantry('fresh', 'Spinach', 'have', 4);
  pantry('fresh', 'Tomato, Coriander leaves, Curd, Cabbage, Spring onion', 'have', 2);
  pantry('fresh', 'Green chilli, Carrot', 'have', 5);
  pantry('fresh', 'Cauliflower, Milk', 'have', 1);
  pantry('fresh', 'Capsicum, Lemon, Cheese', 'have', 3);
  pantry('fresh', 'Curry leaves', 'have', 6);
  pantry('fresh', 'Paneer, Bhindi, Methi leaves, Mushroom', 'out', 9);
  pantry('special', 'Thai green curry paste, Parmesan');
  pantry('special', 'Cream', 'low', 10);
  pantry('special', 'Coconut milk, Mozzarella', 'out');

  // ---- The food log (about six weeks) ----
  const ate = (x, days, slot = 'dinner') => data.meals.push({ id: uid(), date: d(days), slot, kind: 'home', dishId: x.id, label: x.name });
  const went = (r, days, kind = 'out') => data.meals.push({ id: uid(), date: d(days), slot: 'dinner', kind, restaurantId: r.id, label: r.name });
  [
    [poha, 3, 'breakfast'], [poha, 10, 'breakfast'], [paratha, 8, 'breakfast'], [chilla, 2, 'breakfast'], [chilla, 6, 'breakfast'],
    [thepla, 4, 'breakfast'], [thepla, 12, 'breakfast'], [upma, 7, 'breakfast'], [bhurji, 13, 'breakfast'],
    [omelette, 18, 'breakfast'], [omelette, 25, 'breakfast'],
    [dal, 2, 'lunch'], [dal, 15, 'lunch'], [rajma, 16, 'lunch'], [rajma, 44, 'lunch'], [aloogobi, 19, 'lunch'], [bhindi, 12, 'lunch'],
    [chole, 21, 'lunch'], [kadhi, 14, 'lunch'], [matar, 17, 'lunch'], [mixveg, 3, 'lunch'], [pulao, 24, 'lunch'], [biryani, 22, 'lunch'],
    [friedrice, 18, 'lunch'], [mac, 23, 'lunch'], [quesadilla, 28, 'lunch'], [arrabbiata, 9, 'lunch'],
    [palak, 9], [palak, 31], [dal, 4], [aloogobi, 6], [khichdi, 27], [pbm, 11], [jeera, 11], [pbm, 35], [kadai, 7], [baingan, 20],
    [pavbhaji, 10], [makhani, 29], [hakka, 5], [chillipaneer, 5], [manchurian, 26], [soup, 16],
  ].forEach(([x, days, slot]) => ate(x, days, slot));
  went(xyz, 18); went(xyz, 52); went(bangkok, 25); went(saffron, 1, 'order'); went(saffron, 13, 'order'); went(saffron, 33, 'order'); went(saffron, 150);

  // Tonight's plan: the example from the vision doc (paneer is out, so it lands on the shopping list).
  data.plan.push({ id: uid(), dishId: palak.id, date: todayISO(), slot: 'dinner', sent: false });
  data.shopExtra.push({ id: uid(), name: 'Bananas' });

  return data;
}
