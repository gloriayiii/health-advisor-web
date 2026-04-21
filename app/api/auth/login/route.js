import { NextResponse } from 'next/server';

// Mock user database (replace with real database)
const users = [
  {
    id: '1',
    username: 'doctor',
    password: 'password',
    name: 'Dr. Smith',
    role: 'doctor',
    department: 'Internal Medicine',
    email: 'doctor@hospital.com'
  }
];

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Find user in database
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // In production, you would:
    // 1. Hash passwords
    // 2. Generate JWT tokens
    // 3. Set secure HTTP-only cookies
    // 4. Connect to real database

    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token: 'mock-jwt-token' // Replace with real JWT
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}
