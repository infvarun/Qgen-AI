"use client";
// Import the necessary modules
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Textarea, Spinner } from "flowbite-react";
import { HiPaperAirplane } from "react-icons/hi";
import NavHeader from "../navbar/navHeader";
import NavLogo from "../navbar/navLogo";
import ReactMarkdown from "react-markdown";
import TextLoader from "../utility/textLoader";

// Define the interfaces for the message and prompt
interface Message {
  id: number;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface Prompt {
  id: number;
  title: string;
}

const ChatLayout: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const [prompts] = useState<Prompt[]>([
    { id: 1, title: "What is clinical Study?" },
    { id: 2, title: "What is Randomization" },
    { id: 3, title: "Explain placebo" },
    // Add more default prompts as needed
  ]);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [currentStreamId, setCurrentStreamId] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, streamedText]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() && selectedModel) {
      const userMessage: Message = {
        id: messages.length + 1,
        text: inputMessage,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInputMessage("");
      setIsWaitingResponse(true);
      setStreamedText("");

      const streamId = messages.length + 2;
      setCurrentStreamId(streamId);

      try {
        const response = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: inputMessage,
            model: selectedModel.value,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("ReadableStream not available");
        }

        let partialResponse = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const textChunk = new TextDecoder().decode(value);

          try {
            // Parse the JSON chunk
            const jsonChunk = JSON.parse(textChunk);

            // Extract the response text, if it exists
            if (jsonChunk.response) {
              const formattedResponse = jsonChunk.response.replace(
                /<think> <\/think>/g,
                `<svg class="w-[32px] h-[32px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M4.07141 14v6h5.99999v-6H4.07141Zm4.5-4h6.99999l-3.5-6-3.49999 6Zm7.99999 10c1.933 0 3.5-1.567 3.5-3.5s-1.567-3.5-3.5-3.5-3.5 1.567-3.5 3.5 1.567 3.5 3.5 3.5Z"/>
                </svg> Thinking.....`,
              );
              partialResponse += formattedResponse;
              setStreamedText((prevText) => prevText + formattedResponse);
            }

            if (jsonChunk.done) {
              break;
            }
          } catch (error) {
            console.error("Error parsing JSON chunk:", error, textChunk);
            // Handle the error appropriately (e.g., skip this chunk)
          }
        }

        const assistantMessage: Message = {
          id: streamId,
          text: partialResponse,
          sender: "assistant",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      } catch (error) {
        console.error("Error calling Ollama API:", error);
      } finally {
        setIsWaitingResponse(false);
        setCurrentStreamId(null);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Shift + Enter will create a new line
  };

  const handleStartNewChat = () => {
    setMessages([]);
    setStreamedText("");
    setCurrentStreamId(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        console.log("Text copied to clipboard");
      },
      (err) => {
        console.error("Could not copy text: ", err);
      },
    );
  };

  const handleRegenerate = async (message: Message) => {
    if (selectedModel) {
      setIsWaitingResponse(true);
      setStreamedText("");
      setCurrentStreamId(message.id);

      try {
        const response = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: message.text,
            model: selectedModel.value,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("ReadableStream not available");
        }

        let partialResponse = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const textChunk = new TextDecoder().decode(value);

          try {
            // Parse the JSON chunk
            const jsonChunk = JSON.parse(textChunk);

            // Extract the response text, if it exists
            if (jsonChunk.response) {
              const formattedResponse = jsonChunk.response.replace(
                /<think> <\/think>/g,
                `<svg class="w-[32px] h-[32px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M4.07141 14v6h5.99999v-6H4.07141Zm4.5-4h6.99999l-3.5-6-3.49999 6Zm7.99999 10c1.933 0 3.5-1.567 3.5-3.5s-1.567-3.5-3.5-3.5-3.5 1.567-3.5 3.5 1.567 3.5 3.5 3.5Z"/>
              </svg> Thinking.....`,
              );
              partialResponse += formattedResponse;
              setStreamedText((prevText) => prevText + formattedResponse);
            }

            if (jsonChunk.done) {
              break;
            }
          } catch (error) {
            console.error("Error parsing JSON chunk:", error, textChunk);
            // Handle the error appropriately (e.g., skip this chunk)
          }
        }

        const assistantMessage: Message = {
          id: message.id,
          text: partialResponse,
          sender: "assistant",
          timestamp: new Date(),
        };
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === message.id ? assistantMessage : msg,
          ),
        );
      } catch (error) {
        console.error("Error calling Ollama API:", error);
      } finally {
        setIsWaitingResponse(false);
        setCurrentStreamId(null);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - 20% */}
      <div className="w-1/5 overflow-y-auto border-r border-gray-200">
        <NavLogo />
        <div className="p-4">
          <h2 className="mb-4 bg-gradient-to-r text-center">
            Suggested Prompts
          </h2>
          <div className="space-y-2">
            {prompts.map((prompt) => (
              <button
                key={prompt.id}
                className="mb-2 inline-flex w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-200 dark:text-white dark:focus:ring-purple-800"
                onClick={() => setInputMessage(prompt.title)}
              >
                <span className="relative w-full rounded-md bg-white px-5 py-2.5 transition-all duration-75 ease-in hover:from-purple-500 hover:to-pink-500 hover:bg-clip-text hover:text-transparent dark:bg-gray-900 hover:dark:bg-gray-900">
                  {prompt.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Chat Panel - 80% */}
      <div className="flex h-full w-4/5 flex-col">
        {/* Chat Header */}
        <NavHeader
          onStartNewChat={handleStartNewChat}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-200 text-blue-900"
                }`}
              >
                {message.sender === "assistant" &&
                message.id === currentStreamId ? (
                  <ReactMarkdown>{streamedText}</ReactMarkdown>
                ) : message.sender === "assistant" ? (
                  <div>
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => handleCopy(message.text)}
                        className="inline-flex items-center rounded-full border border-blue-700 p-2.5 text-center text-sm font-medium text-blue-700 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-500 dark:hover:text-white dark:focus:ring-blue-800"
                      >
                        <svg
                          className="size-6"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke="currentColor"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRegenerate(message)}
                        className="inline-flex items-center rounded-full border border-blue-700 p-2.5 text-center text-sm font-medium text-blue-700 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-500 dark:hover:text-white dark:focus:ring-blue-800"
                      >
                        <svg
                          className="size-6"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  message.text
                )}
              </div>
            </div>
          ))}
          {isWaitingResponse && (
            <div className="justify-start">
              <TextLoader />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4">
          <div className="flex w-full items-center gap-2">
            <Textarea
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
              rows={3}
            />
            <div className="flex items-center">
              <Button
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:bg-gradient-to-l focus:outline-none focus:ring-4 focus:ring-purple-200 dark:focus:ring-purple-800"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                size="lg"
              >
                <HiPaperAirplane className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;
