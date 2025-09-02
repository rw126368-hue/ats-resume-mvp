'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2, Mail, Calendar, FileText } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

// Mock notifications data for demonstration
const mockNotifications = [
  {
    id: '1',
    type: 'resume_analysis',
    title: 'Resume Analysis Complete',
    message: 'Your resume "Software Engineer Resume" has been analyzed. ATS Score: 85%',
    email_sent: true,
    read_at: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '2',
    type: 'job_application',
    title: 'Job Application Updated',
    message: 'Your application to "Google" for "Senior Developer" has been updated to "Interviewing"',
    email_sent: false,
    read_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: '3',
    type: 'system',
    title: 'Weekly Report Available',
    message: 'Your weekly job search progress report is now available for download',
    email_sent: true,
    read_at: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: '4',
    type: 'resume_upload',
    title: 'Resume Upload Successful',
    message: 'Your resume "Marketing Manager Resume" has been uploaded successfully',
    email_sent: false,
    read_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Follow Up Reminder',
    message: 'Don\'t forget to follow up on your application to "Microsoft" - it\'s been 5 days',
    email_sent: true,
    read_at: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'resume_analysis':
    case 'resume_upload':
      return FileText;
    case 'job_application':
      return Calendar;
    case 'reminder':
      return Bell;
    default:
      return Mail;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'resume_analysis':
      return 'bg-blue-100 text-blue-800';
    case 'job_application':
      return 'bg-green-100 text-green-800';
    case 'reminder':
      return 'bg-yellow-100 text-yellow-800';
    case 'resume_upload':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState('all'); // all, unread, read

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({
        ...notification,
        read_at: notification.read_at || new Date().toISOString()
      }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read_at;
    if (filter === 'read') return notification.read_at;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const NotificationCard = ({ notification }: { notification: any }) => {
    const Icon = getNotificationIcon(notification.type);
    const isUnread = !notification.read_at;

    return (
      <Card className={`transition-all hover:shadow-md ${isUnread ? 'ring-2 ring-blue-100 bg-blue-50/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                  {notification.title}
                </h3>
                <div className="flex items-center space-x-2">
                  {isUnread && (
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      New
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatDateTime(notification.created_at)}
                  </span>
                </div>
              </div>
              
              <p className={`text-sm ${isUnread ? 'text-gray-800' : 'text-gray-600'} mb-2`}>
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {notification.email_sent && (
                    <Badge variant="outline" className="text-xs">
                      <Mail className="mr-1 h-3 w-3" />
                      Email Sent
                    </Badge>
                  )}
                  <Badge variant="outline" className={getNotificationColor(notification.type)}>
                    {notification.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-1">
                  {isUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Bell className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {filter === 'unread' ? 'No unread notifications' : 
         filter === 'read' ? 'No read notifications' : 'No notifications'}
      </h3>
      <p className="text-gray-500">
        {filter === 'unread' ? 'All caught up! You have no unread notifications.' :
         filter === 'read' ? 'No notifications have been read yet.' :
         'Notifications about your resume analysis, job applications, and reminders will appear here.'}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated on your resume analysis and job applications
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('read')}
              >
                Read ({notifications.length - unreadCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
          <CardDescription>
            Manage how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive notifications via email</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Resume Analysis Updates</p>
                <p className="text-xs text-muted-foreground">Get notified when analysis is complete</p>
              </div>
              <Button variant="outline" size="sm">
                Enabled
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Job Application Reminders</p>
                <p className="text-xs text-muted-foreground">Reminders to follow up on applications</p>
              </div>
              <Button variant="outline" size="sm">
                Enabled
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
