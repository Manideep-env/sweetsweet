import { NextResponse } from 'next/server';

export async function POST(req) {
  console.log("\n--- NEW REQUEST RECEIVED ---");
  const { messages } = await req.json();

  // Define the tools your AI can use
  const tools = [
    {
      type: 'function',
      function: {
        name: 'get_dashboard_stats',
        description: 'Fetches key statistics for the admin dashboard, like order and product counts.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_all_categories',
        description: 'Retrieves a list of all product categories from the database.',
        parameters: { type: 'object', properties: {} },
      },
    },
  ];

  try {
    console.log("1. Sending request to Ollama...");
    // 1. Send the user's prompt to your local Ollama server
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: messages,
        tools: tools,
        stream: false, // Get the full response at once
      }),
    });

    if (!ollamaResponse.ok) {
  console.error("Ollama API Error:", ollamaResponse.statusText);
  throw new Error(`Ollama API error: ${ollamaResponse.statusText}`);
    }

    const responseData = await ollamaResponse.json();
    console.log("2. Received response from Ollama:", responseData);
    const responseMessage = responseData.message;

    // FIX: Add a check to handle incorrectly formatted tool calls from some models
    if (responseMessage.content && typeof responseMessage.content === 'string') {
        try {
            const parsedContent = JSON.parse(responseMessage.content);
            if (parsedContent.name && parsedContent.parameters) {
                console.log("Correcting improperly formatted tool call from model...");
                // Manually construct the tool_calls structure
                responseMessage.tool_calls = [{
                    function: {
                        name: parsedContent.name,
                        arguments: parsedContent.parameters,
                    }
                }];
            }
        } catch (e) {
            // It's not a JSON string, so we assume it's a regular message. Do nothing.
        }
    }

    // 2. Check if the model wants to use a tool
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      console.log("3. Ollama requested a tool call.");
      const toolCall = responseMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = toolCall.function.arguments;

      // 3. Call your internal MCP server to execute the tool
  const toolResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: toolName,
          params: toolArgs,
          id: 1, // Dummy ID
        }),
      });

      if (!toolResponse.ok) {
  throw new Error(`MCP Server error: ${toolResponse.statusText}`);
      }
      
      console.log("4. Received response from MCP tool server.");
      const toolResultJson = await toolResponse.json();
      const toolResultContent = toolResultJson.content;

      // 4. Send the tool's result back to Ollama for a final answer
      const finalResponse = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [
            ...messages,
            responseMessage, // Include the model's first response (the tool request)
            {
              role: 'tool',
              content: toolResultContent,
            },
          ],
          stream: false,
        }),
      });

      const finalData = await finalResponse.json();
      console.log("5. Sending final tool-based response to client.");
      return NextResponse.json({ response: finalData.message });
    }

    console.log("3. Ollama answered directly. Sending response to client.");
    // If the model answered directly without a tool
    return NextResponse.json({ response: responseMessage });

  } catch (error) {
    console.error('CRITICAL ERROR in chat route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}