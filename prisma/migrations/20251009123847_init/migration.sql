-- CreateTable
CREATE TABLE "public"."FailDocs" (
    "id" TEXT NOT NULL,
    "reasson" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,

    CONSTRAINT "FailDocs_pkey" PRIMARY KEY ("id")
);
