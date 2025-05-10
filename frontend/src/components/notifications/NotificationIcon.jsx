import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { fetchUnreadNotifications } from '../../store/slices/notificationSlice';
import './notifications.css';

const NotificationIcon = () => {
  const dispatch = useDispatch();
  const { unreadNotifications } = useSelector((state) => state.notifications);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Fetch unread notifications on component mount and when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUnreadNotifications());
      
      // Set up polling to fetch notifications every 30 seconds
      const interval = setInterval(() => {
        dispatch(fetchUnreadNotifications());
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="notification-icon-container">
      <Link to="/notifications" className="notification-bell-link">
        <FaBell size={24} className="notification-bell" />
        {unreadNotifications.length > 0 && (
          <span className="notification-badge">
            {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
          </span>
        )}
      </Link>
    </div>
  );
};

export default NotificationIcon;
