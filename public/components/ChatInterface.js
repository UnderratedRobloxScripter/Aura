function ChatInterface({ currentUser, onOpenAuth, onOpenPricing, onLogout }) {
  const { addNotification } = useNotification();
  const [messages, setMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);

    setLoading(true);

    try {
      // Dummy AI response (replace with real ai.js logic)
      const reply = {
        role: "assistant",
        content: "This is a simulated AI response."
      };

      setTimeout(() => {
        setMessages(prev => [...prev, reply]);
        setLoading(false);
      }, 800);
    } catch (err) {
      addNotification("error", "AI failed to respond");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      
      <Sidebar
        currentUser={currentUser}
        onOpenAuth={onOpenAuth}
        onOpenPricing={onOpenPricing}
        onLogout={onLogout}
      />

      <div className="flex-1 flex flex-col">
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && (
            <div className="text-gray-400 text-sm">
              AI is typing...
            </div>
          )}
        </div>

        <InputBar onSend={handleSend} />
      </div>
    </div>
  );
}
