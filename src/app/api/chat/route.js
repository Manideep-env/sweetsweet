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
          messages: [ ...messages, responseMessage, { role: 'tool', content: toolResultContent } ],
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