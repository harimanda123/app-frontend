import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/auth-guards";
import { buildErrorResponse } from "@/lib/api/error";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { id: string };

const updateSchema = z.object({
  customerId: z.string().min(1).optional(),
  filingCountryCustomsId: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET - Get single customer customs version
export const GET = withAuthenticatedRoute<Params>(async ({ ctx, params, requestId }) => {
  if (!ctx.isPlatformAdmin) {
    return buildErrorResponse(403, "FORBIDDEN", "Platform Admin access required.", undefined, requestId);
  }

  const version = await db.filingCustomerCustomsVersion.findUnique({
    where: { id: params.id },
    include: {
      countryCustomsVersion: true,
    },
  });

  if (!version) {
    return buildErrorResponse(404, "NOT_FOUND", "Version not found.", undefined, requestId);
  }

  return NextResponse.json({ version, requestId });
});

// PATCH - Update customer customs version
export const PATCH = withAuthenticatedRoute<Params>(async ({ req, ctx, params, requestId }) => {
  if (!ctx.isPlatformAdmin) {
    return buildErrorResponse(403, "FORBIDDEN", "Platform Admin access required.", undefined, requestId);
  }

  try {
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const existing = await db.filingCustomerCustomsVersion.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return buildErrorResponse(404, "NOT_FOUND", "Version not found.", undefined, requestId);
    }

    const version = await db.filingCustomerCustomsVersion.update({
      where: { id: params.id },
      data: {
        ...validated,
        updatedBy: ctx.email,
      },
      include: {
        countryCustomsVersion: true,
      },
    });

    return NextResponse.json({ version, requestId });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return buildErrorResponse(400, "VALIDATION_ERROR", "Invalid input", err.issues, requestId);
    }
    throw err;
  }
}, { write: true });

// DELETE - Delete customer customs version
export const DELETE = withAuthenticatedRoute<Params>(async ({ ctx, params, requestId }) => {
  if (!ctx.isPlatformAdmin) {
    return buildErrorResponse(403, "FORBIDDEN", "Platform Admin access required.", undefined, requestId);
  }

  const existing = await db.filingCustomerCustomsVersion.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return buildErrorResponse(404, "NOT_FOUND", "Version not found.", undefined, requestId);
  }

  await db.filingCustomerCustomsVersion.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true, requestId });
}, { write: true });
