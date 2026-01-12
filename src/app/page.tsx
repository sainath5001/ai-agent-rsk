"use client";

import { ConnectButton } from "@/components/ConnectButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Loader2, Send, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useConfig } from "wagmi";
import { isValidWalletAddress } from "@/lib/utils";
import { BLOCK_EXPLORER_URL } from "@/lib/contants";
import { executePluginFunction } from "@/plugins/client-executor";

export default function Home() {
  const [messages, setMessages] = useState<
    { role: string; content: React.ReactNode }[]
  >([
    {
      role: "agent",
      content:
        "Hello! I can help you interact with the Rootstock testnet. What would you like to do?",
    },
  ]);

  const { address, isConnected } = useAppKitAccount();
  const config = useConfig();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setInput("");
    setIsLoading(true);

    const processingMessage = {
      role: "bot" as const,
      content: "Processing your request...",
    };

    const newMessages = [...messages, userMessage, processingMessage];

    if (!isConnected) {
      setMessages([
        ...newMessages.slice(0, -1),
        {
          role: "bot",
          content: "Please connect your wallet to perform this action.",
        },
      ]);
      setIsLoading(false);
      return;
    }

    setMessages(newMessages);

    try {
      // Extract text-only message history for API
      const messageHistory = messages.map((msg) => ({
        role: msg.role,
        content:
          typeof msg.content === "string"
            ? msg.content
            : "Content not available as string",
      }));

      // Process all requests through the AI endpoint
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          question: input,
          address,
          messageHistory: messageHistory,
        }),
      });

      const data = await response.json();

      console.log("AI response:", data);

      if (data?.functionCall) {
        const functionData = data.functionCall;

        try {
          // Execute plugin function dynamically
          const pluginContext = {
            address,
            isConnected,
            config,
          };

          // Validate address for transfer function
          if (functionData.name === "transfer" && !isValidWalletAddress(functionData?.arguments?.address)) {
            throw new Error("Invalid wallet address");
          }

          const result = await executePluginFunction(
            functionData.name,
            functionData.arguments,
            pluginContext
          );

          if (result.success) {
            // Handle display content if provided, otherwise format the data
            let displayContent: React.ReactNode;

            if (result.displayContent) {
              displayContent = result.displayContent;
            } else if (result.data) {
              // Format common result types
              const data = result.data as Record<string, unknown>;

              if (data.transactionHash && typeof data.transactionHash === "string") {
                const txHash = data.transactionHash;
                const explorerUrl = typeof data.explorerUrl === "string" ? data.explorerUrl : `${BLOCK_EXPLORER_URL}${txHash}`;
                displayContent = (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    Transaction: {`${txHash.slice(0, 6)}...${txHash.slice(-4)}`}
                    <ExternalLink size={16} />
                  </a>
                );
              } else if (data.displayValue !== undefined && typeof data.symbol === "string") {
                const displayValue = typeof data.displayValue === "number" ? data.displayValue : String(data.displayValue);
                displayContent = (
                  <div className="w-full">
                    <div className="mt-2">
                      Balance: {displayValue} {data.symbol}
                    </div>
                  </div>
                );
              } else {
                displayContent = (
                  <div className="markdown-content space-y-4">
                    <ReactMarkdown>
                      {JSON.stringify(result.data, null, 2)}
                    </ReactMarkdown>
                  </div>
                );
              }
            } else {
              displayContent = (
                <div className="markdown-content space-y-4">
                  <ReactMarkdown>Operation completed successfully.</ReactMarkdown>
                </div>
              );
            }

            setMessages([
              ...newMessages.slice(0, -1),
              {
                role: "bot",
                content: displayContent,
              },
            ]);
          } else {
            throw new Error(result.error || "Plugin execution failed");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to execute function";
          setMessages([
            ...newMessages.slice(0, -1),
            {
              role: "bot",
              content: (
                <div className="text-red-500">
                  Error: {errorMessage}
                </div>
              ),
            },
          ]);
        }
      } else {
        // Regular AI response (strategy or information)
        setMessages([
          ...newMessages.slice(0, -1),
          {
            role: "bot",
            content: (
              <div className="markdown-content space-y-4">
                <ReactMarkdown>
                  {data.analysis || "No information available for this query."}
                </ReactMarkdown>
              </div>
            ),
          },
        ]);
      }
    } catch (error) {
      setMessages([
        ...newMessages.slice(0, -1),
        {
          role: "bot",
          content: `Error: ${error instanceof Error ? error.message : "Operation failed"
            }`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main
      style={{
        backgroundImage: "url(/img/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="flex min-h-screen flex-col items-center justify-between"
    >
      <div className="w-full max-w-4xl grow flex flex-col items-center justify-around gap-6 px-4">
        <Image
          src={"/img/rsk.png"}
          alt="Rootstock Logo"
          width={300}
          height={100}
          priority
        />
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rootstock AI Agent</CardTitle>
            <ConnectButton />
          </CardHeader>
          <CardContent>
            <div
              className="space-y-4 mb-4 h-[400px] overflow-y-auto p-2 border rounded-md"
              ref={containerRef}
            >
              {messages.map(({ role, content }, idx) => (
                <div
                  key={idx}
                  className={`flex ${role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                      }`}
                  >
                    <div className="whitespace-pre-wrap">{content}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask about Rootstock or perform actions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </main>
  );
}
