const NotificationContext = React.createContext(null);

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = React.useState([]);

  const addNotification = (type, message, title = "") => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message, title }]);

    setTimeout(() => {
      removeNotification(id);
    }, 4000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="pointer-events-auto bg-[#1e1e1e]/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-4 min-w-[300px]">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {n.title || "Notification"}
                </h4>
                <p className="text-xs text-gray-300 mt-1">
                  {n.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function useNotification() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
