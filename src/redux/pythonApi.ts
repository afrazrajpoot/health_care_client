import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { handleEncryptedResponse } from "@/lib/decrypt";

const baseQuery = fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`,
});

const baseQueryWithDecryption = async (args: any, api: any, extraOptions: any) => {
    const result = await baseQuery(args, api, extraOptions);
    // For blob responses (previews), don't try to decrypt
    if (result.data && !(result.data instanceof Blob)) {
        result.data = handleEncryptedResponse(result.data);
    }
    return result;
};

export const pythonApi = createApi({
    reducerPath: "pythonApi",
    baseQuery: baseQueryWithDecryption,
    tagTypes: ["PythonTasks"],
    endpoints: (builder) => ({
        extractDocuments: builder.mutation({
            query: ({ physicianId, userId, formData }) => ({
                url: `/documents/extract-documents?physicianId=${physicianId}&userId=${userId}`,
                method: "POST",
                body: formData,
            }),
        }),
        splitAndProcessDocument: builder.mutation({
            query: (data) => ({
                url: "/documents/split-and-process-document",
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
        updateFailedDocument: builder.mutation({
            query: (data) => ({
                url: "/documents/update-fail-document",
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const {
    useExtractDocumentsMutation,
    useSplitAndProcessDocumentMutation,
    useLazyGetDocumentPreviewQuery,
    useUpdateFailedDocumentMutation,
} = pythonApi;
