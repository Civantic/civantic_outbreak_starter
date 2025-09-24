import { NextResponse } from "next/server"

export async function GET() {
  const curated = [
  ]
  return NextResponse.json({ data: curated, note: "Manual curation v1. Add items directly in this route.", fetchedAt: new Date().toISOString() })
}
