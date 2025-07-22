// ✅ Import models
import { Admin } from './Admin.js';
import { Category } from './Category.js';
import { Product } from './Product.js';
import { Order } from './Order.js';
import { OrderItem } from './OrderItem.js';
import { Discount } from './Discount.js';
import { OrderDiscount } from './OrderDiscount.js';


// ✅ Define associations

// Category → Product
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' }); // for category.getProducts()
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' }); // for product.getCategory()

// Order → OrderItems
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Product → OrderItems
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// Discount → Product / Category (Many Discounts can belong to a Product or Category)
Discount.belongsTo(Product, { foreignKey: 'productId' });
Discount.belongsTo(Category, { foreignKey: 'categoryId' });

// Product / Category → Discounts
Product.hasMany(Discount, { foreignKey: 'productId', as: 'Discounts' });
Category.hasMany(Discount, { foreignKey: 'categoryId', as: 'Discounts' });


// M:N association
Order.belongsToMany(Discount, {
  through: OrderDiscount,
  foreignKey: 'orderId',
  otherKey: 'discountId',
});
Discount.belongsToMany(Order, {
  through: OrderDiscount,
  foreignKey: 'discountId',
  otherKey: 'orderId',
});



// ✅ Export all models and sequelize
export {
  Admin,
  Category,
  Product,
  Order,
  OrderDiscount,
  OrderItem,
  Discount,
};
