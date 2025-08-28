import { NextResponse } from 'next/server';
import { Order, Product, Category } from '@/models';
import { Op } from 'sequelize';
import { startOfDay, endOfDay } from 'date-fns';

export async function POST(req) {
  const { jsonrpc, method, params, id } = await req.json();
  const { sellerId } = params;

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
        result = categories;
        break;

      case 'get_products_by_category':
        const { category_name } = params;
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
        result = products.map(p => p.name);
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