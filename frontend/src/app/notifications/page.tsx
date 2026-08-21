"use client";

import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

type Notification = {
  id: number;
  employeeId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // For now we are testing with employee ID 1
  const employeeId = 1;

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/Notifications/employee/${employeeId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load notifications");
      }

      const data = await response.json();

      setNotifications(data);
    } catch (error) {
      console.error(error);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: number) {
    try {
      const response = await fetch(
        `${API}/Notifications/${id}/read`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch(
        `${API}/Notifications/employee/${employeeId}/read-all`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "32px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Header */}

        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
              }}
            >
              🔔 Notifications
            </h1>

            <p
              style={{
                color: "#64748b",
                marginBottom: 0,
              }}
            >
              You have {unreadCount} unread notification
              {unreadCount !== 1 ? "s" : ""}.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Error */}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              padding: "14px",
              borderRadius: "10px",
              marginTop: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}

        {loading ? (
          <p
            style={{
              marginTop: "30px",
              color: "#64748b",
            }}
          >
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <div
            style={{
              background: "white",
              marginTop: "20px",
              padding: "50px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "45px" }}>🔔</div>

            <h2>No notifications</h2>

            <p style={{ color: "#64748b" }}>
              You don't have any notifications yet.
            </p>
          </div>
        ) : (
          <section style={{ marginTop: "20px" }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  background: notification.isRead
                    ? "white"
                    : "#eff6ff",
                  padding: "20px",
                  marginBottom: "12px",
                  borderRadius: "12px",
                  border: notification.isRead
                    ? "1px solid #e2e8f0"
                    : "1px solid #bfdbfe",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "20px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                      }}
                    >
                      {notification.title}
                    </h3>

                    {!notification.isRead && (
                      <span
                        style={{
                          background: "#2563eb",
                          color: "white",
                          fontSize: "12px",
                          padding: "4px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      color: "#475569",
                      margin: "10px 0",
                    }}
                  >
                    {notification.message}
                  </p>

                  <small
                    style={{
                      color: "#94a3b8",
                    }}
                  >
                    {new Date(
                      notification.createdAt
                    ).toLocaleString()}
                  </small>
                </div>

                {!notification.isRead && (
                  <button
                    onClick={() =>
                      markAsRead(notification.id)
                    }
                    style={{
                      alignSelf: "center",
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "7px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}