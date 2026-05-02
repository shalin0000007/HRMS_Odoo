/**
 * EmPay — Professional Tax Slab Lookup
 * Source: Indian state PT schedules (research confirmed)
 *
 * Maharashtra slabs (most common):
 *   ₹0      – ₹7,500   → ₹0
 *   ₹7,501  – ₹10,000  → ₹175  (female employees: ₹0)
 *   ₹10,001 – ₹15,000  → ₹175
 *   > ₹15,000           → ₹200  (max under any Indian state is ₹2,500/yr)
 *
 * States without PT: Delhi, Haryana, Rajasthan, UP (return 0)
 */

const PT_SLABS = {
  Maharashtra: (gross, gender) => {
    if (gross <= 7500)  return 0;
    if (gross <= 10000) return gender === 'female' ? 0 : 175;
    if (gross <= 15000) return 175;
    return 200;
  },

  Karnataka: (gross) => {
    if (gross <= 15000) return 0;
    if (gross <= 25000) return 150;
    if (gross <= 35000) return 200;
    if (gross <= 45000) return 300;
    if (gross <= 75000) return 450;
    return 600;
  },

  TamilNadu: (gross) => {
    if (gross <= 21000) return 0;
    if (gross <= 30000) return 135;
    if (gross <= 45000) return 315;
    if (gross <= 60000) return 690;
    if (gross <= 75000) return 1025;
    if (gross <= 100000) return 1250;
    return 2500;
  },

  WestBengal: (gross) => {
    if (gross <= 10000) return 0;
    if (gross <= 15000) return 110;
    if (gross <= 25000) return 130;
    if (gross <= 40000) return 150;
    return 200;
  },

  Gujarat: (gross) => {
    if (gross <= 12000) return 0;
    return 200;
  },

  AndhraPradesh: (gross) => {
    if (gross <= 15000) return 0;
    if (gross <= 20000) return 150;
    if (gross <= 25000) return 200;
    return 200;
  },

  Telangana: (gross) => {
    if (gross <= 15000) return 0;
    if (gross <= 20000) return 150;
    return 200;
  },

  // States with no Professional Tax
  Delhi:     () => 0,
  Haryana:   () => 0,
  Rajasthan: () => 0,
  UP:        () => 0,
  Punjab:    () => 0,
};

/**
 * @param {number} grossMonthly - Monthly gross salary in INR
 * @param {string} state        - State name (default: 'Maharashtra')
 * @param {string} gender       - 'male' | 'female' | 'other' (affects Maharashtra slab)
 * @returns {number} PT deduction for the month in INR
 */
function getProfessionalTax(grossMonthly, state = 'Maharashtra', gender = 'other') {
  const slabFn = PT_SLABS[state] || PT_SLABS['Maharashtra'];
  return slabFn(grossMonthly, gender);
}

module.exports = { getProfessionalTax, PT_SLABS };
