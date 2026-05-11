import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, Lightbulb, Loader2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../lib/axios';
import { ChatMessage } from '../../types/chat';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      setIsFetching(true);
      const res = await api.get('/llm/history');
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch chat history");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e?: React.FormEvent, presetMessage?: string) => {
    e?.preventDefault();
    const textToSend = presetMessage || input;
    
    if (!textToSend.trim() || isLoading) return;

    const newMsg: ChatMessage = { role: 'user', content: textToSend.trim() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/llm/chat', { message: textToSend.trim() });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      console.error("Chat error", err);
      // Fallback message on error
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting to the server right now. Please make sure the backend is running and GEMINI_API_KEY is configured." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to clear your chat history?")) return;
    
    try {
      await api.delete('/llm/history');
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear history");
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestions = [
    "Explain polynomial time complexity simply.",
    "Generate a 5-question quiz on Database Normalization.",
    "I'm feeling overwhelmed with my exams. How should I prioritize?",
    "Summarize the key differences between TCP and UDP."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto border bg-card rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-none">Smart Study Assistant</h2>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
              <span className="h-2 w-2 rounded-full bg-success inline-block"></span> Online (Gemini AI)
            </span>
          </div>
        </div>
        
        {messages.length > 0 && (
          <button 
            onClick={handleClear}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-background/50">
        {isFetching ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2 shadow-soft">
              <Bot className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">How can I help you study today?</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                I can explain complex topics, test your knowledge with quizzes, or help you manage your study anxiety.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-4">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(undefined, s)}
                  className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group flex items-start gap-3"
                >
                  <Lightbulb className="h-5 w-5 text-primary shrink-0 opacity-70 group-hover:opacity-100" />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const msgId = msg.id || idx;
            return (
              <div key={msgId} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-secondary text-secondary-foreground' : 'bg-primary/20 text-primary'}`}>
                    {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col gap-1 group">
                    <div className={`p-4 rounded-2xl ${
                      isUser 
                        ? 'bg-secondary text-secondary-foreground rounded-tr-sm' 
                        : 'bg-card border border-border shadow-sm rounded-tl-sm text-foreground'
                    }`}>
                      {isUser ? (
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions (Copy) */}
                    {!isUser && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                        <button 
                          onClick={() => copyToClipboard(msg.content, msgId)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1"
                        >
                          {copiedId === msgId ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                          {copiedId === msgId ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
                <Bot className="h-5 w-5" />
              </div>
              <div className="bg-card border border-border shadow-sm rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border/50">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask your study assistant anything..."
            className="w-full bg-background border border-input rounded-full pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground mt-2 font-medium">
          AI can make mistakes. Verify important academic information.
        </p>
      </div>
    </div>
  );
}
