"use client";

import {
  CheckCircle,
  Loader2,
  Search,
  Shield,
  Users,
  UserX,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getUsers } from "@/actions/settings/get-users";
import { updateUserRole } from "@/actions/settings/update-user-role";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRoleEnum as UserRole } from "@/enums/user-role";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@/hooks/useUser";
import type { User } from "@/types/user/user";

/**
 * Client table for managing admin privileges.
 * Promotes users to admin, removes admin access from non-admin users, and prevents self-removal.
 *
 * @returns Admin user management table with search, role badges, and confirmation dialogs
 * @see getUsers - Server action loading the admin user list
 * @see updateUserRole - Server action changing user roles
 */
export const AdminUsersList = () => {
  const { user: authUser } = useUser();
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

  /** Confirm promotion for the selected non-admin user. */
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

  /** Confirm removal of admin privileges for the selected admin user. */
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
          user.email.toLowerCase().includes(userSearch.toLowerCase()),
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
          <div className="relative mb-6">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search users..."
              className="w-full pl-9"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          {fetchingUsers ? (
            <div className="flex justify-center py-12">
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
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                              {user.imageUrl ? (
                                <Image
                                  src={user.imageUrl}
                                  alt={user.name || "User"}
                                  width={32}
                                  height={32}
                                  className="h-full w-full object-cover"
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
                              <UserX className="mr-2 h-4 w-4" />
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
                              <Shield className="mr-2 h-4 w-4" />
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
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-1 font-medium text-gray-900 text-lg">
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
      <AlertDialog
        open={confirmAdminDialog}
        onOpenChange={setConfirmAdminDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Admin Privileges</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to give admin privileges to{" "}
              {userToPromote?.name || userToPromote?.email}? Admin users can
              manage all aspects of the dealership.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingRole}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMakeAdmin}
              disabled={updatingRole}
            >
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Remove Admin Dialog */}
      <AlertDialog
        open={confirmRemoveDialog}
        onOpenChange={setConfirmRemoveDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Privileges</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin privileges from{" "}
              {userToDemote?.name || userToDemote?.email}? They will no longer
              be able to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingRole}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAdmin}
              disabled={updatingRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updatingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Admin"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
