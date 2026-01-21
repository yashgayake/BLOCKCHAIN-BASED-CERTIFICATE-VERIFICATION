import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing certificate image for extraction...');

    // Call Gemini Vision API via Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert document parser. Extract certificate information from the provided image.
            
Extract the following fields if visible:
- studentName: Full name of the student
- enrollmentNumber: Student ID, Roll Number, or Enrollment Number
- course: Course name, Program, or Degree (e.g., B.Tech, MBA, etc.)
- institution: University, College, or Institution name
- issueYear: Year the certificate was issued (just the 4-digit year)

Return ONLY a valid JSON object with these exact keys. If a field is not visible or unclear, use an empty string.
Example: {"studentName": "John Doe", "enrollmentNumber": "2024001", "course": "B.Tech Computer Science", "institution": "ABC University", "issueYear": "2024"}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract certificate details from this image. Return only JSON, no explanation.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI processing failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('AI Response received:', JSON.stringify(aiResponse));

    const content = aiResponse.choices?.[0]?.message?.content || '';
    console.log('Extracted content:', content);

    // Parse the JSON from AI response
    let extractedData = {
      studentName: '',
      enrollmentNumber: '',
      course: '',
      institution: '',
      issueYear: new Date().getFullYear().toString()
    };

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extractedData = {
          studentName: parsed.studentName || '',
          enrollmentNumber: parsed.enrollmentNumber || '',
          course: parsed.course || '',
          institution: parsed.institution || '',
          issueYear: parsed.issueYear || new Date().getFullYear().toString()
        };
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Return partial data if parsing fails
    }

    console.log('Final extracted data:', extractedData);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Extract certificate error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
