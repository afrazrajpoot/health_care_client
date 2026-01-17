
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Phone, User, Plus, Briefcase } from "lucide-react";
import AssignTaskToStaffModal from "@/components/staff-components/AssignTaskToStaffModal";
import Link from "next/link";

interface StaffMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
  image: string | null;
  phoneNumber?: string | null;
}

export default function ManageStaffPage() {
  const { data: session } = useSession();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch("/api/staff");
        if (response.ok) {
          const data = await response.json();
          setStaffMembers(data.staff || []);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchStaff();
    }
  }, [session]);

  const handleAssignClick = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsAssignModalOpen(true);
  };

  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Staff</h1>
            <p className="text-gray-500 mt-1">
              Manage your team and assign tasks directly.
            </p>
          </div>
          <Link href="/add-staff">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Add New Staff
            </Button>
          </Link>
        </div>

        {staffMembers.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No staff members found
              </h3>
              <p className="text-gray-500 max-w-sm mb-6">
                You haven't added any staff members yet. Add staff to help manage your patients and tasks.
              </p>
              <Link href="/add-staff">
                <Button variant="outline">Add Staff Member</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffMembers.map((staff) => (
              <Card
                key={staff.id}
                className="overflow-hidden hover:shadow-md transition-shadow border-gray-200"
              >
                <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                        <AvatarImage src={staff.image || ""} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">
                          {(staff.firstName?.[0] || staff.email?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {staff.firstName} {staff.lastName}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="secondary" className="text-xs font-normal bg-white border border-gray-200 text-gray-600">
                                {staff.role || "Staff"}
                            </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="truncate">{staff.email}</span>
                    </div>
                    {staff.phoneNumber && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-gray-500" />
                        </div>
                        <span>{staff.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button 
                        className="w-full bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        onClick={() => handleAssignClick(staff)}
                    >
                        Assign Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedStaff && (
          <AssignTaskToStaffModal
            open={isAssignModalOpen}
            onOpenChange={setIsAssignModalOpen}
            staffId={selectedStaff.id}
            staffName={selectedStaff.firstName || selectedStaff.email || "Staff"}
          />
        )}
      </div>
    </LayoutWrapper>
  );
}
