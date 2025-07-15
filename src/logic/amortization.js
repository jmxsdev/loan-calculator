// src/logic/amortization.js

function calculateFrenchAmortization(amount, periods, ratePerPeriod, gracePeriods) {
    const table = [];
    let remainingAmount = amount;
    const periodsAfterGrace = periods - gracePeriods;
    
    // Grace Period Calculation
    for (let i = 1; i <= gracePeriods; i++) {
        const interest = remainingAmount * ratePerPeriod;
        table.push({
            period: i,
            payment: interest,
            interest: interest,
            principal: 0,
            remaining: remainingAmount
        });
    }

    // Regular French Amortization
    const monthlyPayment = gracePeriods < periods 
        ? amount * (ratePerPeriod * Math.pow(1 + ratePerPeriod, periodsAfterGrace)) / (Math.pow(1 + ratePerPeriod, periodsAfterGrace) - 1)
        : 0;

    for (let i = 1; i <= periodsAfterGrace; i++) {
        const interest = remainingAmount * ratePerPeriod;
        const principal = monthlyPayment - interest;
        remainingAmount -= principal;

        table.push({
            period: gracePeriods + i,
            payment: monthlyPayment,
            interest: interest,
            principal: principal,
            remaining: remainingAmount < 0.01 ? 0 : remainingAmount
        });
    }

    return table;
}

function calculateGermanAmortization(amount, periods, ratePerPeriod, gracePeriods) {
    const table = [];
    let remainingAmount = amount;
    const periodsAfterGrace = periods - gracePeriods;

    // Grace Period Calculation
    for (let i = 1; i <= gracePeriods; i++) {
        const interest = remainingAmount * ratePerPeriod;
        table.push({
            period: i,
            payment: interest,
            interest: interest,
            principal: 0,
            remaining: remainingAmount
        });
    }

    if (periodsAfterGrace <= 0 && gracePeriods > 0) return table;
    
    const principalPerPeriod = amount / periodsAfterGrace;

    for (let i = 1; i <= periodsAfterGrace; i++) {
        const interest = remainingAmount * ratePerPeriod;
        const payment = principalPerPeriod + interest;
        remainingAmount -= principalPerPeriod;

        table.push({
            period: gracePeriods + i,
            payment: payment,
            interest: interest,
            principal: principalPerPeriod,
            remaining: remainingAmount < 0.01 ? 0 : remainingAmount,
        });
    }

    return table;
}

function calculateAmericanAmortization(amount, periods, ratePerPeriod, gracePeriods) {
    const table = [];
    let remainingAmount = amount;

    // In the American system, every period (including grace period) is interest-only until the end.
    // The grace period selector doesn't have a special effect on the payment structure itself,
    // as it aligns with the loan's standard behavior.
    
    const interestPayment = amount * ratePerPeriod;

    for (let i = 1; i < periods; i++) {
        table.push({
            period: i,
            payment: interestPayment,
            interest: interestPayment,
            principal: 0,
            remaining: remainingAmount,
        });
    }

    // Last period
    if (periods > 0) {
        const lastPayment = interestPayment + amount;
        remainingAmount = 0;
        table.push({
            period: periods,
            payment: lastPayment,
            interest: interestPayment,
            principal: amount,
            remaining: remainingAmount,
        });
    }

    return table;
}


export function calculateAmortization(options) {
    const {
        amount,
        years,
        interest,
        paymentPeriod,
        amortizationType,
        gracePeriod,
    } = options;

    const periods = years * paymentPeriod;
    const ratePerPeriod = interest / 100 / paymentPeriod;
    
    // Grace period is in semesters, we need to convert to number of payments
    // 1 semester = 6 months.
    const gracePeriodsInPayments = gracePeriod * (6 / (12 / paymentPeriod));


    switch (amortizationType) {
        case 'french':
            return calculateFrenchAmortization(amount, periods, ratePerPeriod, gracePeriodsInPayments);
        case 'german':
            return calculateGermanAmortization(amount, periods, ratePerPeriod, gracePeriodsInPayments);
        case 'american':
            return calculateAmericanAmortization(amount, periods, ratePerPeriod, gracePeriodsInPayments);
        default:
            throw new Error(`Unknown amortization type: ${amortizationType}`);
    }
} 