-- CreateTable
CREATE TABLE "FilingCountryCustomsVersion" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "procedureCode" TEXT NOT NULL,
    "release" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "FilingCountryCustomsVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilingCustomerCustomsVersion" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "filingCountryCustomsId" TEXT NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "FilingCustomerCustomsVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FilingCountryCustomsVersion_country_procedureCode_release_key" ON "FilingCountryCustomsVersion"("country", "procedureCode", "release");

-- CreateIndex
CREATE INDEX "FilingCountryCustomsVersion_country_procedureCode_idx" ON "FilingCountryCustomsVersion"("country", "procedureCode");

-- CreateIndex
CREATE INDEX "FilingCountryCustomsVersion_isActive_idx" ON "FilingCountryCustomsVersion"("isActive");

-- CreateIndex
CREATE INDEX "FilingCountryCustomsVersion_validFrom_validTo_idx" ON "FilingCountryCustomsVersion"("validFrom", "validTo");

-- CreateIndex
CREATE UNIQUE INDEX "FilingCustomerCustomsVersion_customerId_filingCountryCustoms_key" ON "FilingCustomerCustomsVersion"("customerId", "filingCountryCustomsId");

-- CreateIndex
CREATE INDEX "FilingCustomerCustomsVersion_customerId_idx" ON "FilingCustomerCustomsVersion"("customerId");

-- CreateIndex
CREATE INDEX "FilingCustomerCustomsVersion_filingCountryCustomsId_idx" ON "FilingCustomerCustomsVersion"("filingCountryCustomsId");

-- CreateIndex
CREATE INDEX "FilingCustomerCustomsVersion_isActive_idx" ON "FilingCustomerCustomsVersion"("isActive");

-- AddForeignKey
ALTER TABLE "FilingCustomerCustomsVersion" ADD CONSTRAINT "FilingCustomerCustomsVersion_filingCountryCustomsId_fkey" FOREIGN KEY ("filingCountryCustomsId") REFERENCES "FilingCountryCustomsVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
