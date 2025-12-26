"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";
import {
  Loader2,
  Users,
  Shield,
  UserX,
  CheckCircle,
  Search,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useFetch from "@/hooks/use-fetch";
import { getUsers, updateUserRole } from "@/actions/settings";
import { User } from "@/types/user/user";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import { useAuth } from "@/lib/auth-context";

export const AdminUsersList = () => {
  const { user: authUser } = useAuth();
  const [userSearch, setUserSearch] = useState("");
  const [confirmAdminDialog, setConfirmAdminDialog] = useState(false);
  const [userToPromote, setUserToPromote] = useState<User | null>(null);
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState(false);
  const [userToDemote, setUserToDemote] = useState<User | null>(null);

  const {
    loading: fetchingUsers,
    fn: fetchUsers,
    data: usersData,
  } = useFetch(getUsers);

  const { loading: updatingRole, fn: updateRole } = useFetch(updateUserRole);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Make user admin
  const handleMakeAdmin = async () => {
    if (!userToPromote) return;
    const result = await updateRole(userToPromote.id, UserRole.ADMIN);
    if (result?.success) {
      toast.success("User role updated successfully");
      fetchUsers();
      setConfirmAdminDialog(false);
      setConfirmRemoveDialog(false);
    }
  };

  // Remove admin privileges
  const handleRemoveAdmin = async () => {
    if (!userToDemote) return;
    const result = await updateRole(userToDemote.id, UserRole.USER);
    if (result?.success) {
      toast.success("User role updated successfully");
      fetchUsers();
      setConfirmAdminDialog(false);
      setConfirmRemoveDialog(false);
    }
  };

  // Filter users by search term
  const filteredUsers = usersData?.success
    ? usersData.data.filter(
        (user) =>
          user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    : [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Admin Users</CardTitle>
          <CardDescription>Manage users with admin privileges.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-9 w-full"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          {fetchingUsers ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : usersData?.success && filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const isCurrentUser = authUser?.email === user.email;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {user.imageUrl ? (
                                <Image
                                  src={user.imageUrl}
                                  alt={user.name || "User"}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Users className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <span>{user.name || "Unnamed User"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.role === UserRole.ADMIN
                                ? "bg-green-800"
                                : "bg-gray-800"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.role === UserRole.ADMIN ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                setUserToDemote(user);
                                setConfirmRemoveDialog(true);
                              }}
                              disabled={updatingRole || isCurrentUser}
                              title={
                                isCurrentUser
                                  ? "You cannot remove yourself as admin"
                                  : ""
                              }
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Remove Admin
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUserToPromote(user);
                                setConfirmAdminDialog(true);
                              }}
                              disabled={updatingRole}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No users found
              </h3>
              <p className="text-gray-500">
                {userSearch
                  ? "No users match your search criteria"
                  : "There are no users registered yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Make Admin Dialog */}
      <Dialog open={confirmAdminDialog} onOpenChange={setConfirmAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Admin Privileges</DialogTitle>
            <DialogDescription>
              Are you sure you want to give admin privileges to{" "}
              {userToPromote?.name || userToPromote?.email}? Admin users can
              manage all aspects of the dealership.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAdminDialog(false)}
              disabled={updatingRole}
            >
              Cancel
            </Button>
            <Button onClick={handleMakeAdmin} disabled={updatingRole}>
              {updatingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Admin Dialog */}
      <Dialog open={confirmRemoveDialog} onOpenChange={setConfirmRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Admin Privileges</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove admin privileges from{" "}
              {userToDemote?.name || userToDemote?.email}? They will no longer
              be able to access the admin dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemoveDialog(false)}
              disabled={updatingRole}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveAdmin}
              disabled={updatingRole}
            >
              {updatingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Admin"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
