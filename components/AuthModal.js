function AuthModal({ isOpen, onClose, onLogin }) {
    const [mode, setMode] = React.useState('login'); // 'login' | 'signup'
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    // Reset state when opening
    React.useEffect(() => {
        if (isOpen) {
            setMode('login');
            setEmail('');
            setPassword('');
            setIsLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            
            // Direct Login/Signup success
            const user = {
                id: 'usr_' + Date.now().toString(36),
                name: email.split('@')[0],
                email: email,
                plan: 'free',
                avatar: null
            };
            onLogin(user);
            onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
            <div 
                className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10 z-10"
                >
                    <div className="icon-x text-lg"></div>
                </button>

                {/* Header / Tabs */}
                <div className="flex border-b border-white/10 bg-[#0a0a0a]">
                    <button 
                        onClick={() => setMode('login')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${mode === 'login' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        Sign In
                        {mode === 'login' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-[0_-2px_10px_rgba(255,255,255,0.5)]"></div>}
                    </button>
                    <button 
                        onClick={() => setMode('signup')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${mode === 'signup' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        Sign Up
                        {mode === 'signup' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white shadow-[0_-2px_10px_rgba(255,255,255,0.5)]"></div>}
                    </button>
                </div>

                <div className="p-8">
                    {/* Icon & Title */}
                    <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            <div className="icon-orbit text-black text-2xl"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {mode === 'login' ? 'Welcome back' : 'Create account'}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {mode === 'login' 
                                ? 'Enter your details to access your account' 
                                : 'Join Aura to explore the universe'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Email</label>
                            <div className="relative">
                                <div className="absolute left-3 top-3.5 text-gray-500"><div className="icon-mail text-sm"></div></div>
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">Password</label>
                            <div className="relative">
                                <div className="absolute left-3 top-3.5 text-gray-500"><div className="icon-lock text-sm"></div></div>
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                                    placeholder={mode === 'login' ? "Enter your password" : "Create a strong password"}
                                    minLength={mode === 'signup' ? 8 : undefined}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-3.5 rounded-lg hover:bg-gray-200 transition-colors mt-6 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                    <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                                </>
                            ) : (
                                <span>{mode === 'login' ? 'Sign In' : 'Sign Up'}</span>
                            )}
                        </button>
                        
                        {mode === 'login' && (
                            <div className="text-center mt-4">
                                <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Forgot password?</a>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}