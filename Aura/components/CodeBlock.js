function CodeBlock({ language, code }) {
    const [copied, setCopied] = React.useState(false);
    
    React.useEffect(() => {
        if (window.Prism) {
            window.Prism.highlightAll();
        }
    }, [code, language]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRun = () => {
        // Mock run functionality
        const toast = document.createElement('div');
        toast.className = "fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium z-50 animate-fade-in-up shadow-lg";
        toast.innerText = `Running ${language} code simulation...`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    };

    return (
        <div className="rounded-xl overflow-hidden my-4 border border-white/10 bg-[#0d0d0d] font-sans w-full max-w-full group">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-white/5 select-none">
                <span className="text-xs font-medium text-gray-400 lowercase">{language || 'text'}</span>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleRun}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors group/btn"
                        title="Run code"
                    >
                        <div className="icon-play text-[10px] group-hover/btn:text-green-400 transition-colors"></div>
                    </button>
                    
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors group/btn"
                        title="Copy code"
                    >
                        {copied ? (
                            <div className="icon-check text-[10px] text-green-400"></div>
                        ) : (
                            <div className="icon-copy text-[10px] group-hover/btn:text-white"></div>
                        )}
                        <span className="group-hover/btn:text-white">Copy</span>
                    </button>
                </div>
            </div>
            
            {/* Code Content - Added thin-scrollbar class */}
            <div className="p-4 overflow-x-auto bg-[#0d0d0d] thin-scrollbar">
                <pre><code className={`language-${language || 'text'}`}>{code}</code></pre>
            </div>
        </div>
    );
}