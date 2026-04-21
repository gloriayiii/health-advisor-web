import { NextResponse } from 'next/server';

// Mock patient database (same as above)
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
    allergies: 'None known',
    vitalSigns: {
      bloodPressure: '150/95 mmHg',
      heartRate: '78 bpm',
      temperature: '98.6°F',
      weight: '180 lbs'
    }
  }
];

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const patient = patients.find(p => p.id === id);
    
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      patient
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    // In production, you would:
    // 1. Validate the data
    // 2. Update in database
    // 3. Log the changes
    // 4. Send notifications

    const patientIndex = patients.findIndex(p => p.id === id);
    
    if (patientIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    patients[patientIndex] = { ...patients[patientIndex], ...updateData };

    return NextResponse.json({
      success: true,
      patient: patients[patientIndex]
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update patient' },
      { status: 500 }
    );
  }
}
