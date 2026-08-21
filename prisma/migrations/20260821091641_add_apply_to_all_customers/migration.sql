-- Check if table exists first, then alter it
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'FilingCustomerCustomsVersion'
    ) THEN
        -- Drop the unique constraint if it exists
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'FilingCustomerCustomsVersion_customerId_filingCountryCustoms_key'
        ) THEN
            ALTER TABLE "FilingCustomerCustomsVersion" 
            DROP CONSTRAINT "FilingCustomerCustomsVersion_customerId_filingCountryCustoms_key";
        END IF;
        
        -- Alter the column to allow NULL
        ALTER TABLE "FilingCustomerCustomsVersion" 
        ALTER COLUMN "customerId" DROP NOT NULL;
        
        -- Add new column
        ALTER TABLE "FilingCustomerCustomsVersion" 
        ADD COLUMN IF NOT EXISTS "applyToAllCustomers" BOOLEAN NOT NULL DEFAULT false;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS "FilingCustomerCustomsVersion_applyToAllCustomers_idx" 
        ON "FilingCustomerCustomsVersion"("applyToAllCustomers");
    END IF;
END$$;

