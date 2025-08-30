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
          where: { sellerId, status: 'Pending' }, // CORRECTED: Changed 'pending' to 'Pending'
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
          attributes: ['id', 'status', 'totalPrice', 'createdAt'],
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
          totalAmount: order.totalPrice,
          createdAt: order.createdAt,
          items: order.items.map(item => ({
            productName: item.Product.name,
            quantity: item.quantity
          }))
        })) : [];
        break;

      // REMOVED: get_low_stock_products case was removed as 'stock' field does not exist on Product model.

      case 'get_revenue_stats':
        const sevenDaysAgoRev = subDays(new Date(), 7);
        const revenueStats = await Order.findAll({
          where: {
            sellerId,
            status: 'Delivered', // CORRECTED: Changed 'completed' to 'Delivered'
            createdAt: { [Op.gte]: sevenDaysAgoRev }
          },
          attributes: ['totalPrice', 'createdAt']
        });

        const totalRevenue = revenueStats.reduce((sum, order) => {
          const amount = parseFloat(order.totalPrice) || 0;
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
          // CORRECTED: Aligned attributes with Discount model
          attributes: ['id', 'percentage', 'startDate', 'endDate'],
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

        // CORRECTED: Mapped result to correct field names
        result = activeDiscounts.length > 0 ? activeDiscounts.map(discount => ({
          id: discount.id,
          percentage: discount.percentage,
          startDate: discount.startDate,
          endDate: discount.endDate,
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
              // CORRECTED: Using existing price fields
              attributes: ['name', 'pricePerUnit', 'pricePerKg']
            },
            {
              model: Order,
              where: {
                createdAt: { [Op.gte]: dateLimit },
                status: 'Delivered' // CORRECTED: Changed 'completed' to 'Delivered'
              },
              attributes: []
            }
          ],
          group: ['productId', 'Product.id', 'Product.name', 'Product.pricePerUnit', 'Product.pricePerKg'],
          order: [[fn('SUM', col('quantity')), 'DESC']],
          limit: 10
        });

        result = popularProducts.length > 0 ? popularProducts.map(item => ({
          productName: item.Product.name,
          totalSold: parseInt(item.dataValues.totalSold) || 0,
          // CORRECTED: Prioritizing pricePerUnit, falling back to pricePerKg
          price: item.Product.pricePerUnit || item.Product.pricePerKg
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
              status: 'Delivered', // CORRECTED: Changed 'completed' to 'Delivered'
              createdAt: { [Op.gte]: sevenDaysAgo }
            }
          });

          const totalRevenueInsight = await Order.sum('totalPrice', {
            where: {
              sellerId,
              status: 'Delivered', // CORRECTED: Changed 'completed' to 'Delivered'
              createdAt: { [Op.gte]: sevenDaysAgo }
            }
          });

          insights.push({
            type: 'revenue_summary',
            title: 'Recent Revenue Summary',
            value: '$' + (totalRevenueInsight || 0).toFixed(2),
            description: `${recentOrders} orders delivered in the last 7 days`,
            recommendation: recentOrders > 0 ? 'Good sales activity! Keep up the momentum.' : 'Consider promotional campaigns to boost sales'
          });

          // REMOVED: Inventory insights section removed due to missing 'stock' field.

          // 3. Product Count
          const totalProductsInsight = await Product.count({
            where: { sellerId }
          });

          insights.push({
            type: 'product_summary',
            title: 'Product Catalog',
            value: totalProductsInsight + ' products',
            description: `Total products in your catalog`,
            recommendation: totalProductsInsight < 10 ? 'Consider adding more products to increase variety' : 'Good product variety!'
          });

          // 4. Category Count
          const totalCategoriesInsight = await Category.count({
            where: { sellerId }
          });

          insights.push({
            type: 'category_summary',
            title: 'Category Organization',
            value: totalCategoriesInsight + ' categories',
            description: `Products organized into ${totalCategoriesInsight} categories`,
            recommendation: totalCategoriesInsight < 3 ? 'Consider organizing products into more categories' : 'Well-organized product structure!'
          });

          // 5. Pending Orders
          const pendingOrdersInsight = await Order.count({
            where: {
              sellerId,
              status: 'Pending' // CORRECTED: Changed 'pending' to 'Pending'
            }
          });

          if (pendingOrdersInsight > 0) {
            insights.push({
              type: 'order_alert',
              title: 'Pending Orders',
              value: pendingOrdersInsight + ' orders',
              description: `${pendingOrdersInsight} orders awaiting processing`,
              recommendation: 'Process pending orders promptly to maintain customer satisfaction'
            });
          }

          result = {
            insights: insights,
            summary: {
              totalInsights: insights.length,
              criticalAlerts: insights.filter(i => i.type === 'order_alert').length,
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

    console.log(`MCP method executed: ${method}`, { result });


    return NextResponse.json({
      role: "assistant",
      type: "tool_result",
      tool_use_id: id,
      content: JSON.stringify(result),
    });

  } catch (error) {
    console.error(`CRITICAL ERROR in MCP Server while executing '${method}':`, error);
    return NextResponse.json({ error: { message: 'Internal tool execution error' } }, { status: 500 });
  }
}
