"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  UserPlus,
  Mail,
  Lock,
  Phone,
  User,
  Briefcase,
  ArrowLeft,
  Shield,
  Users,
  Key,
  Info,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

// ✅ Zod schema
const addStaffSchema: any = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["Attorney", "Staff", "Physician", "SubAdmin"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type AddStaffFormValues = z.infer<typeof addStaffSchema>;

export default function AddStaffPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const form = useForm<AddStaffFormValues>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      role: "Staff",
    },
  });

  const onSubmit = async (data: AddStaffFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const signupResponse = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber || "",
          password: data.password,
          role: data.role,
          physicianId: session?.user?.id,
        }),
      });

      const signupResult = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(signupResult.error || "Failed to create account");
      }

      toast.success("Staff member added successfully!", {
        duration: 5000,
        position: "top-right",
      });
      form.reset();
    } catch (error: any) {
      setError(error.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Wave Design */}
          <div className="relative mb-10">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-aqua-100 rounded-full opacity-30 blur-xl"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-cyan-100 rounded-full opacity-30 blur-xl"></div>

            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-aqua-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full bg-white shadow-sm hover:bg-aqua-50 transition-colors border border-aqua-100"
                  >
                    <ArrowLeft className="h-5 w-5 text-aqua-600" />
                  </Button>
                  <div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-[#33c7d8] to-[#53d1df] rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold text-aqua-600">
                        Add New Team Member
                      </h1>
                    </div>
                    <p className="text-cyan-700 mt-2 max-w-2xl">
                      Fill in the details below to add a new staff member to your organization.
                      They'll receive an email with login instructions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 px-4 py-2 bg-aqua-50 rounded-full shadow-sm border border-aqua-100">
                  <Shield className="h-5 w-5 text-aqua-600" />
                  <span className="text-sm font-medium text-cyan-700">Team Management</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form Card */}
            <Card className="lg:col-span-2 border-0 shadow-2xl rounded-2xl overflow-hidden">
              <div className="h-2 bg-aqua-500"></div>
              <CardHeader className="pb-6 border-b border-aqua-100 bg-aqua-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-[#33c7d8] to-[#53d1df] rounded-xl shadow-lg">
                      <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-cyan-900">
                        Staff Information Form
                      </CardTitle>
                      <CardDescription className="text-cyan-600 mt-1">
                        Complete all fields marked with *
                      </CardDescription>
                    </div>
                  </div>
                  <div className="hidden md:block px-4 py-2 bg-aqua-100 rounded-full">
                    <span className="text-sm font-medium text-cyan-700">Step 1 of 1</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 pb-10 px-6 md:px-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Personal Information Section */}
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-aqua-100 rounded-lg">
                          <User className="h-5 w-5 text-aqua-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-cyan-900">
                          Personal Details
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-cyan-800 flex items-center">
                                <span className="mr-1">First Name</span>
                                <span className="text-aqua-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-aqua-400 group-focus-within:text-aqua-500 transition-colors" />
                                  </div>
                                  <Input
                                    placeholder="Enter first name"
                                    className="pl-10 h-12 rounded-lg border-aqua-200 bg-white focus:border-aqua-400 focus:ring-aqua-400/20 transition-all duration-200"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-sm text-rose-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-cyan-800 flex items-center">
                                <span className="mr-1">Last Name</span>
                                <span className="text-aqua-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-aqua-400 group-focus-within:text-aqua-500 transition-colors" />
                                  </div>
                                  <Input
                                    placeholder="Enter last name"
                                    className="pl-10 h-12 rounded-lg border-aqua-200 bg-white focus:border-aqua-400 focus:ring-aqua-400/20 transition-all duration-200"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-sm text-rose-500" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-cyan-800 flex items-center">
                                <span className="mr-1">Email Address</span>
                                <span className="text-aqua-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-aqua-400 group-focus-within:text-aqua-500 transition-colors" />
                                  </div>
                                  <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="pl-10 h-12 rounded-lg border-aqua-200 bg-white focus:border-aqua-400 focus:ring-aqua-400/20 transition-all duration-200"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-sm text-rose-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-cyan-800">
                                Phone Number
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-aqua-400 group-focus-within:text-aqua-500 transition-colors" />
                                  </div>
                                  <Input
                                    type="tel"
                                    placeholder="+1 (555) 123-4567"
                                    className="pl-10 h-12 rounded-lg border-aqua-200 bg-white focus:border-aqua-400 focus:ring-aqua-400/20 transition-all duration-200"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-sm text-rose-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Account Information Section */}
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-cyan-100 rounded-lg">
                          <Key className="h-5 w-5 text-cyan-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-cyan-900">
                          Account Settings
                        </h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-cyan-800 flex items-center">
                              <span className="mr-1">Team Role</span>
                              <span className="text-aqua-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Briefcase className="h-5 w-5 text-aqua-400 group-focus-within:text-aqua-500 transition-colors" />
                                </div>
                                <select
                                  {...field}
                                  className="pl-10 h-12 w-full rounded-lg border border-aqua-200 bg-white focus:border-aqua-400 focus:ring-aqua-400/20 transition-all duration-200 appearance-none pr-10 cursor-pointer"
                                >
                                  <option value="" className="text-aqua-400">Select a role</option>
                                  <option value="Attorney" className="text-cyan-900">Attorney</option>
                                  <option value="Staff" className="text-cyan-900">Staff</option>
                                  <option value="Physician" className="text-cyan-900">Physician</option>
                                  <option value="SubAdmin" className="text-cyan-900">Sub Admin</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  <div className="w-3 h-3 border-r-2 border-b-2 border-aqua-400 transform rotate-45"></div>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="text-sm text-rose-500" />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-cyan-800 flex items-center">
                                <span className="mr-1">Password</span>
                                <span className="text-aqua-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-aqua-400 group-focus-within:text-aqua-500 transition-colors" />
                                  </div>
                                  <Input
                                    type="password"
                                    placeholder="Minimum 6 characters"
                                    className="pl-10 h-12 rounded-lg border-aqua-200 bg-white focus:border-aqua-400 focus:ring-aqua-400/20 transition-all duration-200"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-sm text-rose-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-cyan-800 flex items-center">
                                <span className="mr-1">Confirm Password</span>
                                <span className="text-aqua-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-aqua-400 group-focus-within:text-aqua-500 transition-colors" />
                                  </div>
                                  <Input
                                    type="password"
                                    placeholder="Re-enter your password"
                                    className="pl-10 h-12 rounded-lg border-aqua-200 bg-white focus:border-aqua-400 focus:ring-aqua-400/20 transition-all duration-200"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-sm text-rose-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <Alert variant="destructive" className="rounded-lg border-rose-200 bg-rose-50">
                        <AlertDescription className="text-rose-800 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Submit Button */}
                    <div className="pt-6">
                      <Button
                        type="submit"
                        className="w-full h-14 bg-gradient-to-br from-[#33c7d8] to-[#53d1df] hover:opacity-90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold relative overflow-hidden group"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-3 h-5 w-5" />
                            Add to Team
                          </>
                        )}
                      </Button>
                      <p className="text-center text-sm text-cyan-600 mt-4">
                        Upon submission, an invitation email will be sent to the staff member
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Side Information Panel */}
            <div className="space-y-6">
              {/* Role Information Card */}
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                <div className="h-2 bg-aqua-500"></div>
                <CardHeader className="bg-aqua-50/50">
                  <CardTitle className="text-lg font-bold text-cyan-900 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-aqua-500" />
                    Role Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-aqua-50 rounded-xl border border-aqua-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-cyan-900">Attorney</h4>
                      </div>
                      <p className="text-sm text-cyan-700">
                        Full case access, document management, client communication, and legal operations
                      </p>
                    </div>

                    <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Users className="h-4 w-4 text-cyan-600" />
                        </div>
                        <h4 className="font-semibold text-cyan-900">Staff</h4>
                      </div>
                      <p className="text-sm text-cyan-700">
                        Administrative tasks, scheduling, basic data entry, and support functions
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <User className="h-4 w-4 text-aqua-600" />
                        </div>
                        <h4 className="font-semibold text-cyan-900">Physician</h4>
                      </div>
                      <p className="text-sm text-cyan-700">
                        Medical review, consultation access, patient evaluation, and health data permissions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips Card */}
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                <div className="h-2 bg-cyan-500"></div>
                <CardHeader className="bg-cyan-50/50">
                  <CardTitle className="text-lg font-bold text-cyan-900 flex items-center">
                    <Info className="h-5 w-5 mr-2 text-cyan-500" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {[
                      "Double-check email addresses for accuracy",
                      "Assign roles based on actual responsibilities",
                      "Use secure passwords (minimum 6 characters)",
                      "Staff can reset passwords after first login",
                      "Review permissions before finalizing"
                    ].map((tip, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-aqua-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-medium text-aqua-600">{index + 1}</span>
                        </div>
                        <span className="text-sm text-cyan-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Support Card */}
              <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-aqua-50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#33c7d8] to-[#53d1df] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-cyan-900 mb-2">Need Help?</h3>
                    <p className="text-sm text-cyan-700 mb-4">
                      Contact your system administrator for role assignment questions
                    </p>
                    <Button
                      variant="outline"
                      className="border-aqua-300 text-aqua-600 hover:bg-aqua-50 w-full"
                    >
                      Get Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-cyan-600">
              All staff members will be subject to our organization's privacy policy and terms of service
            </p>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}