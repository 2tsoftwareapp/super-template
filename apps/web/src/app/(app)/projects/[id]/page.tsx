"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";

import type { ApiEnvelope, ProjectResponse } from "@/lib/api-types";

import { FileUpload } from "@/components/app/file-upload";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { webFetch } from "@/lib/http";
import {
  buildProjectEditPath,
  normalizeProjectReturnTo,
  projectNavigationSearchParams,
} from "@/lib/search-params";

interface Attachment {
  id: string;
  fileId: string;
  entityType: string;
  entityId: string;
  originalName?: string;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
}

interface Activity {
  id: string;
  summary: string;
  actorId: string | null;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  status: string;
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [returnTo] = useQueryState(
    "returnTo",
    projectNavigationSearchParams.returnTo,
  );
  const [comment, setComment] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const backToProjects = normalizeProjectReturnTo(returnTo);

  const project = useQuery({
    queryKey: ["project", params.id],
    queryFn: () => webFetch<ProjectResponse>(`/api/bff/projects/${params.id}`),
  });

  const attachments = useQuery({
    queryKey: ["project-attachments", params.id],
    queryFn: () =>
      webFetch<ApiEnvelope<Attachment[]>>(
        `/api/bff/projects/${params.id}/attachments`,
      ),
  });

  const comments = useQuery({
    queryKey: ["comments", "project", params.id],
    queryFn: () =>
      webFetch<ApiEnvelope<Comment[]>>(
        `/api/bff/comments?entityType=project&entityId=${params.id}`,
      ),
  });

  const activities = useQuery({
    queryKey: ["activities", "project", params.id],
    queryFn: () =>
      webFetch<ApiEnvelope<Activity[]>>(
        `/api/bff/activities?entityType=project&entityId=${params.id}`,
      ),
  });

  const invitations = useQuery({
    queryKey: ["invitations", "project", params.id],
    queryFn: () =>
      webFetch<ApiEnvelope<Invitation[]>>(
        `/api/bff/invitations?entityType=project&entityId=${params.id}`,
      ),
  });

  const attachFile = useMutation({
    mutationFn: (fileId: string) =>
      webFetch("/api/bff/attachments", {
        method: "POST",
        body: JSON.stringify({
          fileId,
          entityType: "project",
          entityId: params.id,
        }),
      }),
    onSuccess: () => {
      toast.success("Attachment added");
      void queryClient.invalidateQueries({
        queryKey: ["project-attachments", params.id],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addComment = useMutation({
    mutationFn: () =>
      webFetch("/api/bff/comments", {
        method: "POST",
        body: JSON.stringify({
          entityType: "project",
          entityId: params.id,
          content: comment,
        }),
      }),
    onSuccess: () => {
      setComment("");
      void queryClient.invalidateQueries({
        queryKey: ["comments", "project", params.id],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const invite = useMutation({
    mutationFn: () =>
      webFetch("/api/bff/invitations", {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail,
          entityType: "project",
          entityId: params.id,
        }),
      }),
    onSuccess: () => {
      setInviteEmail("");
      toast.success("Invitation sent");
      void queryClient.invalidateQueries({
        queryKey: ["invitations", "project", params.id],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="max-w-4xl space-y-6">
      <Card className="border-border">
        <CardHeader className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={backToProjects} />}
          >
            Back to projects
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="outline">Project detail</Badge>
              <CardTitle className="text-4xl">
                {project.data?.data.name}
              </CardTitle>
              <CardDescription>
                {typeof project.data?.data.description === "string"
                  ? project.data.data.description
                  : "No description provided."}
              </CardDescription>
            </div>
            <Button
              render={
                <Link href={buildProjectEditPath(params.id, backToProjects)} />
              }
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">{project.data?.data.status}</Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue="attachments">
        <TabsList>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>
        <TabsContent value="attachments" className="space-y-4">
          <FileUpload
            label="Upload attachment"
            onUploaded={(file) => attachFile.mutate(file.id)}
          />
          <div className="space-y-2">
            {(attachments.data?.data ?? []).map((attachment) => (
              <div
                key={attachment.id}
                className="rounded-lg border p-3 text-sm"
              >
                {attachment.originalName ?? attachment.fileId}
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="comments" className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button
              onClick={() => addComment.mutate()}
              disabled={!comment.trim()}
            >
              Add comment
            </Button>
          </div>
          {(comments.data?.data ?? []).map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-4 text-sm">{item.content}</CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="activity" className="space-y-2">
          {(activities.data?.data ?? []).map((activity) => (
            <div key={activity.id} className="rounded-lg border p-3 text-sm">
              <p>{activity.summary}</p>
              <p className="text-muted-foreground">
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="invites" className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input
                id="inviteEmail"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Button className="self-end" onClick={() => invite.mutate()}>
              Invite
            </Button>
          </div>
          {(invitations.data?.data ?? []).map((invitation) => (
            <div key={invitation.id} className="text-sm">
              {invitation.email} · {invitation.status}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
