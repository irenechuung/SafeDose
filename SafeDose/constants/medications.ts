export type MedicationTemplate = {
  name: string;
  commonDosages: string[];
  defaultInstructions: string;
};

export type MedicationCategory = {
  label: string;
  emoji: string;
  medications: MedicationTemplate[];
};

export const MEDICATION_CATEGORIES: MedicationCategory[] = [
  {
    label: 'Heart & Blood Pressure',
    emoji: '❤️',
    medications: [
      { name: 'Lisinopril', commonDosages: ['2.5mg', '5mg', '10mg', '20mg', '40mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Amlodipine', commonDosages: ['2.5mg', '5mg', '10mg'], defaultInstructions: 'Take once daily' },
      { name: 'Metoprolol Succinate', commonDosages: ['25mg', '50mg', '100mg', '200mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Losartan', commonDosages: ['25mg', '50mg', '100mg'], defaultInstructions: 'Take once daily' },
      { name: 'Hydrochlorothiazide', commonDosages: ['12.5mg', '25mg', '50mg'], defaultInstructions: 'Take in the morning to avoid nighttime urination' },
      { name: 'Furosemide', commonDosages: ['20mg', '40mg', '80mg'], defaultInstructions: 'Take in the morning' },
      { name: 'Carvedilol', commonDosages: ['3.125mg', '6.25mg', '12.5mg', '25mg'], defaultInstructions: 'Take with food twice daily' },
      { name: 'Valsartan', commonDosages: ['40mg', '80mg', '160mg', '320mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Ramipril', commonDosages: ['1.25mg', '2.5mg', '5mg', '10mg'], defaultInstructions: 'Take once daily' },
      { name: 'Bisoprolol', commonDosages: ['2.5mg', '5mg', '10mg'], defaultInstructions: 'Take once daily in the morning' },
      { name: 'Enalapril', commonDosages: ['2.5mg', '5mg', '10mg', '20mg'], defaultInstructions: 'Take with or without food' },
      { name: 'Spironolactone', commonDosages: ['12.5mg', '25mg', '50mg', '100mg'], defaultInstructions: 'Take with food' },
    ],
  },
  {
    label: 'Diabetes & Blood Sugar',
    emoji: '🩸',
    medications: [
      { name: 'Metformin', commonDosages: ['500mg', '850mg', '1000mg'], defaultInstructions: 'Take with food to reduce stomach upset' },
      { name: 'Glipizide', commonDosages: ['5mg', '10mg'], defaultInstructions: 'Take 30 minutes before meals' },
      { name: 'Glyburide', commonDosages: ['1.25mg', '2.5mg', '5mg'], defaultInstructions: 'Take with breakfast or first main meal' },
      { name: 'Sitagliptin (Januvia)', commonDosages: ['25mg', '50mg', '100mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Empagliflozin (Jardiance)', commonDosages: ['10mg', '25mg'], defaultInstructions: 'Take once daily in the morning' },
      { name: 'Pioglitazone', commonDosages: ['15mg', '30mg', '45mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Canagliflozin (Invokana)', commonDosages: ['100mg', '300mg'], defaultInstructions: 'Take before first meal of the day' },
      { name: 'Dapagliflozin (Farxiga)', commonDosages: ['5mg', '10mg'], defaultInstructions: 'Take once daily in the morning' },
      { name: 'Glimepiride', commonDosages: ['1mg', '2mg', '4mg'], defaultInstructions: 'Take with first main meal of the day' },
    ],
  },
  {
    label: 'Pain & Inflammation',
    emoji: '🩹',
    medications: [
      { name: 'Ibuprofen', commonDosages: ['200mg', '400mg', '600mg', '800mg'], defaultInstructions: 'Take with food or milk. Do not exceed 3200mg/day' },
      { name: 'Naproxen', commonDosages: ['250mg', '375mg', '500mg'], defaultInstructions: 'Take with food or milk' },
      { name: 'Acetaminophen', commonDosages: ['325mg', '500mg', '650mg', '1000mg'], defaultInstructions: 'Do not exceed 4000mg/day' },
      { name: 'Celecoxib', commonDosages: ['100mg', '200mg', '400mg'], defaultInstructions: 'Take with food if stomach upset occurs' },
      { name: 'Prednisone', commonDosages: ['5mg', '10mg', '20mg', '40mg'], defaultInstructions: 'Take with food in the morning' },
      { name: 'Methylprednisolone', commonDosages: ['4mg', '8mg', '16mg', '32mg'], defaultInstructions: 'Take with food' },
      { name: 'Cyclobenzaprine', commonDosages: ['5mg', '10mg'], defaultInstructions: 'May cause drowsiness. Do not drive until you know how it affects you' },
      { name: 'Tramadol', commonDosages: ['50mg', '100mg'], defaultInstructions: 'May cause drowsiness. Do not drive after taking' },
      { name: 'Gabapentin', commonDosages: ['100mg', '300mg', '400mg', '600mg'], defaultInstructions: 'Take with or without food' },
      { name: 'Diclofenac', commonDosages: ['25mg', '50mg', '75mg'], defaultInstructions: 'Take with food or milk' },
    ],
  },
  {
    label: 'Respiratory & Allergies',
    emoji: '🌬️',
    medications: [
      { name: 'Albuterol', commonDosages: ['90mcg/puff', '2.5mg/3mL'], defaultInstructions: 'Use as needed for breathing difficulty. Shake well before each use' },
      { name: 'Fluticasone (Flonase)', commonDosages: ['50mcg/spray'], defaultInstructions: 'Spray once or twice in each nostril daily' },
      { name: 'Montelukast (Singulair)', commonDosages: ['4mg', '5mg', '10mg'], defaultInstructions: 'Take in the evening' },
      { name: 'Loratadine (Claritin)', commonDosages: ['10mg'], defaultInstructions: 'Take once daily' },
      { name: 'Cetirizine (Zyrtec)', commonDosages: ['5mg', '10mg'], defaultInstructions: 'Take once daily. May cause drowsiness' },
      { name: 'Fexofenadine (Allegra)', commonDosages: ['60mg', '120mg', '180mg'], defaultInstructions: 'Take with water. Avoid fruit juice' },
      { name: 'Budesonide (Pulmicort)', commonDosages: ['180mcg', '360mcg'], defaultInstructions: 'Rinse mouth after each use' },
      { name: 'Tiotropium (Spiriva)', commonDosages: ['18mcg'], defaultInstructions: 'Inhale once daily' },
      { name: 'Ipratropium', commonDosages: ['17mcg/puff', '0.5mg/2.5mL'], defaultInstructions: 'Use as directed. Avoid contact with eyes' },
    ],
  },
  {
    label: 'Mental Health & Mood',
    emoji: '🧠',
    medications: [
      { name: 'Sertraline (Zoloft)', commonDosages: ['25mg', '50mg', '100mg', '200mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Fluoxetine (Prozac)', commonDosages: ['10mg', '20mg', '40mg', '60mg'], defaultInstructions: 'Take in the morning' },
      { name: 'Escitalopram (Lexapro)', commonDosages: ['5mg', '10mg', '20mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Bupropion (Wellbutrin)', commonDosages: ['75mg', '100mg', '150mg', '200mg', '300mg'], defaultInstructions: 'Take with food. Avoid bedtime dosing' },
      { name: 'Venlafaxine (Effexor)', commonDosages: ['37.5mg', '75mg', '150mg', '225mg'], defaultInstructions: 'Take with food' },
      { name: 'Duloxetine (Cymbalta)', commonDosages: ['20mg', '30mg', '60mg'], defaultInstructions: 'Take with food' },
      { name: 'Lithium', commonDosages: ['150mg', '300mg', '600mg'], defaultInstructions: 'Take with food and water. Monitor blood levels regularly' },
      { name: 'Quetiapine (Seroquel)', commonDosages: ['25mg', '50mg', '100mg', '200mg', '300mg'], defaultInstructions: 'Take as directed. May cause drowsiness' },
      { name: 'Aripiprazole (Abilify)', commonDosages: ['2mg', '5mg', '10mg', '15mg', '20mg', '30mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Lamotrigine (Lamictal)', commonDosages: ['25mg', '50mg', '100mg', '200mg'], defaultInstructions: 'Take twice daily with or without food' },
    ],
  },
  {
    label: 'Anxiety & Sleep',
    emoji: '😴',
    medications: [
      { name: 'Lorazepam (Ativan)', commonDosages: ['0.5mg', '1mg', '2mg'], defaultInstructions: 'May cause drowsiness. Do not drive after taking' },
      { name: 'Alprazolam (Xanax)', commonDosages: ['0.25mg', '0.5mg', '1mg', '2mg'], defaultInstructions: 'Take as directed. Do not stop abruptly' },
      { name: 'Clonazepam (Klonopin)', commonDosages: ['0.5mg', '1mg', '2mg'], defaultInstructions: 'May cause drowsiness. Avoid alcohol' },
      { name: 'Zolpidem (Ambien)', commonDosages: ['5mg', '10mg'], defaultInstructions: 'Take immediately before bedtime. Do not drive after taking' },
      { name: 'Eszopiclone (Lunesta)', commonDosages: ['1mg', '2mg', '3mg'], defaultInstructions: 'Take immediately before bed. Avoid alcohol' },
      { name: 'Trazodone', commonDosages: ['50mg', '100mg', '150mg'], defaultInstructions: 'Take at bedtime with a light snack' },
      { name: 'Melatonin', commonDosages: ['0.5mg', '1mg', '3mg', '5mg', '10mg'], defaultInstructions: 'Take 30-60 minutes before bedtime' },
      { name: 'Hydroxyzine (Vistaril)', commonDosages: ['10mg', '25mg', '50mg'], defaultInstructions: 'May cause drowsiness. Take as directed' },
      { name: 'Buspirone', commonDosages: ['5mg', '10mg', '15mg'], defaultInstructions: 'Take twice daily consistently with or without food' },
    ],
  },
  {
    label: 'Thyroid',
    emoji: '🦋',
    medications: [
      { name: 'Levothyroxine (Synthroid)', commonDosages: ['25mcg', '50mcg', '75mcg', '88mcg', '100mcg', '112mcg', '125mcg', '150mcg', '175mcg', '200mcg'], defaultInstructions: 'Take on an empty stomach 30-60 minutes before breakfast' },
      { name: 'Liothyronine (Cytomel)', commonDosages: ['5mcg', '25mcg', '50mcg'], defaultInstructions: 'Take consistently with or without food' },
      { name: 'Methimazole', commonDosages: ['5mg', '10mg', '20mg'], defaultInstructions: 'Take at the same time each day' },
      { name: 'Propylthiouracil', commonDosages: ['50mg'], defaultInstructions: 'Take three times daily at equal intervals' },
    ],
  },
  {
    label: 'Digestive & Stomach',
    emoji: '🫁',
    medications: [
      { name: 'Omeprazole (Prilosec)', commonDosages: ['10mg', '20mg', '40mg'], defaultInstructions: 'Take 30-60 minutes before eating' },
      { name: 'Pantoprazole (Protonix)', commonDosages: ['20mg', '40mg'], defaultInstructions: 'Take 30 minutes before a meal' },
      { name: 'Esomeprazole (Nexium)', commonDosages: ['20mg', '40mg'], defaultInstructions: 'Take at least 1 hour before eating' },
      { name: 'Famotidine (Pepcid)', commonDosages: ['10mg', '20mg', '40mg'], defaultInstructions: 'Take with or without food' },
      { name: 'Ondansetron (Zofran)', commonDosages: ['4mg', '8mg'], defaultInstructions: 'Take as needed for nausea' },
      { name: 'Metoclopramide', commonDosages: ['5mg', '10mg'], defaultInstructions: 'Take 30 minutes before meals' },
      { name: 'Dicyclomine', commonDosages: ['10mg', '20mg'], defaultInstructions: 'Take 30 minutes before meals' },
      { name: 'Mesalamine', commonDosages: ['400mg', '800mg', '1200mg'], defaultInstructions: 'Take with food. Do not crush or chew' },
    ],
  },
  {
    label: 'Antibiotics & Infections',
    emoji: '🦠',
    medications: [
      { name: 'Amoxicillin', commonDosages: ['250mg', '500mg', '875mg'], defaultInstructions: 'Take with or without food. Complete the full course' },
      { name: 'Azithromycin (Z-Pack)', commonDosages: ['250mg', '500mg'], defaultInstructions: 'Take with or without food. Complete the full course' },
      { name: 'Ciprofloxacin', commonDosages: ['250mg', '500mg', '750mg'], defaultInstructions: 'Take with plenty of water. Avoid dairy and antacids within 2 hours' },
      { name: 'Doxycycline', commonDosages: ['50mg', '100mg'], defaultInstructions: 'Take with food or water. Do not lie down for 30 minutes after' },
      { name: 'Amoxicillin-Clavulanate (Augmentin)', commonDosages: ['500mg', '875mg'], defaultInstructions: 'Take with food to reduce stomach upset' },
      { name: 'Trimethoprim-Sulfamethoxazole (Bactrim)', commonDosages: ['80/400mg', '160/800mg'], defaultInstructions: 'Take with a full glass of water' },
      { name: 'Metronidazole (Flagyl)', commonDosages: ['250mg', '500mg'], defaultInstructions: 'Take with food. Avoid alcohol during and 48 hours after treatment' },
      { name: 'Cephalexin (Keflex)', commonDosages: ['250mg', '500mg', '750mg'], defaultInstructions: 'Take with or without food. Complete the full course' },
      { name: 'Clindamycin', commonDosages: ['150mg', '300mg', '450mg'], defaultInstructions: 'Take with a full glass of water. Do not lie down for 30 minutes' },
      { name: 'Levofloxacin', commonDosages: ['250mg', '500mg', '750mg'], defaultInstructions: 'Take with or without food. Stay well hydrated' },
    ],
  },
  {
    label: 'Cholesterol & Lipids',
    emoji: '🫀',
    medications: [
      { name: 'Atorvastatin (Lipitor)', commonDosages: ['10mg', '20mg', '40mg', '80mg'], defaultInstructions: 'Take once daily at any time of day' },
      { name: 'Rosuvastatin (Crestor)', commonDosages: ['5mg', '10mg', '20mg', '40mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Simvastatin (Zocor)', commonDosages: ['5mg', '10mg', '20mg', '40mg'], defaultInstructions: 'Take in the evening' },
      { name: 'Pravastatin (Pravachol)', commonDosages: ['10mg', '20mg', '40mg', '80mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Ezetimibe (Zetia)', commonDosages: ['10mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Fenofibrate (TriCor)', commonDosages: ['48mg', '145mg'], defaultInstructions: 'Take with food' },
    ],
  },
  {
    label: 'Blood Thinners',
    emoji: '💉',
    medications: [
      { name: 'Warfarin (Coumadin)', commonDosages: ['1mg', '2mg', '2.5mg', '3mg', '4mg', '5mg', '6mg', '7.5mg', '10mg'], defaultInstructions: 'Take at the same time each day. Monitor INR regularly' },
      { name: 'Apixaban (Eliquis)', commonDosages: ['2.5mg', '5mg'], defaultInstructions: 'Take twice daily with or without food' },
      { name: 'Rivaroxaban (Xarelto)', commonDosages: ['10mg', '15mg', '20mg'], defaultInstructions: 'Take with evening meal' },
      { name: 'Dabigatran (Pradaxa)', commonDosages: ['75mg', '110mg', '150mg'], defaultInstructions: 'Take with or without food. Do not crush or open capsules' },
      { name: 'Clopidogrel (Plavix)', commonDosages: ['75mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Aspirin (low dose)', commonDosages: ['81mg', '325mg'], defaultInstructions: 'Take with food or milk to prevent stomach upset' },
    ],
  },
  {
    label: 'Vitamins & Supplements',
    emoji: '🌿',
    medications: [
      { name: 'Vitamin D3', commonDosages: ['400IU', '1000IU', '2000IU', '5000IU'], defaultInstructions: 'Take with food containing fat for better absorption' },
      { name: 'Vitamin B12', commonDosages: ['500mcg', '1000mcg'], defaultInstructions: 'Take with or without food' },
      { name: 'Folic Acid', commonDosages: ['400mcg', '800mcg', '1mg'], defaultInstructions: 'Take once daily with or without food' },
      { name: 'Iron (Ferrous Sulfate)', commonDosages: ['65mg', '130mg', '195mg'], defaultInstructions: 'Take on an empty stomach. Avoid tea and coffee within 1 hour' },
      { name: 'Calcium Carbonate', commonDosages: ['500mg', '600mg', '1000mg', '1200mg'], defaultInstructions: 'Take with food for best absorption' },
      { name: 'Magnesium', commonDosages: ['200mg', '250mg', '400mg', '500mg'], defaultInstructions: 'Take with food to reduce stomach upset' },
      { name: 'Potassium Chloride', commonDosages: ['8mEq', '10mEq', '20mEq'], defaultInstructions: 'Take with food after meals. Do not crush extended-release tablets' },
      { name: 'Omega-3 Fish Oil', commonDosages: ['1000mg', '2000mg'], defaultInstructions: 'Take with meals to reduce fishy aftertaste' },
    ],
  },
  {
    label: 'Neurological',
    emoji: '🧬',
    medications: [
      { name: 'Levetiracetam (Keppra)', commonDosages: ['250mg', '500mg', '750mg', '1000mg'], defaultInstructions: 'Take twice daily with or without food' },
      { name: 'Topiramate (Topamax)', commonDosages: ['25mg', '50mg', '100mg', '200mg'], defaultInstructions: 'Take with plenty of water. Avoid alcohol' },
      { name: 'Phenytoin (Dilantin)', commonDosages: ['100mg', '200mg', '300mg'], defaultInstructions: 'Take with food. Monitor drug levels regularly' },
      { name: 'Carbidopa-Levodopa (Sinemet)', commonDosages: ['10/100mg', '25/100mg', '25/250mg'], defaultInstructions: 'Take 30-60 minutes before meals' },
      { name: 'Donepezil (Aricept)', commonDosages: ['5mg', '10mg', '23mg'], defaultInstructions: 'Take at bedtime' },
      { name: 'Memantine (Namenda)', commonDosages: ['5mg', '10mg'], defaultInstructions: 'Take with or without food' },
      { name: 'Sumatriptan (Imitrex)', commonDosages: ['25mg', '50mg', '100mg'], defaultInstructions: 'Take at onset of migraine. May repeat in 2 hours if needed' },
      { name: 'Amitriptyline', commonDosages: ['10mg', '25mg', '50mg', '75mg', '100mg'], defaultInstructions: 'Take at bedtime. May cause drowsiness' },
    ],
  },
];
