// Popular vegetarian dishes, Indian and international, for building a library quickly.
// Ingredient names use everyday Indian-kitchen names (capsicum, maida, besan…) so they
// line up with what people track in the Kitchen tab.

const MEALS = { B: 'breakfast', L: 'lunch', D: 'dinner' };

/** dish(name, cuisine, meals as "BLD" letters, minutes, "Ingredient|qty; …", tags) */
const dish = (region, name, cuisine, meals, cookTime, ingredients, tags = []) => ({
  region,
  name,
  cuisine,
  meals: [...meals].map((m) => MEALS[m]),
  cookTime,
  ingredients: ingredients.split(';').map((x) => {
    const [n, qty = ''] = x.split('|').map((t) => t.trim());
    return { name: n, qty };
  }),
  tags,
  diet: 'veg',
});
const indian = (...a) => dish('indian', ...a);
const world = (...a) => dish('international', ...a);

export const CATALOG = [
  // ---- Indian ----
  indian('Palak Paneer', 'North Indian', 'LD', 40, 'Spinach|2 bunches; Paneer|200 g; Onion|1; Tomato|2; Ginger garlic paste|1 tbsp; Green chilli|2; Cream|2 tbsp; Garam masala|½ tsp; Cumin seeds|1 tsp', ['high protein']),
  indian('Paneer Butter Masala', 'North Indian', 'LD', 40, 'Paneer|250 g; Tomato|4; Butter|2 tbsp; Cashews|10; Cream|3 tbsp; Kasuri methi|1 tsp; Ginger garlic paste|1 tbsp; Garam masala|½ tsp', ['rich']),
  indian('Matar Paneer', 'North Indian', 'LD', 35, 'Paneer|200 g; Peas|1 cup; Onion|2; Tomato|2; Ginger garlic paste|1 tbsp; Garam masala|½ tsp'),
  indian('Kadai Paneer', 'North Indian', 'LD', 30, 'Paneer|200 g; Capsicum|2; Onion|2; Tomato|2; Kadai masala|2 tsp; Coriander leaves|handful'),
  indian('Paneer Bhurji', 'North Indian', 'BD', 20, 'Paneer|200 g; Onion|1; Tomato|1; Capsicum|½; Green chilli|1; Coriander leaves|handful', ['quick', 'high protein']),
  indian('Malai Kofta', 'North Indian', 'LD', 60, 'Paneer|150 g; Potato|2; Cashews|12; Cream|4 tbsp; Tomato|3; Onion|2; Cornflour|2 tbsp', ['rich', 'party']),
  indian('Dal Tadka', 'North Indian', 'LD', 35, 'Toor dal|1 cup; Onion|1; Tomato|1; Garlic|6 cloves; Cumin seeds|1 tsp; Ghee|1 tbsp; Red chilli powder|½ tsp; Turmeric|¼ tsp', ['comfort']),
  indian('Dal Makhani', 'North Indian', 'D', 90, 'Whole urad dal|¾ cup; Rajma|¼ cup; Butter|2 tbsp; Cream|3 tbsp; Tomato|3; Ginger garlic paste|1 tbsp', ['rich', 'soak overnight']),
  indian('Rajma Chawal', 'North Indian', 'L', 60, 'Rajma|1 cup; Rice|1½ cups; Onion|2; Tomato|3; Ginger garlic paste|1 tbsp; Garam masala|1 tsp', ['comfort', 'soak overnight']),
  indian('Chole', 'North Indian', 'LD', 50, 'Kabuli chana|1 cup; Onion|2; Tomato|2; Chole masala|2 tsp; Ginger garlic paste|1 tbsp', ['soak overnight']),
  indian('Kadhi Pakora', 'North Indian', 'L', 50, 'Besan|1 cup; Curd|2 cups; Onion|2; Curry leaves|1 sprig; Fenugreek seeds|½ tsp; Turmeric|½ tsp', ['comfort']),
  indian('Aloo Gobi', 'North Indian', 'LD', 30, 'Potato|3; Cauliflower|1 small; Onion|1; Tomato|1; Turmeric|½ tsp; Coriander leaves|handful'),
  indian('Aloo Matar', 'North Indian', 'LD', 30, 'Potato|3; Peas|1 cup; Onion|1; Tomato|2; Cumin seeds|1 tsp; Garam masala|½ tsp'),
  indian('Bhindi Masala', 'North Indian', 'LD', 30, 'Bhindi|500 g; Onion|2; Amchur|1 tsp; Turmeric|¼ tsp'),
  indian('Baingan Bharta', 'North Indian', 'LD', 40, 'Brinjal|1 large; Onion|2; Tomato|2; Garlic|5 cloves; Green chilli|2; Coriander leaves|handful', ['smoky']),
  indian('Mix Veg', 'North Indian', 'LD', 30, 'Mixed vegetables|3 cups; Onion|1; Tomato|2; Ginger garlic paste|1 tsp; Garam masala|½ tsp', ['everyday']),
  indian('Aloo Paratha', 'North Indian', 'BL', 40, 'Atta|2 cups; Potato|3; Green chilli|2; Coriander leaves|handful; Ghee|to cook; Curd|to serve'),
  indian('Besan Chilla', 'North Indian', 'B', 20, 'Besan|1 cup; Onion|1; Tomato|1; Green chilli|1; Coriander leaves|handful', ['quick', 'high protein']),
  indian('Moong Dal Khichdi', 'North Indian', 'D', 30, 'Moong dal|½ cup; Rice|½ cup; Ghee|1 tbsp; Cumin seeds|1 tsp; Turmeric|¼ tsp', ['light', 'comfort']),
  indian('Jeera Rice', 'North Indian', 'LD', 20, 'Basmati rice|1 cup; Cumin seeds|1 tsp; Ghee|1 tbsp', ['quick', 'side']),
  indian('Veg Pulao', 'North Indian', 'LD', 30, 'Basmati rice|1½ cups; Mixed vegetables|1½ cups; Onion|1; Whole garam masala|1 tbsp; Ghee|1 tbsp'),
  indian('Veg Biryani', 'Mughlai', 'LD', 60, 'Basmati rice|2 cups; Mixed vegetables|2 cups; Curd|½ cup; Onion|3; Biryani masala|2 tsp; Saffron|pinch; Mint leaves|handful; Ghee|2 tbsp', ['weekend']),
  indian('Pav Bhaji', 'Mumbai street food', 'LD', 45, 'Pav|8; Potato|3; Cauliflower|1 cup; Peas|½ cup; Capsicum|1; Tomato|3; Onion|2; Butter|3 tbsp; Pav bhaji masala|2 tbsp; Lemon|1', ['weekend']),
  indian('Poha', 'Maharashtrian', 'B', 20, 'Poha|2 cups; Onion|1; Peanuts|¼ cup; Curry leaves|1 sprig; Mustard seeds|1 tsp; Turmeric|¼ tsp; Lemon|1; Coriander leaves|handful', ['quick']),
  indian('Methi Thepla', 'Gujarati', 'B', 30, 'Atta|2 cups; Methi leaves|1 bunch; Curd|¼ cup; Turmeric|¼ tsp; Red chilli powder|½ tsp', ['travel-friendly']),
  indian('Dhokla', 'Gujarati', 'B', 30, 'Besan|1½ cups; Curd|½ cup; Eno|1 tsp; Mustard seeds|1 tsp; Curry leaves|1 sprig; Green chilli|2', ['light']),
  indian('Masala Dosa', 'South Indian', 'BD', 40, 'Dosa batter|3 cups; Potato|4; Onion|2; Curry leaves|1 sprig; Mustard seeds|1 tsp; Turmeric|¼ tsp'),
  indian('Idli Sambar', 'South Indian', 'B', 30, 'Idli batter|3 cups; Toor dal|½ cup; Sambar masala|1 tbsp; Tamarind|small ball; Mixed vegetables|1 cup; Coconut|½ cup', ['light']),
  indian('Sambar Rice', 'South Indian', 'LD', 45, 'Toor dal|¾ cup; Rice|1 cup; Sambar masala|2 tbsp; Tamarind|small ball; Drumstick|1; Mixed vegetables|1 cup; Curry leaves|1 sprig'),
  indian('Upma', 'South Indian', 'B', 20, 'Rava|1 cup; Onion|1; Curry leaves|1 sprig; Mustard seeds|1 tsp; Green chilli|2; Peas|¼ cup', ['quick']),

  // ---- International ----
  world('Margherita Pizza', 'Italian', 'D', 30, 'Pizza base|2; Pizza sauce|½ cup; Mozzarella|200 g; Basil|handful; Olive oil|1 tbsp'),
  world('Penne Arrabbiata', 'Italian', 'LD', 25, 'Pasta|250 g; Tomato|4; Garlic|4 cloves; Chilli flakes|1 tsp; Olive oil|2 tbsp; Parmesan|to serve', ['quick']),
  world('Pesto Pasta', 'Italian', 'LD', 20, 'Pasta|250 g; Basil|2 cups; Pine nuts|2 tbsp; Garlic|2 cloves; Parmesan|½ cup; Olive oil|⅓ cup', ['quick']),
  world('Aglio e Olio', 'Italian', 'D', 15, 'Pasta|250 g; Garlic|8 cloves; Chilli flakes|1 tsp; Olive oil|¼ cup; Parsley|handful', ['quick']),
  world('Mushroom Risotto', 'Italian', 'D', 40, 'Arborio rice|1 cup; Mushroom|200 g; Veg stock|4 cups; Onion|1; Parmesan|½ cup; Butter|2 tbsp'),
  world('Veg Lasagne', 'Italian', 'D', 75, 'Lasagne sheets|9; Mixed vegetables|3 cups; Tomato|5; Mozzarella|200 g; Milk|2 cups; Butter|2 tbsp; Maida|2 tbsp', ['weekend']),
  world('Minestrone Soup', 'Italian', 'D', 40, 'Mixed vegetables|3 cups; Pasta|½ cup; Rajma|½ cup; Tomato|3; Garlic|3 cloves; Veg stock|4 cups', ['light']),
  world('Tomato Basil Soup', 'Continental', 'D', 30, 'Tomato|6; Onion|1; Garlic|3 cloves; Basil|handful; Cream|2 tbsp; Butter|1 tbsp', ['light']),
  world('Mac and Cheese', 'American', 'LD', 30, 'Pasta|250 g; Cheese|200 g; Milk|2 cups; Butter|2 tbsp; Maida|2 tbsp', ['comfort']),
  world('Greek Salad', 'Greek', 'L', 10, 'Cucumber|1; Tomato|2; Onion|1; Capsicum|1; Olives|¼ cup; Feta|100 g; Olive oil|2 tbsp', ['light', 'quick']),
  world('Falafel & Hummus', 'Middle Eastern', 'LD', 45, 'Kabuli chana|2 cups; Tahini|3 tbsp; Garlic|3 cloves; Parsley|handful; Lemon|1; Pita bread|4', ['soak overnight', 'high protein']),
  world('Veg Burrito Bowl', 'Mexican', 'L', 30, 'Rice|1 cup; Rajma|1 cup; Corn|½ cup; Capsicum|1; Tomato|2; Onion|1; Lemon|1; Cheese|to serve'),
  world('Cheese Quesadilla', 'Mexican', 'LD', 15, 'Tortillas|4; Cheese|150 g; Capsicum|1; Corn|½ cup; Onion|1', ['quick']),
  world('Thai Green Curry', 'Thai', 'D', 35, 'Coconut milk|400 ml; Thai green curry paste|3 tbsp; Mixed vegetables|2 cups; Tofu|200 g; Basil|handful'),
  world('Veg Pad Thai', 'Thai', 'D', 25, 'Rice noodles|200 g; Tofu|150 g; Peanuts|¼ cup; Tamarind|1 tbsp paste; Bean sprouts|1 cup; Soy sauce|2 tbsp; Lemon|1'),
  world('Veg Katsu Curry', 'Japanese', 'D', 45, 'Mixed vegetables|2 cups; Bread crumbs|1 cup; Maida|½ cup; Rice|1½ cups; Japanese curry cubes|4; Onion|1; Carrot|1; Potato|1'),
  world('Tofu Stir-fry', 'Chinese', 'D', 20, 'Tofu|200 g; Broccoli|1 head; Capsicum|1; Garlic|3 cloves; Soy sauce|2 tbsp; Cornflour|1 tbsp; Rice|1 cup', ['quick', 'high protein']),
  world('Veg Hakka Noodles', 'Indo-Chinese', 'D', 25, 'Noodles|200 g; Cabbage|1 cup; Carrot|1; Capsicum|1; Spring onion|3; Soy sauce|2 tbsp; Vinegar|1 tsp'),
  world('Veg Fried Rice', 'Indo-Chinese', 'LD', 20, 'Rice|2 cups cooked; Carrot|1; Beans|6; Spring onion|3; Soy sauce|2 tbsp; Garlic|4 cloves', ['quick', 'leftovers']),
  world('Chilli Paneer', 'Indo-Chinese', 'D', 30, 'Paneer|250 g; Capsicum|2; Onion|1; Soy sauce|2 tbsp; Cornflour|3 tbsp; Green chilli|3; Spring onion|2'),
  world('Veg Manchurian', 'Indo-Chinese', 'D', 40, 'Cabbage|2 cups; Carrot|1; Cornflour|4 tbsp; Maida|2 tbsp; Soy sauce|2 tbsp; Garlic|6 cloves; Spring onion|2'),
];
