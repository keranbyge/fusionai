import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Bell, CalendarPlus, Trash2, Check, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Reminder } from "@shared/schema";

const reminderFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  reminderDate: z.string().min(1, "Date and time are required"),
  workspaceId: z.string().optional(),
});

type ReminderFormData = z.infer<typeof reminderFormSchema>;

export default function RemindersPage() {
  const { toast } = useToast();

  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: "",
      description: "",
      reminderDate: "",
      workspaceId: "",
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: async (data: ReminderFormData) => {
      const payload: any = {
        title: data.title,
        description: data.description || undefined,
        reminderDate: new Date(data.reminderDate).toISOString(),
        completed: false,
      };
      
      if (data.workspaceId && data.workspaceId.trim()) {
        payload.workspaceId = data.workspaceId;
      }
      
      return apiRequest("POST", "/api/reminders", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      form.reset();
      toast({
        title: "Reminder created",
        description: "Your reminder has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Reminder deleted",
        description: "The reminder has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete reminder.",
        variant: "destructive",
      });
    },
  });

  const toggleCompletedMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return apiRequest("PATCH", `/api/reminders/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Reminder updated",
        description: "The reminder status has been updated.",
      });
    },
  });

  const syncToCalendarMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/reminders/${id}/sync-to-calendar`);
    },
    onSuccess: () => {
      toast({
        title: "Sync to Calendar",
        description: "Google Calendar integration will be set up with OAuth in the next update.",
      });
    },
  });

  const onSubmit = (data: ReminderFormData) => {
    createReminderMutation.mutate(data);
  };

  const upcomingReminders = reminders.filter(r => !r.completed && new Date(r.reminderDate) >= new Date());
  const pastReminders = reminders.filter(r => !r.completed && new Date(r.reminderDate) < new Date());
  const completedReminders = reminders.filter(r => r.completed);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/workspace">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8 text-primary" />
              Reminders
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your reminders and sync with Google Calendar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                Create New Reminder
              </CardTitle>
              <CardDescription>
                Add a new reminder to keep track of important tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter reminder title" 
                            data-testid="input-reminder-title"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add details about this reminder"
                            data-testid="input-reminder-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reminderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            data-testid="input-reminder-date"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createReminderMutation.isPending}
                    data-testid="button-create-reminder"
                  >
                    {createReminderMutation.isPending ? "Creating..." : "Create Reminder"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Loading reminders...</p>
                </CardContent>
              </Card>
            ) : reminders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No reminders yet. Create your first reminder to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {upcomingReminders.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upcoming Reminders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {upcomingReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                          data-testid={`reminder-${reminder.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 mt-1"
                            onClick={() => toggleCompletedMutation.mutate({ id: reminder.id, completed: true })}
                            data-testid={`button-complete-${reminder.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold" data-testid={`text-title-${reminder.id}`}>{reminder.title}</h3>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(reminder.reminderDate).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => syncToCalendarMutation.mutate(reminder.id)}
                              data-testid={`button-sync-${reminder.id}`}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteReminderMutation.mutate(reminder.id)}
                              data-testid={`button-delete-${reminder.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {pastReminders.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-destructive">Past Due</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pastReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 hover-elevate"
                          data-testid={`reminder-${reminder.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 mt-1"
                            onClick={() => toggleCompletedMutation.mutate({ id: reminder.id, completed: true })}
                            data-testid={`button-complete-${reminder.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">{reminder.title}</h3>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                            )}
                            <p className="text-xs text-destructive mt-2">
                              {new Date(reminder.reminderDate).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => syncToCalendarMutation.mutate(reminder.id)}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteReminderMutation.mutate(reminder.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {completedReminders.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Completed</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {completedReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 opacity-60"
                          data-testid={`reminder-${reminder.id}`}
                        >
                          <Check className="h-5 w-5 mt-1 text-primary" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold line-through">{reminder.title}</h3>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-through">{reminder.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(reminder.reminderDate).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteReminderMutation.mutate(reminder.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
