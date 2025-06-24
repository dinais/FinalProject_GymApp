    // Helper function to get CSS class for lesson type
    const getLessonTypeClass = (type) => {
        const typeMap = {
            'CrossFit': 'lesson-type-crossfit',
            'Yoga': 'lesson-type-yoga',
            'HIIT': 'lesson-type-hiit',
            'Pilates': 'lesson-type-pilates',
            'Boxing': 'lesson-type-boxing',
            'Spinning': 'lesson-type-spinning',
            'Zumba': 'lesson-type-zumba',
            'PowerLifting': 'lesson-type-powerlifting',
            'Design & Sculpt': 'lesson-type-design-sculpt',
            'Dynamic Design': 'lesson-type-dynamic-design',
            'Moderate Pilates': 'lesson-type-moderate-pilates',
            'Senior Design': 'lesson-type-senior-design',
            'Core Strength': 'lesson-type-core-strength',
            'Aerobic & Dynamic Design': 'lesson-type-aerobic-dynamic-design',
            'Aerobic & Design': 'lesson-type-aerobic-design',
            'Strength & Fat Burn': 'lesson-type-strength-fat-burn',
            'Feldenkrais': 'lesson-type-feldenkrais',
            'Pilates Rehab': 'lesson-type-pilates-rehab',
            'Pilates & Stretch': 'lesson-type-pilates-stretch',
            'Kung Fu': 'lesson-type-kung-fu',
            'Design & Pilates': 'lesson-type-design-pilates',
            'Design HIT': 'lesson-type-design-hit',
            'Abdominal Rehab': 'lesson-type-abdominal-rehab',
            'Weight Training': 'lesson-type-weight-training',
            'Kickboxing / HIT': 'lesson-type-kickboxing-hit'
        };
        return typeMap[type] || 'lesson-type-default'; 
    };
    export default getLessonTypeClass;