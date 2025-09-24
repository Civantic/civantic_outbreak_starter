import { NextResponse } from "next/server"
export async function GET() {
  return NextResponse.json({ hasCdcToken: Boolean(process.env.CDC_APP_TOKEN) })
}
