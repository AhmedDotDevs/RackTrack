import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName: string;
  lastLogin?: string;
  isActive: boolean;
  profile?: {
    role: 'inspector' | 'admin';
  };
}

export default function Users() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    fullName: '',
    email: '',
    role: 'inspector' as 'inspector' | 'admin'
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check if user is admin
  useEffect(() => {
    if (user && (user as any).profile?.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive",
      });
      window.history.back();
    }
  }, [user, toast]);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && (user as any)?.profile?.role === 'admin',
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement user creation
    toast({
      title: "Feature Coming Soon",
      description: "User creation will be implemented in the next version",
    });
    setShowAddModal(false);
    setNewUserData({ fullName: '', email: '', role: 'inspector' });
  };

  const getRoleBadge = (role: string) => {
    return (
      <Badge 
        variant={role === 'admin' ? 'default' : 'secondary'}
        data-testid={`badge-user-role-${role}`}
      >
        {role === 'admin' ? 'Administrator' : 'Inspector'}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge 
        variant={isActive ? 'default' : 'secondary'}
        className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
        data-testid={`badge-user-status-${isActive ? 'active' : 'inactive'}`}
      >
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  if (!isAuthenticated || (user as any)?.profile?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar currentPage="users" />
        
        <main className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
                User Management
              </h2>
              <p className="text-gray-600" data-testid="text-page-description">
                Manage inspectors and administrators
              </p>
            </div>

            {/* Add User Button */}
            <div className="mb-6">
              <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-user">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle data-testid="text-add-user-title">Add New User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={newUserData.fullName}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                        data-testid="input-full-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select 
                        value={newUserData.role}
                        onValueChange={(value: 'inspector' | 'admin') => 
                          setNewUserData(prev => ({ ...prev, role: value }))
                        }
                      >
                        <SelectTrigger data-testid="select-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inspector">Inspector</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAddModal(false)}
                        data-testid="button-cancel-add-user"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-create-user"
                      >
                        Create User
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-users-table-title">System Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="table-users">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Last Login</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i}>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <Skeleton className="w-8 h-8 rounded-full mr-3" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                            </td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-6 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-6 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                          </tr>
                        ))
                      ) : users && users.length > 0 ? (
                        users.map((user: User) => (
                          <tr key={user.id} className="border-b" data-testid={`row-user-${user.id}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                                  {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                                  {(user.lastName?.[0] || '').toUpperCase()}
                                </div>
                                <span className="font-medium" data-testid={`text-user-name-${user.id}`}>
                                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4" data-testid={`text-user-email-${user.id}`}>
                              {user.email}
                            </td>
                            <td className="py-3 px-4">
                              {getRoleBadge(user.profile?.role || 'inspector')}
                            </td>
                            <td className="py-3 px-4" data-testid={`text-user-last-login-${user.id}`}>
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(user.isActive)}
                            </td>
                            <td className="py-3 px-4">
                              <button 
                                className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                Edit
                              </button>
                              <button 
                                className={`font-medium ${user.isActive ? 'text-gray-500 hover:text-gray-700' : 'text-green-600 hover:text-green-800'}`}
                                data-testid={`button-${user.isActive ? 'deactivate' : 'activate'}-user-${user.id}`}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500" data-testid="text-no-users">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
