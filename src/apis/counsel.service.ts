import { createSupabaseBrowserClient } from '@/supabase/supabase-client';

export const fetchAllCounsel = async () => {
    const supabase = createSupabaseBrowserClient();
  
    try {
      const { data, error } = await supabase
        .from('counsel')
        .select(
          '*'
        );
  
      if (error) {
        console.error('Error fetching counsel data:', error.message);
        throw new Error('Failed to fetch counsel data.');
      }
  
      // Map the data for frontend-friendly consumption
      const mappedData = data.map((counsel) => ({
        id: counsel.counsel_id,
        title: counsel.title || 'No title provided',
        cost: counsel.cost || 0,
        status: counsel.counsel_status || 'pending',
        startDate: counsel.start_date,
        dueDate: counsel.due_date,
        skills: counsel.skill || [],
        field: counsel.feild || 'Unknown field',
        outline: counsel.outline || 'No outline provided',
        clientId: counsel.client_id || null,
      }));
  
      return mappedData;
    } catch (error) {
      console.error('Unexpected error while fetching counsel data:', error);
      throw error;
    }
  };

/**
 * Fetches counsel data by ID and includes the related client information.
 * @param counselId - The ID of the counsel to fetch.
 * @returns An object containing counsel and client data.
 */
export const fetchCounselWithClient = async (counselId: number) => {
  const supabase = createSupabaseBrowserClient();

  console.log('Fetching counsel with ID:', counselId);

  try {
    // Step 1: Fetch counsel data by counsel_id
    const { data: counsel, error: counselError } = await supabase
      .from('counsel')
      .select('*') // Select all fields from the counsel table
      .eq('counsel_id', counselId)
      .single();

    if (counselError) {
      console.error('Error fetching counsel data:', counselError.message);
      throw new Error('Failed to fetch counsel data.');
    }

    if (!counsel) {
      console.warn(`No counsel found for counsel_id ${counselId}`);
      return null; // Return null if no counsel is found
    }

    console.log('Counsel data fetched:', counsel);

    // Step 2: Fetch client data using client_id
    const clientId = counsel.client_id;
    let client = null;

    if (clientId) {
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('*') // Select all fields from the client table
        .eq('client_id', clientId)
        .single();

      if (clientError) {
        console.error('Error fetching client data:', clientError.message);
        throw new Error('Failed to fetch client data.');
      }

      client = {
        id: clientData.client_id,
        name: clientData.company_name || 'Unknown Company',
        email: clientData.email || 'Unknown Email',
        contact: clientData.contact_info || 'Unknown Contact',
      };

      console.log('Client data fetched:', client);
    } else {
      console.warn('No client_id found in the counsel data.');
    }

    // Step 3: Combine and return counsel and client data
    return {
      counsel: {
        id: counsel.counsel_id,
        title: counsel.title || 'No title',
        cost: counsel.cost || 0,
        status: counsel.counsel_status || 'pending',
        startDate: counsel.start_date,
        dueDate: counsel.due_date,
        skills: counsel.skill || [],
        field: counsel.feild || 'Unknown',
        outline: counsel.outline || '',
      },
      client: client || {
        id: null,
        name: 'Unknown Company',
        email: 'Unknown Email',
        contact: 'Unknown Contact',
      },
    };
  } catch (error) {
    console.error('Unexpected error occurred while fetching data:', error);
    throw error;
  }
};
