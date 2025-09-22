"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Loader2, UserPlus, Mail, Lock, Phone, User } from "lucide-react";

const signUpSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create user account via sign-up API
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
          role: "Staff", // Default role
        }),
      });

      const signupResult = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(signupResult.error || "Failed to create account");
      }

      // 2. Automatically sign in the user after successful registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      if (signInResult?.ok) {
        // Redirect based on user role
        router.push("/staff-dashboard");
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100 mb-6">
            <UserPlus className="h-8 w-8 text-gray-700" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-base text-gray-600">
            Join us today and get started in minutes
          </p>
        </div>

        {/* Sign-up Card */}
        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="pt-8 pb-6 px-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          First Name
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="John"
                              className="pl-10 h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-600 text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Last Name
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Doe"
                              className="pl-10 h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-600 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            className="pl-10 h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Phone Number
                        <span className="text-gray-400 font-normal"> (Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="pl-10 h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10 h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            type="password"
                            placeholder="Confirm your password"
                            className="pl-10 h-12 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-600 text-xs" />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium text-base transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="font-medium text-gray-900 hover:text-gray-700 underline underline-offset-2 transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}