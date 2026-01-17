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
    tagTypes: ["FailedDocuments", "Staff"],
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
    }),
});

export const {
    useGetFailedDocumentsQuery,
    useGetStaffQuery,
    useDeleteFailedDocumentMutation,
} = staffApi;
