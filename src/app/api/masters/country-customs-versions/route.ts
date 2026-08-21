import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/auth-guards";
import { buildErrorResponse } from "@/lib/api/error";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  country: z.string().min(2).max(3),
  procedureCode: z.string().min(1),
  release: z.string().min(1),
  validFrom: z.string().datetime().or(z.date()),
  validTo: z.string().datetime().or(z.date()).optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

// GET - List all country customs versions
export const GET = withAuthenticatedRoute(async ({ ctx, requestId }) => {
  if (!ctx.isPlatformAdmin) {
    return buildErrorResponse(403, "FORBIDDEN", "Platform Admin access required.", undefined, requestId);
  }

  const versions = await db.filingCountryCustomsVersion.findMany({
    orderBy: [
      { country: "asc" },
      { procedureCode: "asc" },
      { validFrom: "desc" },
    ],
    include: {
      _count: {
        select: { customerVersions: true },
      },
    },
  });

  return NextResponse.json({ versions, requestId });
});

// POST - Create new country customs version
export const POST = withAuthenticatedRoute(async ({ req, ctx, requestId }) => {
  if (!ctx.isPlatformAdmin) {
    return buildErrorResponse(403, "FORBIDDEN", "Platform Admin access required.", undefined, requestId);
  }

  try {
    const body = await req.json();
    const validated = createSchema.parse(body);

    // Check for duplicate
    const existing = await db.filingCountryCustomsVersion.findUnique({
      where: {
        country_procedureCode_release: {
          country: validated.country,
          procedureCode: validated.procedureCode,
          release: validated.release,
        },
      },
    });

    if (existing) {
      return buildErrorResponse(409, "DUPLICATE", "This version already exists.", undefined, requestId);
    }

    const version = await db.filingCountryCustomsVersion.create({
      data: {
        ...validated,
        validFrom: new Date(validated.validFrom),
        validTo: validated.validTo ? new Date(validated.validTo) : null,
        createdBy: ctx.email,
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

