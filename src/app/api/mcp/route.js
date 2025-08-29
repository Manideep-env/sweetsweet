import { NextResponse } from 'next/server';
import { Order, Product, Category, OrderItem, Discount } from '@/models';
import { Op, fn, col } from 'sequelize';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export async function POST(req) {
  const { jsonrpc, method, params, id } = await req.json();
  
  // Handle params as either object or JSON string
  let parsedParams = params;
  if (typeof params === 'string') {
    try {
      parsedParams = JSON.parse(params);
    } catch (error) {
      console.error('Error parsing params:', error);
      parsedParams = {};
    }
  }
  
  const { sellerId } = parsedParams;

  if (!sellerId) {
    return NextResponse.json({ error: 'Seller ID not provided to tool.' }, { status: 400 });
  }
  
  try {
    let result;

    switch (method) {
      case 'get_order_stats':
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        const totalOrdersToday = await Order.count({
          where: { sellerId, createdAt: { [Op.between]: [todayStart, todayEnd] } },
        });
        const pendingOrders = await Order.count({
          where: { sellerId, status: 'pending' },
        });
        result = { totalOrdersToday, pendingOrders };
        break;

      case 'get_product_count':
        const totalProducts = await Product.count({ where: { sellerId } });
        result = { totalProducts };
        break;

      case 'get_category_count':
        const totalCategories = await Category.count({ where: { sellerId } });
        result = { totalCategories };
        break;

      case 'list_all_categories':
        const categories = await Category.findAll({
          where: { sellerId },
          attributes: ['id', 'name'],
        });
        result = categories.length > 0 ? categories : [];
        break;
        

      case 'get_products_by_category':
        const { category_name } = parsedParams;
        if (!category_name || typeof category_name !== 'string') {
          result = { error: 'Category name is required and must be a string' };
          break;
        }
        const products = await Product.findAll({
            where: { sellerId },
            attributes: ['name'],
            include: [{
                model: Category,
                as: 'category',
                where: { name: category_name, sellerId },
                attributes: [] 
            }]
        });
        result = products.length > 0 ? products.map(p => p.name) : [];
        break;

      case 'get_recent_orders':
        const { limit = 5 } = parsedParams;
        const orderLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 50); // Limit between 1 and 50
        const recentOrders = await Order.findAll({
          where: { sellerId },
          attributes: ['id', 'status', 'totalAmount', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: orderLimit,
          include: [{
            model: OrderItem,
            as: 'items',
            attributes: ['quantity'],
            include: [{
              model: Product,
              attributes: ['name']
            }]
          }]
        });
        result = recentOrders.length > 0 ? recentOrders.map(order => ({
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          items: order.items.map(item => ({
            productName: item.Product.name,
            quantity: item.quantity
          }))
        })) : [];
        break;

      case 'get_low_stock_products':
        const { threshold = 10 } = parsedParams;
        const stockThreshold = Math.max(parseInt(threshold) || 10, 0); // Ensure non-negative
        const lowStockProducts = await Product.findAll({
          where: { 
            sellerId,
            stock: { [Op.lte]: stockThreshold }
          },
          attributes: ['id', 'name', 'stock', 'price'],
          order: [['stock', 'ASC']]
        });
        result = lowStockProducts.length > 0 ? lowStockProducts : [];
        break;

      case 'get_revenue_stats':
        const sevenDaysAgo = subDays(new Date(), 7);
        const revenueStats = await Order.findAll({
          where: { 
            sellerId,
            status: 'completed',
            createdAt: { [Op.gte]: sevenDaysAgo }
          },
          attributes: ['totalAmount', 'createdAt']
        });
        
        const totalRevenue = revenueStats.reduce((sum, order) => {
          const amount = parseFloat(order.totalAmount) || 0;
          return sum + amount;
        }, 0);
        const averageOrderValue = revenueStats.length > 0 ? totalRevenue / revenueStats.length : 0;
        
        result = {
          totalRevenue: totalRevenue.toFixed(2),
          averageOrderValue: averageOrderValue.toFixed(2),
          totalOrders: revenueStats.length,
          period: 'Last 7 days'
        };
        break;

      case 'get_discount_info':
        const activeDiscounts = await Discount.findAll({
          where: { sellerId },
          attributes: ['id', 'name', 'discountPercentage', 'validFrom', 'validTo'],
          include: [
            {
              model: Product,
              attributes: ['name'],
              required: false
            },
            {
              model: Category,
              attributes: ['name'],
              required: false
            }
          ]
        });
        
        result = activeDiscounts.length > 0 ? activeDiscounts.map(discount => ({
          id: discount.id,
          name: discount.name,
          discountPercentage: discount.discountPercentage,
          validFrom: discount.validFrom,
          validTo: discount.validTo,
          productName: discount.Product?.name || null,
          categoryName: discount.Category?.name || null
        })) : [];
        break;

      case 'get_popular_products':
        const { days = 30 } = parsedParams;
        const daysLimit = Math.min(Math.max(parseInt(days) || 30, 1), 365); // Limit between 1 and 365 days
        const dateLimit = subDays(new Date(), daysLimit);
        
        const popularProducts = await OrderItem.findAll({
          attributes: [
            'productId',
            [fn('SUM', col('quantity')), 'totalSold']
          ],
          include: [
            {
              model: Product,
              where: { sellerId },
              attributes: ['name', 'price']
            },
            {
              model: Order,
              where: { 
                createdAt: { [Op.gte]: dateLimit },
                status: 'completed'
              },
              attributes: []
            }
          ],
          group: ['productId', 'Product.id', 'Product.name', 'Product.price'],
          order: [[fn('SUM', col('quantity')), 'DESC']],
          limit: 10
        });
        
        result = popularProducts.length > 0 ? popularProducts.map(item => ({
          productName: item.Product.name,
          totalSold: parseInt(item.dataValues.totalSold) || 0,
          price: item.Product.price
        })) : [];
        break;

      case 'get_order_status_breakdown':
        const orderStatuses = await Order.findAll({
          where: { sellerId },
          attributes: [
            'status',
            [fn('COUNT', col('id')), 'count']
          ],
          group: ['status']
        });
        
        result = orderStatuses.length > 0 ? orderStatuses.map(status => ({
          status: status.status,
          count: parseInt(status.dataValues.count)
        })) : [];
        break;

                    case 'get_business_insights':
         try {
           const insights = [];
           
           // 1. Basic Revenue Analysis
           const sevenDaysAgo = subDays(new Date(), 7);
           const recentOrders = await Order.count({
             where: { 
               sellerId,
               status: 'completed',
               createdAt: { [Op.gte]: sevenDaysAgo }
             }
           });
           
           const totalRevenue = await Order.sum('totalAmount', {
             where: { 
               sellerId,
               status: 'completed',
               createdAt: { [Op.gte]: sevenDaysAgo }
             }
           });
           
           insights.push({
             type: 'revenue_summary',
             title: 'Recent Revenue Summary',
             value: '$' + (totalRevenue || 0).toFixed(2),
             description: `${recentOrders} orders completed in the last 7 days`,
             recommendation: recentOrders > 0 ? 'Good sales activity! Keep up the momentum.' : 'Consider promotional campaigns to boost sales'
           });
           
           // 2. Inventory Insights
           const lowStockProducts = await Product.count({
             where: { 
               sellerId,
               stock: { [Op.lte]: 10 }
             }
           });
           
           if (lowStockProducts > 0) {
             insights.push({
               type: 'inventory_alert',
               title: 'Low Stock Alert',
               value: lowStockProducts + ' products',
               description: `${lowStockProducts} products are running low on stock`,
               recommendation: 'Restock these items soon to avoid stockouts'
             });
           }
           
           // 3. Product Count
           const totalProducts = await Product.count({
             where: { sellerId }
           });
           
           insights.push({
             type: 'product_summary',
             title: 'Product Catalog',
             value: totalProducts + ' products',
             description: `Total products in your catalog`,
             recommendation: totalProducts < 10 ? 'Consider adding more products to increase variety' : 'Good product variety!'
           });
           
           // 4. Category Count
           const totalCategories = await Category.count({
             where: { sellerId }
           });
           
           insights.push({
             type: 'category_summary',
             title: 'Category Organization',
             value: totalCategories + ' categories',
             description: `Products organized into ${totalCategories} categories`,
             recommendation: totalCategories < 3 ? 'Consider organizing products into more categories' : 'Well-organized product structure!'
           });
           
           // 5. Pending Orders
           const pendingOrders = await Order.count({
             where: { 
               sellerId,
               status: 'pending'
             }
           });
           
           if (pendingOrders > 0) {
             insights.push({
               type: 'order_alert',
               title: 'Pending Orders',
               value: pendingOrders + ' orders',
               description: `${pendingOrders} orders awaiting processing`,
               recommendation: 'Process pending orders promptly to maintain customer satisfaction'
             });
           }
           
           result = {
             insights: insights,
             summary: {
               totalInsights: insights.length,
               criticalAlerts: insights.filter(i => i.type === 'inventory_alert' || i.type === 'order_alert').length,
               positiveTrends: insights.filter(i => i.type === 'revenue_summary' && recentOrders > 0).length
             },
             generatedAt: new Date().toISOString()
           };
         } catch (insightError) {
           console.error('Error in business insights:', insightError);
           result = {
             insights: [{
               type: 'error',
               title: 'Analysis Error',
               value: 'Unable to generate insights',
               description: 'There was an error processing the business data',
               recommendation: 'Please try again later or contact support'
             }],
             summary: {
               totalInsights: 1,
               criticalAlerts: 0,
               positiveTrends: 0
             },
             generatedAt: new Date().toISOString()
           };
         }
         break;

      default:
        return NextResponse.json({ error: { message: `Method '${method}' not found.` } }, { status: 404 });
    }
    
    return NextResponse.json({
        type: 'tool_result',
        tool_use_id: id,
        content: JSON.stringify(result),
    });

  } catch (error) {
    console.error(`CRITICAL ERROR in MCP Server while executing '${method}':`, error);
    return NextResponse.json({ error: { message: 'Internal tool execution error' } }, { status: 500 });
  }
}