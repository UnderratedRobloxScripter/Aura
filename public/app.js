class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Something went wrong
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-black rounded-lg"
            >
              Reload
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

  const { addNotification } = useNotification();

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("aura_user");
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Storage parse failed", err);
    }
  }, []);

  const loginDemo = () => {
    const user = { name: "Demo User", plan: "free" };
    setCurrentUser(user);
    localStorage.setItem("aura_user", JSON.stringify(user));

    addNotification("success", "Logged in successfully");
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("aura_user");
    addNotification("info", "Logged out");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">
        Aura AI Chat
      </h1>

      {currentUser ? (
        <>
          <p className="text-gray-400">
            Welcome, {currentUser.name}
          </p>

          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 rounded-lg"
          >
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={loginDemo}
          className="px-4 py-2 bg-white text-black rounded-lg"
        >
          Login Demo
        </button>
      )}
    </div>
  );
}

/* ROOT RENDER */

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
}
