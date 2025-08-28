import { NextResponse } from 'next/server';

// No more Anthropic SDK needed!

export async function POST(req) {
  const { messages } = await req.json();

  // Define the tool definitions in a format Ollama with Llama 3 can understand
  const tools = [
    {
      type: 'function',
      function: {
        name: 'get_dashboard_stats',
        description: 'Fetches key statistics for the admin dashboard.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_all_categories',
        description: 'Retrieves a list of all product categories.',
        parameters: { type: 'object', properties: {} },
      },
    },
  ];

  try {
    // 1. Send the user's prompt to your local Ollama server
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        messages: messages,
        tools: tools,
        stream: false, // For simplicity, we'll get the full response at once
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);
    }

    const responseData = await ollamaResponse.json();
    const responseMessage = responseData.message;

    // 2. Check if the model wants to use a tool
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0]; // Handle one tool call for simplicity
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      // This is the MCP Client making a request to the MCP Server (your /api/mcp route)
      const toolResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: toolName,
          params: toolArgs,
          id: 1, // A dummy ID is fine here
        }),
      });

      const toolResultJson = await toolResponse.json();
      const toolResultContent = toolResultJson.content;

      // 3. Send the tool's result back to Ollama for a final answer
      const finalResponse = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3',
          messages: [
            ...messages,
            responseMessage, // Include the model's tool request
            {
              role: 'tool',
              content: toolResultContent,
            },
          ],
          stream: false,
        }),
      });

      const finalData = await finalResponse.json();
      return NextResponse.json({ response: finalData.message });
    }

    // If the model answered directly
    return NextResponse.json({ response: responseMessage });

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}