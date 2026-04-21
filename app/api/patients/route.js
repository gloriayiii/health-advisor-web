import { NextResponse } from 'next/server';

// Mock patient database (replace with real database)
const patients = [
  {
    id: '1',
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    condition: 'Hypertension',
    status: 'pending',
    requestTime: '2024-01-15 10:30',
    urgency: 'normal',
    medicalRecord: 'MR-2024-001',
    symptoms: 'Elevated blood pressure readings over the past 3 months, occasional headaches',
    medicalHistory: 'Family history of hypertension, non-smoker, moderate alcohol consumption',
    currentMedications: 'None currently',
    allergies: 'None known'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    age: 32,
    gender: 'Female',
    condition: 'Diabetes Type 2',
    status: 'urgent',
    requestTime: '2024-01-15 09:15',
    urgency: 'high',
    medicalRecord: 'MR-2024-002',
    symptoms: 'Frequent urination, increased thirst, fatigue',
    medicalHistory: 'Family history of diabetes, sedentary lifestyle',
    currentMedications: 'Metformin 500mg daily',
    allergies: 'None known'
  }
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');

    let filteredPatients = patients;

    // Filter by status if provided
    if (status) {
      filteredPatients = filteredPatients.filter(p => p.status === status);
    }

    // Filter by urgency if provided
    if (urgency) {
      filteredPatients = filteredPatients.filter(p => p.urgency === urgency);
    }

    return NextResponse.json({
      success: true,
      patients: filteredPatients,
      total: filteredPatients.length
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const patientData = await request.json();
    
    // In production, you would:
    // 1. Validate the data
    // 2. Save to database
    // 3. Generate unique ID
    // 4. Send notifications

    const newPatient = {
      id: Date.now().toString(),
      ...patientData,
      requestTime: new Date().toISOString(),
      status: 'pending'
    };

    return NextResponse.json({
      success: true,
      patient: newPatient
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
