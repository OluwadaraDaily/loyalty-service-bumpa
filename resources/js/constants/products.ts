export interface Product {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
}

export const RANDOM_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Premium Coffee Beans',
    category: 'Food & Beverage',
    amount: 2500.00,
    currency: 'NGN',
    description: 'High-quality arabica coffee beans from Ethiopia'
  },
  {
    id: 'prod_2',
    name: 'Wireless Earbuds',
    category: 'Electronics',
    amount: 15000.00,
    currency: 'NGN',
    description: 'True wireless earbuds with noise cancellation'
  },
  {
    id: 'prod_3',
    name: 'Leather Wallet',
    category: 'Fashion',
    amount: 5500.00,
    currency: 'NGN',
    description: 'Genuine leather bifold wallet with RFID protection'
  },
  {
    id: 'prod_4',
    name: 'Fitness Tracker',
    category: 'Health & Fitness',
    amount: 12000.00,
    currency: 'NGN',
    description: 'Smart fitness tracker with heart rate monitoring'
  },
  {
    id: 'prod_5',
    name: 'Organic Face Cream',
    category: 'Beauty & Personal Care',
    amount: 3200.00,
    currency: 'NGN',
    description: 'Natural anti-aging face cream with vitamin E'
  },
  {
    id: 'prod_6',
    name: 'Bluetooth Speaker',
    category: 'Electronics',
    amount: 8500.00,
    currency: 'NGN',
    description: 'Portable waterproof Bluetooth speaker with 10hr battery'
  },
  {
    id: 'prod_7',
    name: 'Reading Glasses',
    category: 'Health & Wellness',
    amount: 4200.00,
    currency: 'NGN',
    description: 'Blue light blocking reading glasses +2.0'
  },
  {
    id: 'prod_8',
    name: 'Running Shoes',
    category: 'Sports & Outdoors',
    amount: 18500.00,
    currency: 'NGN',
    description: 'Professional running shoes with air cushioning'
  },
  {
    id: 'prod_9',
    name: 'Smartphone Case',
    category: 'Electronics',
    amount: 1800.00,
    currency: 'NGN',
    description: 'Shockproof silicone case with screen protector'
  },
  {
    id: 'prod_10',
    name: 'Green Tea Set',
    category: 'Food & Beverage',
    amount: 6500.00,
    currency: 'NGN',
    description: 'Traditional Japanese green tea gift set with ceramic cups'
  },
  {
    id: 'prod_11',
    name: 'Backpack',
    category: 'Fashion',
    amount: 9200.00,
    currency: 'NGN',
    description: 'Water-resistant laptop backpack with USB charging port'
  },
  {
    id: 'prod_12',
    name: 'Vitamin Supplements',
    category: 'Health & Wellness',
    amount: 4800.00,
    currency: 'NGN',
    description: 'Multi-vitamin supplements for daily health support'
  },
  {
    id: 'prod_13',
    name: 'Desk Lamp',
    category: 'Home & Garden',
    amount: 7300.00,
    currency: 'NGN',
    description: 'LED desk lamp with adjustable brightness and USB charging'
  },
  {
    id: 'prod_14',
    name: 'Protein Powder',
    category: 'Health & Fitness',
    amount: 11500.00,
    currency: 'NGN',
    description: 'Whey protein isolate powder for muscle building - Vanilla'
  },
  {
    id: 'prod_15',
    name: 'Ceramic Mug Set',
    category: 'Home & Garden',
    amount: 3800.00,
    currency: 'NGN',
    description: 'Set of 4 handcrafted ceramic mugs with wooden handles'
  },
  {
    id: 'prod_16',
    name: 'Yoga Mat',
    category: 'Sports & Outdoors',
    amount: 5900.00,
    currency: 'NGN',
    description: 'Non-slip eco-friendly yoga mat with carrying strap'
  },
  {
    id: 'prod_17',
    name: 'Scented Candles',
    category: 'Home & Garden',
    amount: 2900.00,
    currency: 'NGN',
    description: 'Set of 3 aromatherapy candles - Lavender, Vanilla, Eucalyptus'
  },
  {
    id: 'prod_18',
    name: 'Phone Charger',
    category: 'Electronics',
    amount: 3500.00,
    currency: 'NGN',
    description: 'Fast charging USB-C cable with wall adapter'
  },
  {
    id: 'prod_19',
    name: 'Sunglasses',
    category: 'Fashion',
    amount: 8200.00,
    currency: 'NGN',
    description: 'UV protection polarized sunglasses with designer frames'
  },
  {
    id: 'prod_20',
    name: 'Notebook Set',
    category: 'Office & Stationery',
    amount: 1500.00,
    currency: 'NGN',
    description: 'Pack of 3 lined notebooks with hardcover and elastic band'
  }
];

export const getRandomProduct = (): Product => {
  const randomIndex = Math.floor(Math.random() * RANDOM_PRODUCTS.length);
  return RANDOM_PRODUCTS[randomIndex];
};