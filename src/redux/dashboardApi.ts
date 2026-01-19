import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { handleEncryptedResponse } from "@/lib/decrypt";

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

export const dashboardApi = createApi({
    reducerPath: "dashboardApi",
    baseQuery: baseQueryWithDecryption,
    tagTypes: ["Tasks", "Patients", "TreatmentHistory"],
    // Global cache configuration
    keepUnusedDataFor: 300, // Keep cached data for 5 minutes (increased from 60s)
    refetchOnMountOrArgChange: false, // Don't refetch on component mount if data exists
    refetchOnFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: true, // Only refetch on reconnect
    endpoints: (builder) => ({
        getRecentPatients: builder.query({
            query: (mode = "wc") => ({
                url: "/get-recent-patients",
                params: { mode },
            }),
            providesTags: ["Patients"],
            keepUnusedDataFor: 120, // Keep recent patients cached for 2 minutes
        }),
        getTasks: builder.query({
            query: ({ patientName, claim, dob, documentIds, page = 1, pageSize = 5, status, type, mode = "wc" }) => {
                const params = new URLSearchParams({
                    mode,
                    page: page.toString(),
                    pageSize: pageSize.toString(),
                });

                if (patientName) params.append("patient_name", patientName);
                if (dob) params.append("dob", dob);
                if (claim && claim !== "Not specified") params.append("claim", claim);
                if (documentIds && Array.isArray(documentIds)) {
                    documentIds.forEach((id) => params.append("documentId", id));
                }
                if (status) params.append("status", status);
                if (type && type !== "all") params.append("type", type);

                return { url: `/tasks?${params.toString()}` };
            },
            providesTags: ["Tasks"],
            keepUnusedDataFor: 90, // Keep tasks cached for 90 seconds
        }),

        getPatientRecommendations: builder.query({
            query: ({ patientName, claimNumber, dob, physicianId, mode }) => {
                const params = new URLSearchParams();
                if (patientName) params.append("patientName", patientName);
                if (claimNumber) params.append("claimNumber", claimNumber);
                if (dob) params.append("dob", dob);
                if (physicianId) params.append("physicianId", physicianId);
                if (mode) params.append("mode", mode);
                return `/dashboard/recommendation?${params.toString()}`;
            },
            keepUnusedDataFor: 60, // Keep recommendations cached for 60 seconds
        }),
        getDocument: builder.query({
            query: (params) => ({
                url: "/documents/get-document",
                params,
            }),
            providesTags: ["Patients"],
            keepUnusedDataFor: 120, // Keep document data cached for 2 minutes
        }),
        verifyDocument: builder.mutation({
            query: (params) => ({
                url: "/verify-document",
                method: "POST",
                params,
            }),
            invalidatesTags: ["Patients", "TreatmentHistory"],
        }),
        updateTask: builder.mutation({
            query: ({ taskId, ...patch }) => ({
                url: `/tasks/${taskId}`,
                method: "PATCH",
                body: patch,
            }),
            invalidatesTags: ["Tasks"],
        }),
        addManualTask: builder.mutation({
            query: (data) => ({
                url: "/add-manual-task",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Tasks"],
        }),
        generateIntakeLink: builder.mutation({
            query: (data) => ({
                url: "/generate-link",
                method: "POST",
                body: data,
            }),
        }),
        getTreatmentHistory: builder.query({
            query: ({ patientName, dob, claimNumber, physicianId }) => {
                const params = new URLSearchParams({
                    patient_name: patientName,
                    physicianId: physicianId
                });
                if (dob) params.append("dob", dob);
                if (claimNumber && claimNumber !== "Not specified") {
                    params.append("claim_number", claimNumber);
                }
                return { url: `/treatment-history?${params.toString()}` };
            },
            providesTags: ["TreatmentHistory"],
            keepUnusedDataFor: 120,
        }),
    }),
});

export const {
    useGetRecentPatientsQuery,
    useLazyGetRecentPatientsQuery,
    useGetTasksQuery,
    useLazyGetTasksQuery,

    useGetPatientRecommendationsQuery,
    useLazyGetPatientRecommendationsQuery,
    useGetDocumentQuery,
    useLazyGetDocumentQuery,
    useVerifyDocumentMutation,
    useUpdateTaskMutation,
    useAddManualTaskMutation,
    useGenerateIntakeLinkMutation,
    useGetTreatmentHistoryQuery,
    useLazyGetTreatmentHistoryQuery,
} = dashboardApi;
