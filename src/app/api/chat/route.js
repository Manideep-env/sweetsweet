import { NextResponse } from 'next/server';
import { getSellerFromToken } from '@/lib/get-seller-from-token'; // Adjust path if needed

export async function POST(req) {
  // 1. Authenticate the request and get the seller
  const sellerPayload = await getSellerFromToken(req);

  if (!sellerPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Extract the secure sellerId and the messages
  const { sellerId } = sellerPayload;
  const { messages } = await req.json();

  const tools = [
    {
      type: 'function',
      function: {
        name: 'get_order_stats',
        description: 'Fetches e-commerce order statistics, such as the total number of orders today and the count of pending orders.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_product_count',
        description: 'Gets the total number of products in the store.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_category_count',
        description: 'Gets the total number of categories in the store.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_all_categories',
        description: 'Retrieves a list of all product categories from the database, not a count.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_products_by_category',
        description: 'Gets a list of all products belonging to a specific category name.',
        parameters: {
          type: 'object',
          properties: {
            category_name: { type: 'string', description: 'The name of the category to search for, e.g., "Scented Candles"' }
          },
          required: ['category_name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_recent_orders',
        description: 'Retrieves the most recent orders with their details including items and quantities.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of recent orders to retrieve (default: 5)' }
          },
        },
      },
    },
    // REMOVED: 'get_low_stock_products' tool was removed to match the updated mcp route.
    {
      type: 'function',
      function: {
        name: 'get_revenue_stats',
        description: 'Calculates revenue statistics including total revenue, average order value, and total orders for the last 7 days.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_discount_info',
        description: 'Retrieves information about all active discounts including their percentages, validity periods, and associated products/categories.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_popular_products',
        description: 'Gets the most popular products based on sales quantity over a specified period.',
        parameters: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to look back for sales data (default: 30)' }
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_order_status_breakdown',
        description: 'Provides a breakdown of orders by their status (e.g., Pending, Delivered, Cancelled) with counts for each status.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_business_insights',
        // UPDATED: Description now accurately reflects the available insights.
        description: 'Provides comprehensive business intelligence and future insights including revenue trends, top performers, and strategic recommendations.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_recent_orders',
        description: 'Retrieves the most recent orders with their details including items and quantities.',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of recent orders to retrieve (default: 5)' }
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_low_stock_products',
        description: 'Gets products that are running low on stock, useful for inventory management.',
        parameters: {
          type: 'object',
          properties: {
            threshold: { type: 'number', description: 'Stock threshold below which products are considered low stock (default: 10)' }
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_revenue_stats',
        description: 'Calculates revenue statistics including total revenue, average order value, and total orders for the last 7 days.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_discount_info',
        description: 'Retrieves information about all active discounts including their percentages, validity periods, and associated products/categories.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_popular_products',
        description: 'Gets the most popular products based on sales quantity over a specified period.',
        parameters: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to look back for sales data (default: 30)' }
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_order_status_breakdown',
        description: 'Provides a breakdown of orders by their status (pending, completed, cancelled, etc.) with counts for each status.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_business_insights',
        description: 'Provides comprehensive business intelligence and future insights including revenue trends, inventory alerts, top performers, customer retention, and strategic recommendations.',
        parameters: { type: 'object', properties: {} },
      },
    },
  ];

  try {
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: messages,
        tools: tools,
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);

    const responseData = await ollamaResponse.json();
    const responseMessage = responseData.message;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = toolCall.function.arguments;

      const toolResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: toolName,
          params: { ...toolArgs, sellerId: sellerId }, // Use the secure sellerId
          id: 1,
        }),
      });

      if (!toolResponse.ok) throw new Error(`MCP Server error: ${toolResponse.statusText}`);

      const toolResultJson = await toolResponse.json();
      const toolResultContent = toolResultJson.content;

      const finalResponse = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [...messages, responseMessage, { role: 'tool', content: toolResultContent }],
          stream: false,
        }),
      });

      const finalData = await finalResponse.json();
      return NextResponse.json({ response: finalData.message });
    }

    return NextResponse.json({ response: responseMessage });

  } catch (error) {
    console.error('CRITICAL ERROR in chat route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
