import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createUserWithPassword, findUserByEmail } from '@/lib/userRepository';
import { getSiteSettings } from '@/lib/siteSettings';

const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = withApiObservability(async (request: NextRequest) => {
  try {
    const settings = await getSiteSettings();
    if (!settings.registrationEnabled) {
      return NextResponse.json(
        { error: 'Chức năng đăng ký đang tạm tắt. Vui lòng quay lại sau.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH || !PASSWORD_PATTERN.test(password)) {
      return NextResponse.json(
        { error: 'Mật khẩu cần tối thiểu 8 ký tự, gồm chữ và số' },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUserWithPassword({ name, email, passwordHash });

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
});
