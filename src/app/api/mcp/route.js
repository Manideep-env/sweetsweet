import { NextResponse } from 'next/server';
// Make sure your Sequelize models are accessible here
import { Order, Product, Category } from '@/models'; // Adjust path to your models
import { Op } from 'sequelize';
import { startOfDay, endOfDay } from 'date-fns';

export async function POST(req) {
  const { jsonrpc, method, params, id } = await req.json();

  if (jsonrpc !== '2.0' || !method) {
    return NextResponse.json({ error: 'Invalid MCP request' }, { status: 400 });
  }

  try {
    let result;

    // A router for your defined "tools"
    switch (method) {
      case 'get_dashboard_stats':
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        
        const totalOrdersToday = await Order.count({
          where: { createdAt: { [Op.between]: [todayStart, todayEnd] } },
        });

        const pendingOrders = await Order.count({
          where: { status: 'pending' },
        });
        
        const totalProducts = await Product.count();
        const totalCategories = await Category.count();

        result = {
          totalOrdersToday,
          pendingOrders,
          totalProducts,
          totalCategories,
        };
        break;

      // ✅ ADD THIS NEW CASE
      case 'list_all_categories':
        const categories = await Category.findAll({
          attributes: ['id', 'name'],
        });
        result = categories;
        break;

      default:
        return NextResponse.json({ error: { message: `Method '${method}' not found.` } }, { status: 404 });
    }
    
    // This return format still works perfectly with the new Ollama client code.
    return NextResponse.json({
        // The 'type' and 'tool_use_id' are ignored by the new client, which is fine.
        type: 'tool_result', 
        tool_use_id: id,
        // The client specifically looks for this 'content' property.
        content: JSON.stringify(result),
    });

  } catch (error) {
    console.error(`Error executing method '${method}':`, error);
    return NextResponse.json({ error: { message: 'Internal tool execution error' } }, { status: 500 });
  }
}