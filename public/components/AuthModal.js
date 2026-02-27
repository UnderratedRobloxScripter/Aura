function AuthModal({ isOpen, onClose, onLogin }) {
    const [mode, setMode] = React.useState('login'); // 'login' | 'signup'
    const [step, setStep] = React.useState('credentials'); // 'credentials' | 'verification'
    
    // Form States
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [otp, setOtp] = React.useState('');
    
    // Logic States
    const [isLoading, setIsLoading] = React.useState(false);
    const [generatedOtp, setGeneratedOtp] = React.useState(null);
    
    const { addNotification } = useNotification();

    React.useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setMode('login');
        setStep('credentials');
        setEmail('');
        setPassword('');
        setName('');
        setOtp('');
        setIsLoading(false);
        setGeneratedOtp(null);
    };

    if (!isOpen) return null;

    // --- Helpers ---

    const verifyEmailDeliverability = async (emailToVerify) => {
        const key = "ema_live_wyr6XUYEy4o2OMMCZ43Vwt1qvLb2rG7AGeP3UMcc";
        const targetUrl = `https://api.emailvalidation.io/v1/info?apikey=${key}&email=${emailToVerify}`;
        const proxyUrl = `https://proxy-api.trickle-app.host/?url=${encodeURIComponent(targetUrl)}`;
        
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('Verification service unavailable');
        return await res.json();
    };

    const checkUserExists = async (emailToCheck) => {
        try {
            const result = await trickleListObjects('user', 100, true);
            const users = result.items || [];
            return users.find(u => u.objectData.email === emailToCheck);
        } catch (e) {
            console.error("DB Error:", e);
            throw new Error("Database connection failed");
        }
    };

    // --- Handlers ---

    const handleSendCode = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Validation
            if (!email || !password) throw new Error("Please fill in all fields.");
            if (mode === 'signup' && !name) throw new Error("Please enter your name.");
            if (password.length < 8) throw new Error("Password must be at least 8 characters.");

            // 2. DB Check
            const existingUser = await checkUserExists(email);
            
            if (mode === 'signup') {
                if (existingUser) {
                    throw new Error("Account already exists. Please sign in.");
                }

                // 3. Verify Deliverability
                const verificationResult = await verifyEmailDeliverability(email);
                if (verificationResult.state === 'undeliverable') throw new Error("Invalid email address.");
                if (verificationResult.state === 'disposable') throw new Error("Disposable emails are not allowed.");

                // 4. Generate & "Send" OTP
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                setGeneratedOtp(code);
                
                // SIMULATE SENDING EMAIL via Notification (User requested code to be sent to email, we simulate this)
                // In a real backend, this would utilize SMTP.
                // We show it in a notification for "Developer Mode" visibility or just say sent.
                // To allow the user to actually proceed, we MUST show the code somewhere since there is no real email.
                addNotification('success', `Verification code sent to ${email}`, 'Check your Inbox');
                
                // DEVELOPMENT HINT (So you can actually log in)
                setTimeout(() => {
                    addNotification('info', `[DEV] Your code is: ${code}`, 'Developer Mode');
                }, 1500);
                
                setStep('verification');
            } else {
                // LOGIN FLOW
                if (!existingUser) {
                    throw new Error("Account not found. Please sign up.");
                }
                if (existingUser.objectData.password !== password) {
                    throw new Error("Incorrect password.");
                }
                loginUser(existingUser);
            }

        } catch (err) {
            addNotification('error', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (otp !== generatedOtp) {
                throw new Error("Invalid verification code. Please try again.");
            }

            const newUser = await trickleCreateObject('user', {
                email,
                password,
                name,
                plan: 'free',
                avatar: null
            });

            addNotification('success', 'Your account has been successfully created.', 'Welcome to Aura');
            loginUser(newUser);

        } catch (err) {
            addNotification('error', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loginUser = (dbUser) => {
        const appUser = {
            id: dbUser.objectId,
            ...dbUser.objectData
        };
        onLogin(appUser);
        onClose();
    };

    const handleSocialLogin = (provider) => {
        addNotification('construction', `${provider} login is currently under development.`, 'Coming Soon');
    };

    // --- Render ---

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in-up p-4">
            {/* Main Container - Split Screen */}
            <div 
                className="relative w-full max-w-[1000px] h-[600px] bg-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 left-6 p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10 z-20"
                >
                    <div className="icon-x text-xl"></div>
                </button>

                {/* Left Side: Form (50%) */}
                <div className="w-full md:w-1/2 h-full flex flex-col justify-center px-8 md:px-12 relative z-10 bg-black">
                    
                    {/* Header */}
                    <div className="mb-8 text-center md:text-left mt-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {step === 'verification' ? 'Check your email' : (mode === 'signup' ? 'Create your account' : 'Sign in to Aura')}
                        </h2>
                        {step !== 'verification' && (
                            <p className="text-gray-500">
                                {mode === 'signup' ? 'Join Aura to explore the universe' : 'Welcome back'}
                            </p>
                        )}
                    </div>

                    {/* Step 1: Credentials Form */}
                    {step === 'credentials' && (
                        <div className="space-y-4 animate-fade-in-up w-full max-w-sm mx-auto md:mx-0">
                            
                            {/* Social Buttons */}
                            <button 
                                onClick={() => handleSocialLogin('X')}
                                className="w-full bg-white text-black font-bold py-2.5 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mb-2"
                            >
                                <div className="icon-twitter text-lg fill-current"></div> 
                                {mode === 'signup' ? 'Sign up with X' : 'Sign in with X'}
                            </button>
                            
                            <button 
                                onClick={() => handleSocialLogin('Apple')}
                                className="w-full bg-black border border-white/20 text-white font-bold py-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <div className="icon-apple text-lg"></div> 
                                {mode === 'signup' ? 'Sign up with Apple' : 'Sign in with Apple'}
                            </button>

                            <button 
                                onClick={() => handleSocialLogin('Google')}
                                className="w-full bg-black border border-white/20 text-white font-bold py-2.5 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                            >
                                <div className="icon-chrome text-lg"></div> 
                                {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                            </button>

                            <div className="flex items-center gap-4 my-2">
                                <div className="h-px bg-white/10 flex-1"></div>
                                <span className="text-xs text-gray-500 uppercase">or</span>
                                <div className="h-px bg-white/10 flex-1"></div>
                            </div>

                            {/* Main Form */}
                            <form onSubmit={handleSendCode} className="space-y-3">
                                {mode === 'signup' && (
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                                        placeholder="Display Name"
                                    />
                                )}
                                
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                                    placeholder="Email address"
                                />

                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                                    placeholder="Password"
                                    minLength={mode === 'signup' ? 8 : undefined}
                                />

                                <button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {isLoading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
                                </button>
                            </form>

                            {/* Toggle Mode */}
                            <div className="text-center mt-4">
                                <span className="text-gray-500 text-sm">
                                    {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                                </span>
                                <button 
                                    onClick={() => {
                                        setMode(mode === 'signup' ? 'login' : 'signup');
                                    }}
                                    className="ml-2 text-white text-sm font-bold hover:underline"
                                >
                                    {mode === 'signup' ? 'Sign in' : 'Sign up'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Verification Form */}
                    {step === 'verification' && (
                        <div className="w-full max-w-sm mx-auto md:mx-0 animate-fade-in-up">
                            <p className="text-gray-400 mb-6 text-sm">
                                We sent a verification code to <span className="text-white font-bold">{email}</span>. 
                                Please enter it below.
                            </p>
                            
                            <form onSubmit={handleVerifyAndSignup} className="space-y-6">
                                <div className="flex justify-center">
                                    <input 
                                        type="text" 
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-transparent border-b-2 border-white/20 px-4 py-3 text-white text-center text-3xl tracking-[0.5em] font-mono placeholder-gray-800 focus:outline-none focus:border-white transition-all"
                                        placeholder="000000"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                                </button>
                                
                                <button 
                                    type="button"
                                    onClick={() => setStep('credentials')}
                                    className="w-full text-center text-sm text-gray-500 hover:text-white"
                                >
                                    Back to details
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Right Side: Visual (50%) */}
                <div className="hidden md:flex w-1/2 h-full bg-[#000000] relative items-center justify-center overflow-hidden border-l border-white/5">
                    {/* Visual Elements matching Reference 2 */}
                    {/* The logo in the background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                         <div className="icon-orbit text-[400px] text-white/10 transform rotate-12"></div>
                    </div>
                    
                    {/* Gradient Mesh Effect */}
                    <div className="absolute right-0 top-0 w-full h-full bg-gradient-to-l from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-purple-900/20 via-transparent to-transparent pointer-events-none"></div>

                    {/* Content */}
                    <div className="relative z-10 text-center p-8">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl">
                            <div className="icon-sparkles text-3xl text-white"></div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Unlock the Universe</h3>
                        <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">
                            Experience the next generation of AI with Aura. Fast, intelligent, and designed for you.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
