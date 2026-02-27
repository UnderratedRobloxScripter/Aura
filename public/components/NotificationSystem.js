const NotificationContext = React.createContext();

function NotificationProvider({ children }) {
    const [notifications, setNotifications] = React.useState([]);

    const addNotification = (type, message, title = '') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, type, message, title }]);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {notifications.map(notification => (
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
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}

function NotificationToast({ type, title, message, onClose }) {
    // Windows 11 Glassy Style
    // Types: 'success', 'error', 'warning', 'info', 'construction'
    
    const getIcon = () => {
        switch(type) {
            case 'success': return 'icon-circle-check text-green-400';
            case 'error': return 'icon-circle-x text-red-400';
            case 'warning': return 'icon-triangle-alert text-yellow-400';
            case 'construction': return 'icon-hard-hat text-orange-400';
            default: return 'icon-info text-blue-400';
        }
    };

    const getTitle = () => {
        if (title) return title;
        switch(type) {
            case 'success': return 'Success';
            case 'error': return 'Error';
            case 'warning': return 'Warning';
            case 'construction': return 'Coming Soon';
            default: return 'Information';
        }
    };

    return (
        <div className="pointer-events-auto min-w-[320px] max-w-sm bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl p-4 animate-fade-in-up flex items-start gap-3">
            <div className={`mt-0.5 text-xl ${getIcon()}`}></div>
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-0.5">{getTitle()}</h4>
                <p className="text-xs text-gray-300 leading-relaxed">{message}</p>
            </div>
            <button 
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors"
            >
                <div className="icon-x text-sm"></div>
            </button>
        </div>
    );
}
