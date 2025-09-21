// redux/employee-api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const employeeApi = createApi({
  reducerPath: "employeeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      return headers;
    },
  }),
  tagTypes: ["Employee"],
  endpoints: (builder) => ({
    getEmployee: builder.query({
      query: () => "/employee-profile",
      providesTags: ["Employee"],
    }),
  }),
});

export const { useGetEmployeeQuery } = employeeApi;