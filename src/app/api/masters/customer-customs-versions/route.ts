import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/auth-guards";
import { buildErrorResponse } from "@/lib/api/error";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  applyToAllCustomers: z.boolean().optional().default(false),
  customerId: z.string().optional().nullable(),
  filingCountryCustomsId: z.string().min(1),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
}).refine(
  (data) => data.applyToAllCustomers || data.customerId,
  { message: "Either applyToAllCustomers must be true or customerId must be provided" }
);

// GET - List all customer customs versions
export const GET = withAuthenticatedRoute(async ({ ctx, req, requestId }) => {
  if (!ctx.isPlatformAdmin) {
    return buildErrorResponse(403, "FORBIDDEN", "Platform Admin access required.", undefined, requestId);
  }

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  const where = customerId ? { customerId } : {};

  const versions = await db.filingCustomerCustomsVersion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      countryCustomsVersion: true,
    },
  });

  return NextResponse.json({ versions, requestId });
});

// POST - Create new customer customs version mapping
export const POST = withAuthenticatedRoute(async ({ req, ctx, requestId }) => {
  if (!ctx.isPlatformAdmin) {
    return buildErrorResponse(403, "FORBIDDEN", "Platform Admin access required.", undefined, requestId);
  }

  try {
    const body = await req.json();
    const validated = createSchema.parse(body);

    // Check for duplicate (only if not applying to all customers)
    if (!validated.applyToAllCustomers && validated.customerId) {
      const existing = await db.filingCustomerCustomsVersion.findFirst({
        where: {
          customerId: validated.customerId,
          filingCountryCustomsId: validated.filingCountryCustomsId,
        },
      });

      if (existing) {
        return buildErrorResponse(409, "DUPLICATE", "This customer is already mapped to this version.", undefined, requestId);
      }
    }

    // Verify the country customs version exists
    const countryVersion = await db.filingCountryCustomsVersion.findUnique({
      where: { id: validated.filingCountryCustomsId },
    });

    if (!countryVersion) {
      return buildErrorResponse(404, "NOT_FOUND", "Country customs version not found.", undefined, requestId);
    }

    const version = await db.filingCustomerCustomsVersion.create({
      data: {
        ...validated,
        createdBy: ctx.email,
      },
      include: {
        countryCustomsVersion: true,
      },
    });

    return NextResponse.json({ version, requestId }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return buildErrorResponse(400, "VALIDATION_ERROR", "Invalid input", err.issues, requestId);
    }
    throw err;
  }
}, { write: true });
