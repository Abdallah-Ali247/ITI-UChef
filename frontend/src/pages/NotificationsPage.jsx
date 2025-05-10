import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaBell, 
  FaUtensils, 
  FaTruck, 
  FaCheck, 
  FaRegBell,
  FaAngleRight
} from 'react-icons/fa';

import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../store/slices/notificationSlice';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { notifications, loading, error } = useSelector((state) => state.notifications);
  const [activeTab, setActiveTab] = useState('all');
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredNotifications(notifications);
    } else if (activeTab === 'unread') {
      setFilteredNotifications(notifications.filter(notification => !notification.is_read));
    } else if (activeTab === 'read') {
      setFilteredNotifications(notifications.filter(notification => notification.is_read));
    }
  }, [activeTab, notifications]);

  const handleMarkAsRead = (notificationId) => {
    dispatch(markNotificationAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return <FaBell className="text-blue-500" />;
      case 'order_accepted':
        return <FaCheckCircle className="text-green-500" />;
      case 'order_rejected':
        return <FaTimesCircle className="text-red-500" />;
      case 'order_ready':
        return <FaUtensils className="text-amber-500" />;
      case 'order_delivered':
        return <FaTruck className="text-green-600" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="notifications-container">
        <div className="notifications-header">
          <h1 className="notifications-title">Notifications</h1>
        </div>
        <div className="notifications-loading">
          <div className="notifications-loader"></div>
          <p>Loading your notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-container">
        <div className="notifications-header">
          <h1 className="notifications-title">Notifications</h1>
        </div>
        <div className="notifications-error">
          <FaTimesCircle className="notifications-error-icon" />
          <p>We couldn't load your notifications. Please try again later.</p>
          <p className="notifications-error-message">{error}</p>
        </div>
      </div>
    );
  }

  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.is_read).length;
  };

  const unreadCount = getUnreadCount();
  
  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="notifications-title-container">
          <h1 className="notifications-title">Notifications</h1>
          {unreadCount > 0 && (
            <span className="notifications-counter">{unreadCount}</span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="notifications-mark-all-btn"
          >
            <FaCheck /> <span>Mark all as read</span>
          </button>
        )}
      </div>

      <div className="notifications-tabs">
        <button
          onClick={() => setActiveTab('all')}
          className={`notifications-tab ${activeTab === 'all' ? 'active' : ''}`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`notifications-tab ${activeTab === 'unread' ? 'active' : ''}`}
        >
          Unread
          {unreadCount > 0 && <span className="notifications-tab-counter">{unreadCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('read')}
          className={`notifications-tab ${activeTab === 'read' ? 'active' : ''}`}
        >
          Read
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="notifications-empty">
          <FaRegBell className="notifications-empty-icon" />
          <h3>No {activeTab} notifications</h3>
          <p>Check back later for updates on your orders and activities</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div key={notification.id} className={`notification-card ${!notification.is_read ? 'unread' : ''}`}>
              <Link 
                to={notification.order ? `/orders/${notification.order}` : '#'}
                className="notification-link"
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <div className="notification-icon-wrapper">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h3 className="notification-title">{notification.title}</h3>
                    <span className="notification-time">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  <div className="notification-footer">
                    {notification.order && (
                      <span className="notification-order-badge">
                        Order #{notification.order}
                      </span>
                    )}
                    
                    {!notification.is_read && (
                      <button 
                        className="notification-mark-read-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="notification-arrow">
                  <FaAngleRight />
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
