module.exports = {
    prompts: {
        prompt1: `Behave like a hypothetical doctor tasked with providing 5 hypothesis diagnosis for a patient based on their description. Your goal is to generate a list of 5 potential diseases, each with a short description, and indicate which symptoms the patient has in common with the proposed disease and which symptoms the patient does not have in common.

        Carefully analyze the patient description and consider various potential diseases that could match the symptoms described. For each potential disease:
        1. Provide a brief description of the disease
        2. List the symptoms that the patient has in common with the disease
        3. List the symptoms that the patient has that are not in common with the disease
        
        Present your findings in a JSON format within XML tags. The JSON should contain the following keys for each of the 5 potential disease:
        - "diagnosis": The name of the potential disease
        - "description": A brief description of the disease
        - "symptoms_in_common": An array of symptoms the patient has that match the disease
        - "symptoms_not_in_common": An array of symptoms the patient has that are not in common with the disease
        
        Here's an example of how your output should be structured:
        
        <5_diagnosis_output>
        [
        {
            "diagnosis": "some disease 1",
            "description": "some description",
            "symptoms_in_common": ["symptom1", "symptom2", "symptomN"],
            "symptoms_not_in_common": ["symptom1", "symptom2", "symptomN"]
        },
        ...
        {
            "diagnosis": "some disease 5",
            "description": "some description",
            "symptoms_in_common": ["symptom1", "symptom2", "symptomN"],
            "symptoms_not_in_common": ["symptom1", "symptom2", "symptomN"]
        }
        ]
        </5_diagnosis_output>
        
        Present your final output within <5_diagnosis_output> tags as shown in the example above.
        
        Here is the patient description:
        <patient_description>
        {{description}}
        </patient_description>`,
        prompt2: `Behave like a hypothetical doctor tasked with providing 5 hypothesis diagnosis for a patient based on their description and a list of 5 potential diseases. Your goal is to generate a list of 5 new potential diseases, each with a short description, and indicate which symptoms the patient has in common with the proposed disease and which symptoms the patient does not have in common.

        Carefully analyze the patient description and consider various potential diseases that could match the symptoms described. For each potential disease:
        1. Provide a brief description of the disease
        2. List the symptoms that the patient has in common with the disease
        3. List the symptoms that the patient has that are not in common with the disease
        
        Present your findings in a JSON format within XML tags. The JSON should contain the following keys for each of the 5 potential disease:
        - "diagnosis": The name of the potential disease
        - "description": A brief description of the disease
        - "symptoms_in_common": An array of symptoms the patient has that match the disease
        - "symptoms_not_in_common": An array of symptoms the patient has that are not in common with the disease
        
        Here's an example of how your output should be structured:
        
        <5_diagnosis_output>
        [
        {
            "diagnosis": "some disease 6",
            "description": "some description",
            "symptoms_in_common": ["symptom1", "symptom2", "symptomN"],
            "symptoms_not_in_common": ["symptom1", "symptom2", "symptomN"]
        },
        ...
        {
            "diagnosis": "some disease 10",
            "description": "some description",
            "symptoms_in_common": ["symptom1", "symptom2", "symptomN"],
            "symptoms_not_in_common": ["symptom1", "symptom2", "symptomN"]
        }
        ]
        </5_diagnosis_output>
        
        Present your final output within <5_diagnosis_output> tags as shown in the example above.
        
        Here is the patient description:
        <patient_description>
        {{description}}
        </patient_description>

        The list of already suggested diseases is:
        <diseases_list>
        {{diseases_list}}
        </diseases_list>`
    }
}