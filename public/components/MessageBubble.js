function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    const hasImages = message.images && message.images.length > 0;

    // Advanced Markdown Parser
    const renderContent = (content) => {
        if (!content) return null;
        
        // 1. Split by Code Blocks
        // Regex to capture code blocks: ```lang ... ```
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

        // 2. Render Parts (Text parts need further parsing for Images/Bold/etc if needed)
        // For now, we specifically need to handle Markdown Images in text parts: ![alt](url)
        return parts.map((part, idx) => {
            if (part.type === 'code') {
                return <CodeBlock key={idx} language={part.language} code={part.content} />;
            } else {
                return <div key={idx} className="mb-2 last:mb-0">{renderTextWithImages(part.content)}</div>;
            }
        });
    };

    // Helper to render text containing markdown images
    const renderTextWithImages = (text) => {
        // Regex for images: ![alt](url)
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const elements = [];
        let lastIndex = 0;
        let match;

        while ((match = imageRegex.exec(text)) !== null) {
            // Text before image
            if (match.index > lastIndex) {
                elements.push(<span key={`text-${lastIndex}`} className="whitespace-pre-wrap">{text.slice(lastIndex, match.index)}</span>);
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
            elements.push(<span key={`text-${lastIndex}`} className="whitespace-pre-wrap">{text.slice(lastIndex)}</span>);
        }

        return elements;
    };

    return (
        <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in-up`}>
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
                <div 
                    className={`
                        relative rounded-2xl text-base leading-relaxed w-full
                        ${isUser 
                            ? 'bg-white/10 text-white rounded-tr-sm px-5 py-3' 
                            : 'bg-transparent text-gray-100 rounded-tl-sm px-0 py-0'
                        }
                    `}
                >
                    {isUser ? (
                        message.content
                    ) : (
                        <div className="prose prose-invert max-w-none w-full">
                            {renderContent(message.content)}
                        </div>
                    )}
                </div>

                {/* Meta / Actions */}
                {!isUser && (
                    <div className="flex items-center space-x-2 mt-1 ml-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300" title="Copy">
                            <div className="icon-copy text-xs"></div>
                        </button>
                        <button className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300" title="Regenerate">
                             <div className="icon-refresh-cw text-xs"></div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}