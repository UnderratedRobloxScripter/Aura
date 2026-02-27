const NotificationContext = React.createContext(null);

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = React.useState([]);

  const addNotification = (type, message, title = "") => {
    const id = Date.now().toString();

    setNotifications((prev) => [
      ...prev,
      { id, type, message, title },
    ]);

    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== id)
    );
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

function useNotification() {
  const context = React.useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }

  return context;
}

function NotificationToast({ type, title, message, onClose }) {
  const getColor = () => {
    switch (type) {
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      case "warning":
        return "border-yellow-500";
      default:
        return "border-blue-500";
    }
  };

  return (
    <div className={`pointer-events-auto min-w-[300px] bg-[#1e1e1e]/90 backdrop-blur-xl border ${getColor()} rounded-lg shadow-2xl p-4`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-semibold text-white">
            {title || "Notification"}
          </h4>
          <p className="text-xs text-gray-300 mt-1">
            {message}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
