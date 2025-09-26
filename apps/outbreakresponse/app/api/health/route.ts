export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    env: {
      CDC_APP_TOKEN: !!process.env.CDC_APP_TOKEN,
      OPENFDA_API_KEY: !!process.env.OPENFDA_API_KEY,
      FDA_DD_AUTH_USER: !!process.env.FDA_DD_AUTH_USER,
      FDA_DD_AUTH_KEY: !!process.env.FDA_DD_AUTH_KEY,
      FDA_ENFORCEMENT_AUTH_USER: !!process.env.FDA_ENFORCEMENT_AUTH_USER,
      FDA_ENFORCEMENT_AUTH_KEY: !!process.env.FDA_ENFORCEMENT_AUTH_KEY,
      NWSS_API_URL: !!process.env.NWSS_API_URL,
      FSIS_API_URL: !!process.env.FSIS_API_URL
    },
    time: new Date().toISOString()
  })
}
