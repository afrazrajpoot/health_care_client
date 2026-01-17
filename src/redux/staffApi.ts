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

export const staffApi = createApi({
    reducerPath: "staffApi",
    baseQuery: baseQueryWithDecryption,
    tagTypes: ["Tasks", "Patients", "Intakes", "FailedDocuments"],
    endpoints: (builder) => ({
        getRecentPatients: builder.query({
            query: (search = "") => ({
                url: "/get-recent-patients",
                params: { mode: "wc", search: search.trim() },
            }),
            providesTags: ["Patients"],
        }),
        getTasks: builder.query({
            query: ({ patientName, claim, documentIds, page = 1, pageSize = 10, status, type }) => {
                const params = new URLSearchParams({
                    mode: "wc",
                    page: page.toString(),
                    pageSize: pageSize.toString(),
                    search: patientName,
                });

                if (claim && claim !== "Not specified") {
                    params.append("claim", claim);
                }

                if (documentIds && Array.isArray(documentIds)) {
                    documentIds.forEach((id) => params.append("documentId", id));
                }

                if (status) {
                    params.append("status", status);
                }

                if (type && type !== "all") {
                    params.append("type", type);
                }

                return { url: `/tasks?${params.toString()}` };
            },
            providesTags: ["Tasks"],
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
        }),
        getFailedDocuments: builder.query({
            query: () => "/get-failed-document",
            providesTags: ["FailedDocuments"],
        }),
        updateTask: builder.mutation({
            query: ({ taskId, ...patch }) => ({
                url: `/tasks/${taskId}`,
                method: "PATCH",
                body: patch,
            }),
            invalidatesTags: ["Tasks"],
        }),
        updateFailedDocument: builder.mutation({
            query: (data) => ({
                url: "/documents/update-fail-document",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["FailedDocuments"],
        }),
        addManualTask: builder.mutation({
            query: (data) => ({
                url: "/add-manual-task",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Tasks"],
        }),
        extractDocuments: builder.mutation({
            query: ({ physicianId, userId, formData }) => ({
                url: `/documents/extract-documents?physicianId=${physicianId}&userId=${userId}`,
                method: "POST",
                body: formData,
            }),
        }),
        getStaff: builder.query({
            query: () => "/staff",
            providesTags: ["Staff" as any],
        }),
        getPatientRecommendations: builder.query({
            query: (patientName) => `/dashboard/recommendation?patientName=${encodeURIComponent(patientName)}`,
        }),
        deleteFailedDocument: builder.mutation({
            query: (docId) => ({
                url: `/get-failed-document/${docId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["FailedDocuments"],
        }),
        splitAndProcessDocument: builder.mutation({
            query: (data) => ({
                url: "/documents/split-and-process-document",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["Tasks", "FailedDocuments"],
        }),
        generateIntakeLink: builder.mutation({
            query: (data) => ({
                url: "/generate-link",
                method: "POST",
                body: data,
            }),
        }),
        getDocumentPreview: builder.query({
            query: (blobPath) => ({
                url: `/documents/preview/${encodeURIComponent(blobPath)}`,
                responseHandler: (response: Response) => response.blob(),
            }),
        }),
    }),
});

export const {
    useGetRecentPatientsQuery,
    useGetTasksQuery,
    useGetPatientIntakesQuery,
    useGetPatientIntakeUpdateQuery,
    useGetFailedDocumentsQuery,
    useUpdateTaskMutation,
    useUpdateFailedDocumentMutation,
    useAddManualTaskMutation,
    useExtractDocumentsMutation,
    useGetStaffQuery,
    useGetPatientRecommendationsQuery,
    useDeleteFailedDocumentMutation,
    useSplitAndProcessDocumentMutation,
    useGenerateIntakeLinkMutation,
    useLazyGetDocumentPreviewQuery,
} = staffApi;
