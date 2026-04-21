import { NextResponse } from 'next/server';

// Mock recommendations database (same as above)
const recommendations = {
  '1': {
    id: '1',
    patientId: '1',
    originalPrompt: 'Patient presents with elevated blood pressure readings over the past 3 months. Family history of hypertension. Please provide treatment recommendations.',
    recommendation: `Based on the patient's presentation and medical history, I recommend the following treatment plan...`,
    confidence: 0.87,
    generatedAt: '2024-01-15 10:30:00',
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null
  }
};

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { action, reviewNotes, modifiedRecommendation, reviewedBy } = await request.json();
    
    if (!recommendations[id]) {
      return NextResponse.json(
        { success: false, message: 'Recommendation not found' },
        { status: 404 }
      );
    }

    // Validate action
    const validActions = ['approve', 'reject', 'modify'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be approve, reject, or modify' },
        { status: 400 }
      );
    }

    // Update recommendation based on action
    const updateData = {
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'modified',
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      reviewNotes
    };

    // If modifying, update the recommendation text
    if (action === 'modify' && modifiedRecommendation) {
      updateData.recommendation = modifiedRecommendation;
    }

    recommendations[id] = {
      ...recommendations[id],
      ...updateData
    };

    // In production, you would:
    // 1. Save to database
    // 2. Send notifications
    // 3. Log audit trail
    // 4. Update patient status

    return NextResponse.json({
      success: true,
      message: `Recommendation ${action}d successfully`,
      recommendation: recommendations[id]
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to review recommendation' },
      { status: 500 }
    );
  }
}
