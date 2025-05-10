import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { markNotificationAsRead, fetchUnreadNotifications } from '../../store/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaBell, FaUtensils, FaTruck } from 'react-icons/fa';
import './notifications.css';

const NotificationList = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { unreadNotifications, loading } = useSelector((state) => state.notifications);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fetch notifications when the dropdown is opened
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUnreadNotifications());
    }
  }, [isOpen, dispatch]);

  const handleNotificationClick = (notification) => {
    dispatch(markNotificationAsRead(notification.id));
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

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="notification-dropdown"
    >
      <div className="notification-header">
        <h3 className="notification-title">
          Notifications ({unreadNotifications.length})
        </h3>
        <button onClick={onClose} className="notification-close-btn">
          <FaTimes />
        </button>
      </div>
      
      {loading ? (
        <div className="notification-loading">
          <div className="notification-loader"></div>
          <p>Loading notifications...</p>
        </div>
      ) : unreadNotifications.length === 0 ? (
        <div className="notification-empty">
          <FaBell className="notification-empty-icon" />
          <p>No new notifications</p>
        </div>
      ) : (
        <div className="notification-list">
          {unreadNotifications.map((notification) => (
            <Link 
              key={notification.id} 
              to={notification.order ? `/orders/${notification.order}` : '/notifications'}
              className="notification-item"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <div className="notification-icon">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="notification-details">
                  <p className="notification-title">
                    {notification.title}
                  </p>
                  <p className="notification-message">
                    {notification.message}
                  </p>
                  <p className="notification-time">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          <div className="notification-footer">
            <Link 
              to="/notifications" 
              className="notification-view-all"
              onClick={onClose}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
