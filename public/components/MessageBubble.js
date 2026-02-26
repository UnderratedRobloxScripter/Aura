function MessageBubble({ message, index, onEdit }) {
    const isUser = message.role === 'user';
    const hasImages = message.images && message.images.length > 0;
    
    // Edit State
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedText, setEditedText] = React.useState(message.content);

    // AI Action States
    const [liked, setLiked] = React.useState(false);
    const [disliked, setDisliked] = React.useState(false);
    const [isSpeaking, setIsSpeaking] = React.useState(false);

    // Handle Like Animation
    const handleLike = () => {
        setLiked(true);
        setDisliked(false);
        setTimeout(() => setLiked(false), 5000);
    };

    const handleDislike = () => {
        setDisliked(true);
        setLiked(false);
    };

    // Handle Text to Speech
    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(message.content);
        // Try to select a decent voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.onend = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    // Handle Edit Submit
    const handleSaveEdit = () => {
        if (editedText.trim() !== message.content) {
            onEdit(index, editedText);
        }
        setIsEditing(false);
    };

    // --- Advanced Markdown Parser ---
    
    // Helper to process inline styles (Bold, Italic, Strike)
    const parseInlineStyles = (text) => {
        // We will split by tokens and return an array of React elements/strings
        // Regex for: **bold**, *italic*, ~~strike~~, `inline code`
        // Note: This is a simple parser. Nested styles might be tricky but sufficient for this level.
        
        const parts = [];
        // Capture groups: 1=bold, 2=italic, 3=strike, 4=inlineCode
        const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(~~[^~]+~~)|(`[^`]+`)/g;
        
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Push text before match
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }

            const fullMatch = match[0];
            
            if (fullMatch.startsWith('**')) {
                parts.push(<strong key={match.index} className="font-bold text-white">{fullMatch.slice(2, -2)}</strong>);
            } else if (fullMatch.startsWith('*')) {
                parts.push(<em key={match.index} className="italic text-gray-300">{fullMatch.slice(1, -1)}</em>);
            } else if (fullMatch.startsWith('~~')) {
                parts.push(<del key={match.index} className="line-through text-gray-500">{fullMatch.slice(2, -2)}</del>);
            } else if (fullMatch.startsWith('`')) {
                parts.push(<code key={match.index} className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-pink-400">{fullMatch.slice(1, -1)}</code>);
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts;
    };

    const renderTextWithImagesAndStyles = (text) => {
        // First, handle Images: ![alt](url)
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const elements = [];
        let lastIndex = 0;
        let match;

        while ((match = imageRegex.exec(text)) !== null) {
            // Process text before image for inline styles
            if (match.index > lastIndex) {
                const segment = text.slice(lastIndex, match.index);
                elements.push(...parseInlineStyles(segment));
            }

            // The Image
            const alt = match[1];
            const url = match[2];
            elements.push(
                <div key={`img-${match.index}`} className="my-4 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                    <img src={url} alt={alt} className="w-full h-auto object-cover max-h-[500px]" loading="lazy" />
                </div>
            );

            lastIndex = imageRegex.lastIndex;
        }

        // Remaining text
        if (lastIndex < text.length) {
            const segment = text.slice(lastIndex);
            elements.push(...parseInlineStyles(segment));
        }

        return elements;
    };

    const renderContent = (content) => {
        if (!content) return null;
        
        // 1. Split by Code Blocks
        const codeBlockRegex = /```(\w*)(?:[^\n]*)\n([\s\S]*?)```/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            // Text before code block
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: content.slice(lastIndex, match.index)
                });
            }

            // Code block
            parts.push({
                type: 'code',
                language: match[1] || 'text',
                content: match[2].trim()
            });

            lastIndex = codeBlockRegex.lastIndex;
        }

        // Remaining text
        if (lastIndex < content.length) {
            parts.push({
                type: 'text',
                content: content.slice(lastIndex)
            });
        }

        return parts.map((part, idx) => {
            if (part.type === 'code') {
                return <CodeBlock key={idx} language={part.language} code={part.content} />;
            } else {
                return <div key={idx} className="mb-2 last:mb-0 whitespace-pre-wrap leading-relaxed">{renderTextWithImagesAndStyles(part.content)}</div>;
            }
        });
    };

    return (
        <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in-up group`}>
            <div className={`flex flex-col max-w-[90%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start min-w-[50%]'}`}>
                
                {/* User Attached Images */}
                {hasImages && (
                    <div className="flex flex-wrap gap-2 mb-2 justify-end">
                        {message.images.map((img, idx) => (
                            <img 
                                key={idx} 
                                src={img} 
                                alt="attachment" 
                                className="h-32 w-auto rounded-lg object-cover border border-white/10 hover:scale-105 transition-transform cursor-pointer"
                            />
                        ))}
                    </div>
                )}

                {/* Bubble */}
                {isEditing ? (
                    <div className="w-full bg-[#1a1a1a] border border-white/20 rounded-xl p-3 animate-fade-in-up flex flex-col gap-2 min-w-[300px]">
                        <textarea 
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full bg-transparent text-white text-sm resize-none focus:outline-none min-h-[80px]"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button 
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                className="px-3 py-1 text-xs text-black font-bold bg-white hover:bg-gray-200 rounded-md transition-colors"
                            >
                                Save & Send
                            </button>
                        </div>
                    </div>
                ) : (
                    <div 
                        className={`
                            relative rounded-2xl text-base leading-relaxed w-full transition-all duration-200
                            ${isUser 
                                ? 'bg-white/10 text-white rounded-tr-sm px-5 py-3' 
                                : 'bg-transparent text-gray-100 rounded-tl-sm px-0 py-0'
                            }
                        `}
                    >
                        {isUser ? (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : (
                            <div className="prose prose-invert max-w-none w-full">
                                {renderContent(message.content)}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions Bar */}
                {isUser && !isEditing && (
                    <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                         <button 
                            onClick={() => {
                                setEditedText(message.content);
                                setIsEditing(true);
                            }}
                            className="p-1.5 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                            title="Edit message"
                         >
                            <div className="icon-pencil text-xs"></div>
                         </button>
                    </div>
                )}

                {!isUser && (
                    <div className="flex items-center space-x-2 mt-3 ml-0">
                        {/* Copy */}
                        <button 
                            onClick={() => navigator.clipboard.writeText(message.content)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors" 
                            title="Copy"
                        >
                            <div className="icon-copy text-sm"></div>
                        </button>
                        
                        {/* Regenerate */}
                        <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors" title="Regenerate">
                             <div className="icon-refresh-cw text-sm"></div>
                        </button>

                        {/* Divider */}
                        <div className="w-px h-4 bg-white/10 mx-1"></div>

                        {/* Like */}
                        <button 
                            onClick={handleLike}
                            className={`p-1.5 rounded-lg transition-all duration-300 ${liked ? 'bg-green-500/10 text-green-500' : 'hover:bg-white/5 text-gray-500 hover:text-gray-300'}`}
                            title="Good response"
                        >
                            <div className={`icon-thumbs-up text-sm ${liked ? 'fill-current' : ''}`}></div>
                        </button>

                        {/* Dislike */}
                        <button 
                            onClick={handleDislike}
                            className={`p-1.5 rounded-lg transition-all duration-300 ${disliked ? 'bg-red-500/10 text-red-500' : 'hover:bg-white/5 text-gray-500 hover:text-gray-300'}`}
                            title="Bad response"
                        >
                             <div className={`icon-thumbs-down text-sm ${disliked ? 'fill-current' : ''}`}></div>
                        </button>

                         {/* Text to Speech */}
                         <button 
                            onClick={handleSpeak}
                            className={`p-1.5 rounded-lg transition-all duration-300 ${isSpeaking ? 'bg-white/20 text-white animate-pulse' : 'hover:bg-white/5 text-gray-500 hover:text-gray-300'}`}
                            title={isSpeaking ? "Stop speaking" : "Read aloud"}
                        >
                             <div className={`icon-volume-2 text-sm`}></div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
