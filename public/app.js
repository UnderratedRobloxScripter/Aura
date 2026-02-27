// Make sure this import path matches your project structure
// If your provider file is elsewhere, adjust the path.
import { NotificationProvider } from "./components/NotificationContext";

// Important: DO NOT remove this `ErrorBoundary` component.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "ErrorBoundary caught an error:",
      error,
      errorInfo?.componentStack
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-4">
              We're sorry, but something unexpected happened.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showPricingModal, setShowPricingModal] = React.useState(false);

  React.useEffect(() => {
    try {
      const savedUser = localStorage.getItem("aura_user");

      if (savedUser) {
        const parsed = JSON.parse(savedUser);

        if (parsed && typeof parsed === "object") {
          setCurrentUser(parsed);
        } else {
          localStorage.removeItem("aura_user");
        }
      }
    } catch (e) {
      console.error("Failed to parse stored user:", e);
      localStorage.removeItem("aura_user");
    }
  }, []);

  const handleLogin = (user) => {
    if (!user || typeof user !== "object") return;

    setCurrentUser(user);
    localStorage.setItem("aura_user", JSON.stringify(user));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("aura_user");
  };

  const handleUpgrade = (planId) => {
    if (!currentUser) {
      setShowPricingModal(false);
      setShowAuthModal(true);
      return;
    }

    if (!planId) return;

    const updatedUser = { ...currentUser, plan: planId };

    setCurrentUser(updatedUser);
    localStorage.setItem("aura_user", JSON.stringify(updatedUser));
    setShowPricingModal(false);

    console.log(
      `Upgraded to ${
        planId === "pro_plus" ? "Pro+" : "Pro"
      } successfully`
    );
  };

  try {
    return (
      <div data-name="app" data-file="app.js">
        <ChatInterface
          currentUser={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenPricing={() => setShowPricingModal(true)}
          onLogout={handleLogout}
        />

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />

        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          currentPlan={
            currentUser && currentUser.plan
              ? currentUser.plan
              : "free"
          }
          onUpgrade={handleUpgrade}
        />
      </div>
    );
  } catch (error) {
    console.error("App render crash:", error);
    return null;
  }
}

/* ---------------- ROOT RENDER ---------------- */

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <NotificationProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </NotificationProvider>
  );
} else {
  console.error("Root element not found.");
}
