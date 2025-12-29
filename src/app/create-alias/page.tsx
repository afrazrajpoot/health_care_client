"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

const aliasSchema = z.object({
  email: z.string().email("Invalid email address"),
  alias: z.string().email("Invalid alias format. Must be a valid email address"),
});

type AliasFormValues = z.infer<typeof aliasSchema>;

interface AliasList {
  email: string;
  aliases: string[];
}

export default function CreateAliasPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAliases, setIsLoadingAliases] = useState(false);
  const [aliasList, setAliasList] = useState<AliasList | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const { data: session } = useSession();

  const form = useForm<AliasFormValues>({
    resolver: zodResolver(aliasSchema),
    defaultValues: {
      email: "",
      alias: "",
    },
  });

  const onSubmit = async (data: AliasFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/create-alias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          alias: data.alias,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Combine error and details for better error messages
        const errorMessage = result.details 
          ? `${result.error}: ${result.details}`
          : result.error || "Failed to create alias";
        throw new Error(errorMessage);
      }

      // Success
      toast.success(result.message || "Alias created successfully!", {
        duration: 5000,
        position: "top-right",
      });
      setSuccess(result.message);
      form.reset();
      
      // Refresh alias list if we were viewing this user's aliases
      if (aliasList && aliasList.email === data.email) {
        fetchAliases(data.email);
      }
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred while creating the alias";
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAliases = async (email: string) => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoadingAliases(true);
    setError(null);
    setAliasList(null);

    try {
      const response = await fetch(`/api/create-alias?email=${encodeURIComponent(email)}`);
      const result = await response.json();

      if (!response.ok) {
        // Combine error and details for better error messages
        const errorMessage = result.details 
          ? `${result.error}: ${result.details}`
          : result.error || "Failed to fetch aliases";
        throw new Error(errorMessage);
      }

      setAliasList({
        email: result.email,
        aliases: result.aliases || [],
      });
      toast.success("Aliases loaded successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred while fetching aliases";
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setIsLoadingAliases(false);
    }
  };

  const handleSearch = () => {
    if (searchEmail.trim()) {
      fetchAliases(searchEmail.trim());
    }
  };

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Google Workspace Alias Manager</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create and manage email aliases for Google Workspace users
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Alias Card */}
            <Card className="border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Create New Alias
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-6 px-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    {/* User Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="email"
                                placeholder="user@example.com"
                                className="pl-10 h-11"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Alias Email */}
                    <FormField
                      control={form.control}
                      name="alias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alias Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="email"
                                placeholder="alias@example.com"
                                className="pl-10 h-11"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Error */}
                    {error && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Success */}
                    {success && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          {success}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-br from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Alias
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* View Aliases Card */}
            <Card className="border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  View Existing Aliases
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-6 px-6">
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        className="pl-10 h-11"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSearch();
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleSearch}
                      disabled={isLoadingAliases || !searchEmail.trim()}
                      className="h-11 px-4 bg-gradient-to-br from-blue-500 to-violet-500 text-white"
                    >
                      {isLoadingAliases ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Alias List */}
                  {aliasList && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-700">
                          Primary Email:
                        </p>
                        <p className="text-base font-medium text-gray-900 mt-1">
                          {aliasList.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Aliases ({aliasList.aliases.length}):
                        </p>
                        {aliasList.aliases.length > 0 ? (
                          <ul className="space-y-2">
                            {aliasList.aliases.map((alias, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
                              >
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{alias}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            No aliases found for this user
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAliases(aliasList.email)}
                        disabled={isLoadingAliases}
                        className="mt-3 w-full"
                      >
                        {isLoadingAliases ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-3 w-3" />
                        )}
                        Refresh
                      </Button>
                    </div>
                  )}

                  {/* Empty State */}
                  {!aliasList && !isLoadingAliases && (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">
                        Enter an email address to view aliases
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    How it works
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>Enter the user's primary email address and the alias you want to create</li>
                    <li>Both emails must be valid email addresses</li>
                    <li>The alias domain must match your Google Workspace domain (e.g., @doclatch.com)</li>
                    <li><strong>Important:</strong> The user email must be a user in your Google Workspace, not a Gmail account</li>
                    <li>The user will receive emails sent to both the primary email and the alias</li>
                    <li>Use the search function to view all existing aliases for a user</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements Card */}
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    Common Issues
                  </h3>
                  <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                    <li><strong>"Invalid email or User ID":</strong> The user must exist in your Google Workspace. Gmail accounts (@gmail.com) cannot be used.</li>
                    <li><strong>"User not found":</strong> Create the user in Google Workspace Admin Console first, then add aliases.</li>
                    <li><strong>"Permission denied":</strong> Ensure domain-wide delegation is configured with the correct admin email.</li>
                    <li><strong>"Invalid alias domain":</strong> Aliases must use your workspace domain (e.g., @doclatch.com), not external domains.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  );
}

