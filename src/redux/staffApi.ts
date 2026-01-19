import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { handleEncryptedResponse } from "@/lib/decrypt";
import { dashboardApi } from "./dashboardApi";

const baseQuery = fetchBaseQuery({
    baseUrl: "/api",
});

const baseQueryWithDecryption = async (args: any, api: any, extraOptions: any) => {
    const result = await baseQuery(args, api, extraOptions);
    if (result.data) {
        result.data = handleEncryptedResponse(result.data);
    }
    return result;
};

export const staffApi = createApi({
    reducerPath: "staffApi",
    baseQuery: baseQueryWithDecryption,
    tagTypes: ["FailedDocuments", "Staff", "Intakes"],
    endpoints: (builder) => ({
        getFailedDocuments: builder.query({
            query: () => "/get-failed-document",
            providesTags: ["FailedDocuments"],
        }),
        getStaff: builder.query({
            query: () => "/staff",
            providesTags: ["Staff"],
        }),
        deleteFailedDocument: builder.mutation({
            query: (docId) => ({
                url: `/get-failed-document/${docId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["FailedDocuments"],
        }),
        getPatientIntakeUpdate: builder.query({
            query: ({ patientName, dob, claimNumber }) => {
                const params = new URLSearchParams({ patientName });
                if (dob) params.append("dob", dob.split("T")[0]);
                if (claimNumber && claimNumber !== "Not specified") {
                    params.append("claimNumber", claimNumber);
                }
                return { url: `/patient-intake-update?${params.toString()}` };
            },
            providesTags: ["Intakes"],
            keepUnusedDataFor: 120,
        }),
        updatePatientIntake: builder.mutation({
            query: (data) => ({
                url: "/patient-intake-update",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Intakes"],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    // Also invalidate tasks and patients in dashboardApi
                    dispatch(dashboardApi.util.invalidateTags(["Tasks", "Patients"]));
                } catch (error) {
                    console.error("Failed to invalidate dashboard tags after intake update:", error);
                }
            },
        }),
        getPatientIntakes: builder.query({
            query: ({ patientName, dob, claimNumber }) => {
                const params = new URLSearchParams({ patientName });
                if (dob) params.append("dob", dob.split("T")[0]);
                if (claimNumber && claimNumber !== "Not specified") {
                    params.append("claimNumber", claimNumber);
                }
                return { url: `/patient-intakes?${params.toString()}` };
            },
            providesTags: ["Intakes"],
            keepUnusedDataFor: 120,
        }),
    }),
});

export const {
    useGetFailedDocumentsQuery,
    useGetStaffQuery,
    useDeleteFailedDocumentMutation,
    useGetPatientIntakeUpdateQuery,
    useUpdatePatientIntakeMutation,
    useGetPatientIntakesQuery,
} = staffApi;
