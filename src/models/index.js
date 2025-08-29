// src/models/index.js
import { Seller } from './Seller.js';
import { Category } from './Category.js';
import { Product } from './Product.js';
import { Order } from './Order.js';
import { OrderItem } from './OrderItem.js';
import { Discount } from './Discount.js';
import { OrderDiscount } from './OrderDiscount.js';
import { User } from './User.js'; // <-- Import User
import { Address } from './Address.js'; // <-- Import Address
import { StoreCustomization } from './StoreCustomization.js';


// --- User and Address Associations ---
User.hasMany(Address, { foreignKey: 'userId' });
Address.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

// An order is shipped to a specific address
Order.belongsTo(Address, { foreignKey: 'shippingAddressId' });
Address.hasMany(Order, { as: 'shippedOrders', foreignKey: 'shippingAddressId' });


// --- Seller Associations ---
Seller.hasMany(Product, { foreignKey: 'sellerId' });
Product.belongsTo(Seller, { foreignKey: 'sellerId' });

Seller.hasMany(Category, { foreignKey: 'sellerId' });
Category.belongsTo(Seller, { foreignKey: 'sellerId' });

Seller.hasMany(Order, { foreignKey: 'sellerId' });
Order.belongsTo(Seller, { foreignKey: 'sellerId' });

Seller.hasMany(Discount, { foreignKey: 'sellerId' });
Discount.belongsTo(Seller, { foreignKey: 'sellerId' });

// --- Other Existing Associations ---
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

Discount.belongsTo(Product, { foreignKey: 'productId' });
Discount.belongsTo(Category, { foreignKey: 'categoryId' });

Product.hasMany(Discount, { foreignKey: 'productId', as: 'Discounts' });
Category.hasMany(Discount, { foreignKey: 'categoryId', as: 'Discounts' });

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

Seller.hasOne(StoreCustomization, { foreignKey: 'sellerId' });
StoreCustomization.belongsTo(Seller, { foreignKey: 'sellerId' });

// Export all models
export {
  Seller,
  StoreCustomization,
  Category,
  Product,
  Order,
  OrderDiscount,
  OrderItem,
  Discount,
  User,     // <-- Export User
  Address,  // <-- Export Address
};
