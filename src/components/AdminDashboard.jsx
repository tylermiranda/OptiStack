import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Shield, ShieldAlert, ShieldCheck, Save, Users, Settings, Database } from 'lucide-react';
import { Alert, AlertDescription } from "./ui/alert";

const AdminDashboard = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [oidcSettings, setOidcSettings] = useState({
        OIDC_ISSUER: '',
        OIDC_AUTH_URL: '',
        OIDC_TOKEN_URL: '',
        OIDC_USERINFO_URL: '',
        OIDC_CLIENT_ID: '',
        OIDC_CLIENT_SECRET: '',
        OIDC_CALLBACK_URL: '',
        FRONTEND_URL: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchSettings();
    }, [token]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUsers(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOidcSettings(prev => ({ ...prev, ...data }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleAdmin = async (userId, currentStatus) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_admin: !currentStatus })
            });
            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentStatus ? 1 : 0 } : u));
                setMessage(`User role updated.`);
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (e) {
            setError('Failed to update role');
        }
    };

    const saveSettings = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(oidcSettings)
            });
            if (res.ok) {
                setMessage('Settings saved successfully. OIDC strategy updated.');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (e) {
            setError('Failed to save settings');
        }
    };

    const inputClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Shield size={32} className="text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage users and system configurations</p>
                </div>
            </div>

            {message && <Alert className="mb-6 border-primary/50 bg-primary/10 text-primary"><AlertDescription>{message}</AlertDescription></Alert>}
            {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="users" className="flex gap-2"><Users size={16} /> User Management</TabsTrigger>
                    <TabsTrigger value="settings" className="flex gap-2"><Settings size={16} /> OIDC Configuration</TabsTrigger>
                    <TabsTrigger value="maintenance" className="flex gap-2"><Database size={16} /> Maintenance</TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <div className="rounded-md border bg-card">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Registered Users</h2>
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Username</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {users.map(user => (
                                            <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle font-medium">{user.username}</td>
                                                <td className="p-4 align-middle">{user.email || '-'}</td>
                                                <td className="p-4 align-middle">
                                                    {user.is_admin ?
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                            <ShieldCheck size={12} /> Admin
                                                        </span> :
                                                        <span className="text-muted-foreground">User</span>
                                                    }
                                                </td>
                                                <td className="p-4 align-middle">{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td className="p-4 align-middle text-right">
                                                    <button
                                                        onClick={() => toggleAdmin(user.id, user.is_admin)}
                                                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium h-8 px-3 transition-colors ${user.is_admin
                                                            ? 'text-destructive hover:bg-destructive/10'
                                                            : 'text-primary hover:bg-primary/10'
                                                            }`}
                                                    >
                                                        {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="settings">
                    <div className="rounded-md border bg-card p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold">OIDC Identity Provider Settings</h2>
                            <p className="text-sm text-muted-foreground">Configure your OpenID Connect provider (e.g., Google, Auth0, Keycloak).</p>
                        </div>

                        <form onSubmit={saveSettings} className="space-y-4 max-w-2xl">
                            <div className="grid gap-4">
                                <Alert className="bg-muted">
                                    <AlertDescription>
                                        Configure redirection after successful login.
                                    </AlertDescription>
                                </Alert>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Frontend URL (Redirect Destination)</label>
                                    <input
                                        className={inputClassName}
                                        value={oidcSettings.FRONTEND_URL}
                                        onChange={e => setOidcSettings({ ...oidcSettings, FRONTEND_URL: e.target.value })}
                                        placeholder="http://localhost:5173"
                                    />
                                    <p className="text-xs text-muted-foreground">Where users are sent after OIDC login.</p>
                                </div>
                                <div className="h-px bg-border my-2" />
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Issuer URL</label>
                                    <input
                                        className={inputClassName}
                                        value={oidcSettings.OIDC_ISSUER}
                                        onChange={e => setOidcSettings({ ...oidcSettings, OIDC_ISSUER: e.target.value })}
                                        placeholder="https://accounts.google.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Client ID</label>
                                        <input
                                            className={inputClassName}
                                            value={oidcSettings.OIDC_CLIENT_ID}
                                            onChange={e => setOidcSettings({ ...oidcSettings, OIDC_CLIENT_ID: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Client Secret</label>
                                        <input
                                            type="password"
                                            className={inputClassName}
                                            value={oidcSettings.OIDC_CLIENT_SECRET}
                                            onChange={e => setOidcSettings({ ...oidcSettings, OIDC_CLIENT_SECRET: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Authorization URL</label>
                                    <input
                                        className={inputClassName}
                                        value={oidcSettings.OIDC_AUTH_URL}
                                        onChange={e => setOidcSettings({ ...oidcSettings, OIDC_AUTH_URL: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Token URL</label>
                                    <input
                                        className={inputClassName}
                                        value={oidcSettings.OIDC_TOKEN_URL}
                                        onChange={e => setOidcSettings({ ...oidcSettings, OIDC_TOKEN_URL: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">UserInfo URL</label>
                                    <input
                                        className={inputClassName}
                                        value={oidcSettings.OIDC_USERINFO_URL}
                                        onChange={e => setOidcSettings({ ...oidcSettings, OIDC_USERINFO_URL: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Callback URL</label>
                                    <input
                                        className={inputClassName}
                                        value={oidcSettings.OIDC_CALLBACK_URL}
                                        onChange={e => setOidcSettings({ ...oidcSettings, OIDC_CALLBACK_URL: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                >
                                    <Save size={16} className="mr-2" /> Save Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </TabsContent>

                <TabsContent value="maintenance">
                    <MaintenanceTab token={token} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

const MaintenanceTab = ({ token }) => {
    const [restoring, setRestoring] = useState(false);
    const [file, setFile] = useState(null);

    const handleDownload = async () => {
        try {
            const res = await fetch('/api/admin/backup', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `optistack_backup_${new Date().toISOString().split('T')[0]}.db`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                alert("Failed to download backup");
            }
        } catch (e) {
            console.error(e);
            alert("Error downloading backup");
        }
    };

    const handleRestore = async () => {
        if (!file) return;
        if (!window.confirm("WARNING: This will overwrite the current database with the uploaded file. All current data will be replaced. The server will restart. Are you sure?")) {
            return;
        }

        setRestoring(true);
        const formData = new FormData();
        formData.append('backup', file);

        try {
            const res = await fetch('/api/admin/restore', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                alert("Restore successful. The application will now reload.");
                // Wait for server restart
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                const data = await res.json();
                alert(`Restore failed: ${data.error}`);
                setRestoring(false);
            }
        } catch (e) {
            console.error(e);
            alert("Error calling restore endpoint");
            setRestoring(false);
        }
    };

    return (
        <div className="rounded-md border bg-card p-6">
            <div className="mb-8">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Save className="h-5 w-5" /> Data Backup
                </h2>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Download a full copy of your database. Keep this file safe as it contains all user data.
                </p>
                <button
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                    Download Backup (.db)
                </button>
            </div>

            <div className="pt-8 border-t">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-5 w-5" /> Data Restore
                </h2>
                <Alert variant="destructive" className="mt-4 mb-6 border-destructive/50 bg-destructive/10 text-destructive dark:text-red-400">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Danger Zone:</strong> Restoring a backup will <u>completely overwrite</u> the current database. This action cannot be undone.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-4 max-w-xl">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Select Backup File</label>
                        <input
                            type="file"
                            accept=".db,.sqlite"
                            onChange={e => setFile(e.target.files[0])}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <button
                        onClick={handleRestore}
                        disabled={!file || restoring}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2 w-fit"
                    >
                        {restoring ? 'Restoring...' : 'Restore Database'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
