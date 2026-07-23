export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-4 animate-fade-in">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-db-500 to-navy-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        AI
      </div>
      <div className="chat-bubble-ai flex items-center gap-1.5 py-4 px-5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
