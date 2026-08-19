import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { token } = await request.json();
    
    if (!token || typeof token !== "string") {
      return NextResponse.json({ valid: false, error: "الرجاء إدخال رمز الإدارة." }, { status: 400 });
    }
    
    const adminToken = process.env.ADMIN_TOKEN;
    
    if (!adminToken) {
      return NextResponse.json({ valid: false, error: "الخادم غير مهيأ — ADMIN_TOKEN غير مُعرّف." }, { status: 500 });
    }
    
    if (token !== adminToken) {
      return NextResponse.json({ valid: false, error: "الرمز غير صحيح. حاول مجددًا." }, { status: 401 });
    }
    
    return NextResponse.json({ valid: true });
  } catch (e) {
    return NextResponse.json({ valid: false, error: "حدث خطأ أثناء التحقق." }, { status: 500 });
  }
}
