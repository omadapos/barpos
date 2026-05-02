const seedCategories = [
  { name: 'Licores', color: '#7c3aed', icon: '🥃', is_bottle_category: 1 },
  { name: 'Cervezas', color: '#d97706', icon: '🍺', is_bottle_category: 0 },
  { name: 'Cócteles', color: '#0891b2', icon: '🍹', is_bottle_category: 0 },
  { name: 'Refrescos', color: '#16a34a', icon: '🥤', is_bottle_category: 0 },
  { name: 'Agua / Sin alcohol', color: '#64748b', icon: '💧', is_bottle_category: 0 },
  { name: 'Snacks', color: '#dc2626', icon: '🍟', is_bottle_category: 0 },
];

const seedLicores = [
  'Ron Barceló',
  'Ron Brugal',
  "Whisky Jack Daniel's",
  'Whisky Johnnie Walker Rojo',
  'Vodka Smirnoff',
  'Tequila José Cuervo',
  'Gin Beefeater',
  'Hennessy VS',
];

const defaultMeasures = [
  { measure_name: 'Trago', price: 150 },
  { measure_name: 'Cuarto', price: 550 },
  { measure_name: 'Media', price: 1000 },
  { measure_name: 'Litro', price: 1800 },
];

const seedProducts = [
  { category: 'Cervezas', name: 'Presidente', price: 120 },
  { category: 'Cervezas', name: 'Heineken', price: 150 },
  { category: 'Cervezas', name: 'Corona', price: 150 },
  { category: 'Cócteles', name: 'Mojito', price: 250 },
  { category: 'Cócteles', name: 'Piña Colada', price: 280 },
  { category: 'Cócteles', name: 'Margarita', price: 250 },
  { category: 'Refrescos', name: 'Coca-Cola', price: 80 },
  { category: 'Refrescos', name: 'Jugo de Naranja', price: 100 },
  { category: 'Agua / Sin alcohol', name: 'Agua Natural', price: 60 },
  { category: 'Snacks', name: 'Papas Fritas', price: 150 },
  { category: 'Snacks', name: 'Nachos con Queso', price: 200 },
];

const seedTables = [
  { name: 'Mesa 1', capacity: 4 },
  { name: 'Mesa 2', capacity: 4 },
  { name: 'Mesa 3', capacity: 6 },
  { name: 'Mesa 4', capacity: 4 },
  { name: 'Barra', capacity: 8 },
];

module.exports = {
  seedCategories,
  seedLicores,
  defaultMeasures,
  seedProducts,
  seedTables,
};
