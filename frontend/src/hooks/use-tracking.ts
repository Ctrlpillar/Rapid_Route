import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useUserSettings() {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      await delay(500);
      return {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        phone: "+1 (555) 123-4567",
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      };
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newSettings: Record<string, unknown>) => {
      await delay(800);
      return newSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user-settings"], (old: Record<string, unknown>) => ({
        ...old,
        ...data,
      }));
      toast({
        title: "Settings updated",
        description: "Your account preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useSubscribeEmail() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (email: string) => {
      await delay(1000);
      if (!email.includes("@")) throw new Error("Invalid email");
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Subscribed!",
        description: "You've successfully subscribed to updates.",
      });
    },
  });
}
