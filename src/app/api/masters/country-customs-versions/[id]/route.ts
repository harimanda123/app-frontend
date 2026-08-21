import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/auth-guards";
import { buildErrorResponse } from "@/lib/api/error";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { id: string };

const updateSchema = z.object({
  country: z.string().min(2).max(3).optional(),
  procedureCode: z.string().min(1).optional(),
  release: z.string().min(1).optional(),
  validFrom: z.string().datetime().or(z.date()).optional(),
  validTo: z.string().datetime().or(z.date()).optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET - Get single country customs version
export const GET = withAuthenticatedRoute<Params>(async ({ ctx, params, requestId }) => {
  if (!ctx.isPlatformAdmin) {
    return buildErrorResponse(403, "FORBIDDEN", "Platform Admin access required.", undefined, requestId);
  }

  const version = await db.filingCountryCustomsVersion.findUnique({
    where: { id: params.id },
    include: {
      customerVersions: {
        include: {
          countryCustomsVersion: true,
        },
      },
    },
  });

  if (!version) {
    return buildErrorResponse(404, "NOT_FOUND", "Version not found.", undefined, requestId);
  }

  return NextResponse.json({ version, requestId });
});

// PATCH - Update country customs version
export const PATCH = withAuthenticatedRoute<Params>(async ({ req, ctx, params, requestId }) => {
  if (!ctx.isPlatformAdmin) {
    return buildErrorResponse(403, "FORBIDDEN", "Platform Admin access required.", undefined, requestId);
  }

  try {
    const body = await req.json();
    const validated = updateSchema.parse(body);

    const existing = await db.filingCountryCustomsVersion.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return buildErrorResponse(404, "NOT_FOUND", "Version not found.", undefined, requestId);
    }

    const version = await db.filingCountryCustomsVersion.update({
      where: { id: params.id },
      data: {
        ...validated,
        validFrom: validated.validFrom ? new Date(validated.validFrom) : undefined,
        validTo: validated.validTo ? new Date(validated.validTo) : undefined,
        updatedBy: ctx.email,
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

// DELETE - Delete country customs version
export const DELETE = withAuthenticatedRoute<Params>(async ({ ctx, params, requestId }) => {
  if (!ctx.isPlatformAdmin) {
    return buildErrorResponse(403, "FORBIDDEN", "Platform Admin access required.", undefined, requestId);
  }

  const existing = await db.filingCountryCustomsVersion.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: { customerVersions: true },
      },
    },
  });

  if (!existing) {
    return buildErrorResponse(404, "NOT_FOUND", "Version not found.", undefined, requestId);
  }

  if (existing._count.customerVersions > 0) {
    return buildErrorResponse(409, "IN_USE", `Cannot delete version: ${existing._count.customerVersions} customer(s) are using it.`, undefined, requestId);
  }

  await db.filingCountryCustomsVersion.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true, requestId });
}, { write: true });
