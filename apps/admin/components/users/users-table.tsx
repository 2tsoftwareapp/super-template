"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
}

interface UsersTableProps {
  users: User[];
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}

function UserActions({
  user,
  onToggleStatus,
  onDelete,
}: Omit<UsersTableProps, "users"> & { user: User }) {
  return (
    <div className="flex justify-end gap-2">
      {user.status === "ACTIVE" ? (
        <ConfirmButton
          label="Block"
          title={`Block ${user.email}?`}
          description="They are signed out at once and cannot sign in until reactivated."
          onConfirm={() => onToggleStatus(user)}
        />
      ) : (
        <Button variant="outline" size="sm" onClick={() => onToggleStatus(user)}>
          Activate
        </Button>
      )}
      <ConfirmButton
        label="Delete"
        title={`Delete ${user.email}?`}
        description="This cannot be undone."
        onConfirm={() => onDelete(user)}
      />
    </div>
  );
}

export function UsersTable({ users, ...actions }: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>{user.displayName}</TableCell>
            <TableCell>
              <Badge variant="outline">{user.role}</Badge>
            </TableCell>
            <TableCell>
              <StatusBadge status={user.status} />
            </TableCell>
            <TableCell>
              <UserActions user={user} {...actions} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
