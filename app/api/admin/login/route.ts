import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminCredentials } from "@/src/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const admin = body.email && body.password ? await verifyAdminCredentials(body.email, body.password) : null;
    if (!admin) return NextResponse.json({ message: "El correo o la contraseña no son correctos." }, { status: 401 });
    await createAdminSession(admin);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en inicio de sesión", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "No fue posible iniciar sesión. Intenta nuevamente." }, { status: 500 });
  }
}
