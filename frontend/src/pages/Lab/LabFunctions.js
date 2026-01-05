export const TESTS_BY_UNIT = {
  urineTest: ['albumin', 'sugar', 'microscopic', 'reaction'],
  bloodTest: ['hivTest', 'hbsAg', 'hcv', 'esr', 'vdrlTest', 'pregnancyTest', 'bloodGroup'],
  generalExamination: ['hernia', 'varicoseVein', 'rightEye', 'leftEye'],
  systemicExamination: ['heart', 'bloodPressure', 'pulseRate'],
  otherTests: ['skin', 'cardiovascular', 'respiratory', 'nervous', 'abdominal', 'musculoskeletal'],
  fullHaemogram: [],
  liverFunction: [],
  renalFunction: [],
  heafChestTest: ['heafMantouxTest', 'chestXray'],
  laboratoryTests: ['stoolConsistency','stoolMicroscopy', 'tpha', 'venerealDisease', 'typhoid', 'hydrocele']
};

export const initialValues = {
  // Urine Test - properly structured as object
  urineTest: { 
    albumin: '', 
    sugar: '', 
    microscopic: '', 
    reaction: '' 
  },
  
  // Blood Test - already properly structured
  bloodTest: { 
    hivTest: '', 
    hbsAg: '', 
    hcv: '', 
    esr: '', 
    vdrlTest: '', 
    pregnancyTest: '', 
    bloodGroup: '' 
  },
  
  // Area1 Laboratory Tests - properly structured as object
  area1: {
    stoolConsistency: '',
    stoolMicroscopy: '',
    tpha: '',
    venerealDisease: '',
    typhoid: '',
    hydrocele: '',
    bloodGroup: ''
  },
  
  generalExamination: {
    hernia: '', 
    varicoseVein: '', 
    rightEye: '', 
    leftEye: ''
  },
  
  systemicExamination: { 
    heart: '', 
    bloodPressure: '', 
    pulseRate: ''
  },

  fullHaemogram: {
    wbc:  { value: '', units: '', status: '', range: '' },
    lym:  { value: '', units: '', status: '', range: '' },
    mid:  { value: '', units: '', status: '', range: '' },
    gran: { value: '', units: '', status: '', range: '' },
    rbc:  { value: '', units: '', status: '', range: '' },
    mcv:  { value: '', units: '', status: '', range: '' },
    hgb:  { value: '', units: '', status: '', range: '' },
    hct:  { value: '', units: '', status: '', range: '' },
    mch:  { value: '', units: '', status: '', range: '' },
    mchc: { value: '', units: '', status: '', range: '' },
    rwd:  { value: '', units: '', status: '', range: '' },
    plcr: { value: '', units: '', status: '', range: '' },
    plt:  { value: '', units: '', status: '', range: '' },
    mpv:  { value: '', units: '', status: '', range: '' },
    pct:  { value: '', units: '', status: '', range: '' },
    pdw:  { value: '', units: '', status: '', range: '' }
  },
  
  liverFunction: {
    totalBilirubin: { value: '', status: '', range: '' },
    directBilirubin: { value: '', status: '', range: '' },
    indirectBilirubin: { value: '', status: '', range: '' },
    sgot:   { value: '', status: '', range: '' },
    sgpt:  { value: '', status: '', range: '' },
    gammaGt:  { value: '', status: '', range: '' },
    alkalinePhosphate:  { value: '', status: '', range: '' },
    totalProteins:{ value: '', status: '', range: '' },
    albumin1:  { value: '', status: '', range: '' }
  }, 
  
  renalFunction: {
    urea: { value: '', status: '', range: '' },
    creatinine: { value: '', status: '', range: '' },
    fastingBloodSugar: { value: '', status: '', range: '' }
  },

  heafMantouxTest: '',
  chestXray: ''
};
  
  