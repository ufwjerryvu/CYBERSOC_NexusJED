"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "~/contexts/AuthContext";

interface User {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    createdAt: string;
}

export default function AdminPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        if (!loading && !user?.isAdmin) {
            router.replace("/forum");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/admin/users", {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users);
                }
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setLoadingUsers(false);
            }
        };

        if (user?.isAdmin) {
            fetchUsers();
        }
    }, [user]);

    if (loading || loadingUsers) {
        return <div className="min-h-screen bg-[#090b12] text-[#e6f6ff] flex items-center justify-center">
            <div className="font-mono">Loading...</div>
        </div>;
    }

    if (!user?.isAdmin) {
        return null;
    }

    const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
        if (!confirm(`${currentIsAdmin ? 'Remove' : 'Grant'} admin privileges?`)) return;

        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ userId, isAdmin: !currentIsAdmin })
            });

            if (res.ok) {
                setUsers(users.map(u =>
                    u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u
                ));
            }
        } catch (error) {
            console.error("Failed to update user:", error);
        }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!confirm(`Delete user ${username}? This cannot be undone.`)) return;

        try {
            const res = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ userId })
            });

            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
            }
        } catch (error) {
            console.error("Failed to delete user:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#090b12] text-[#e6f6ff] p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-[#00f0ff] font-mono">Admin Dashboard</h1>

                <div className="bg-[#0c0f17] border border-[rgba(0,240,255,0.25)] rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-[rgba(0,240,255,0.15)]">
                        <h2 className="text-xl font-mono text-[#00f0ff]">Users ({users.length})</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full font-mono text-sm">
                            <thead className="bg-[rgba(0,240,255,0.05)] border-b border-[rgba(0,240,255,0.15)]">
                                <tr>
                                    <th className="text-left p-4 text-[#a0b3c5]">Username</th>
                                    <th className="text-left p-4 text-[#a0b3c5]">Email</th>
                                    <th className="text-left p-4 text-[#a0b3c5]">Role</th>
                                    <th className="text-left p-4 text-[#a0b3c5]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-[rgba(0,240,255,0.1)] hover:bg-[rgba(0,240,255,0.02)]">
                                        <td className="p-4 text-[#e6f6ff]">{u.username}</td>
                                        <td className="p-4 text-[#e6f6ff]">{u.email}</td>
                                        <td className="p-4">
                                            {u.isAdmin ? (
                                                <span className="text-[#8a2be2] bg-[rgba(138,43,226,0.15)] px-2 py-1 rounded text-xs">
                                                    ADMIN
                                                </span>
                                            ) : (
                                                <span className="text-[#6b7785]">USER</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                                                    disabled={u.id === user?.id}
                                                    className="px-3 py-1 text-xs rounded bg-[rgba(138,43,226,0.2)] hover:bg-[rgba(138,43,226,0.3)] text-[#8a2be2] border border-[rgba(138,43,226,0.3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {u.isAdmin ? 'Demote' : 'Promote'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                                    disabled={u.id === user?.id}
                                                    className="px-3 py-1 text-xs rounded bg-[rgba(255,95,86,0.2)] hover:bg-[rgba(255,95,86,0.3)] text-[#ff5f56] border border-[rgba(255,95,86,0.3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}