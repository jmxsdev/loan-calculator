// src/logic/amortization.js

function getNextPaymentDate(currentDate, paymentPeriod) {
    const date = new Date(currentDate);
    const monthsToAdd = 12 / paymentPeriod;
    date.setMonth(date.getMonth() + monthsToAdd);
    return date;
}

function calculateFrenchAmortization(amount, periods, ratePerPeriod, gracePeriods, deadPeriods, grantDate, paymentPeriod) {
    const table = [];
    let remainingAmount = amount;
    let paymentDate = new Date(grantDate);
    
    // Dead Period Calculation (no payments)
    for (let i = 1; i <= deadPeriods; i++) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        table.push({
            period: i,
            paymentDate: new Date(paymentDate),
            payment: 0,
            interest: 0,
            principal: 0,
            remaining: remainingAmount
        });
    }
    
    // Grace Period Calculation (interest-only payments)
    for (let i = 1; i <= gracePeriods; i++) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        const interest = remainingAmount * ratePerPeriod;
        table.push({
            period: deadPeriods + i,
            paymentDate: new Date(paymentDate),
            payment: interest,
            interest: interest,
            principal: 0,
            remaining: remainingAmount
        });
    }

    // Regular French Amortization (principal + interest)
    const regularPaymentPeriods = periods - gracePeriods - deadPeriods;
    const monthlyPayment = regularPaymentPeriods > 0 
        ? amount * (ratePerPeriod * Math.pow(1 + ratePerPeriod, regularPaymentPeriods)) / (Math.pow(1 + ratePerPeriod, regularPaymentPeriods) - 1)
        : 0;

    for (let i = 1; i <= regularPaymentPeriods; i++) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        const interest = remainingAmount * ratePerPeriod;
        const principal = monthlyPayment - interest;
        remainingAmount -= principal;

        table.push({
            period: deadPeriods + gracePeriods + i,
            paymentDate: new Date(paymentDate),
            payment: monthlyPayment,
            interest: interest,
            principal: principal,
            remaining: remainingAmount < 0.01 ? 0 : remainingAmount
        });
    }

    return table;
}

function calculateGermanAmortization(amount, periods, ratePerPeriod, gracePeriods, deadPeriods, grantDate, paymentPeriod) {
    const table = [];
    let remainingAmount = amount;
    let paymentDate = new Date(grantDate);
    const regularPaymentPeriods = periods - gracePeriods - deadPeriods;

    // Dead Period
    for (let i = 1; i <= deadPeriods; i++) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        table.push({ period: i, paymentDate: new Date(paymentDate), payment: 0, interest: 0, principal: 0, remaining: remainingAmount });
    }

    // Grace Period
    for (let i = 1; i <= gracePeriods; i++) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        const interest = remainingAmount * ratePerPeriod;
        table.push({ period: deadPeriods + i, paymentDate: new Date(paymentDate), payment: interest, interest: interest, principal: 0, remaining: remainingAmount });
    }

    if (regularPaymentPeriods <= 0) return table;
    
    const principalPerPeriod = amount / regularPaymentPeriods;

    for (let i = 1; i <= regularPaymentPeriods; i++) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        const interest = remainingAmount * ratePerPeriod;
        const payment = principalPerPeriod + interest;
        remainingAmount -= principalPerPeriod;

        table.push({
            period: deadPeriods + gracePeriods + i,
            paymentDate: new Date(paymentDate),
            payment: payment,
            interest: interest,
            principal: principalPerPeriod,
            remaining: remainingAmount < 0.01 ? 0 : remainingAmount,
        });
    }

    return table;
}

function calculateAmericanAmortization(amount, periods, ratePerPeriod, gracePeriods, deadPeriods, grantDate, paymentPeriod) {
    const table = [];
    let remainingAmount = amount;
    let paymentDate = new Date(grantDate);

    // Dead Period (no payments)
    for (let i = 1; i <= deadPeriods; i++) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        table.push({ period: i, paymentDate: new Date(paymentDate), payment: 0, interest: 0, principal: 0, remaining: remainingAmount });
    }

    const interestPayment = amount * ratePerPeriod;
    // In American system, grace period is indistinguishable from regular periods, all are interest-only.
    const interestOnlyPaymentPeriods = periods - deadPeriods - 1;

    // Interest-only periods
    for (let i = 1; i <= interestOnlyPaymentPeriods; i++) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        table.push({
            period: deadPeriods + i,
            paymentDate: new Date(paymentDate),
            payment: interestPayment,
            interest: interestPayment,
            principal: 0,
            remaining: remainingAmount,
        });
    }

    // Last period (principal + interest)
    if (periods - deadPeriods > 0) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        const lastPayment = interestPayment + amount;
        table.push({
            period: periods,
            paymentDate: new Date(paymentDate),
            payment: lastPayment,
            interest: interestPayment,
            principal: amount,
            remaining: 0,
        });
    }

    return table;
}


export function calculateAmortization(options) {
    const {
        amount,
        duration,
        durationUnit,
        interest,
        paymentPeriod,
        amortizationType,
        gracePeriodDuration,
        gracePeriodUnit,
        deadPeriodDuration,
        deadPeriodUnit,
        grantDate,
    } = options;

    // Convert all durations to a consistent unit (years) for calculation
    let totalYears;
    switch (durationUnit) {
        case 'days': totalYears = duration / 365; break;
        case 'weeks': totalYears = duration / 52; break;
        case 'months': totalYears = duration / 12; break;
        default: totalYears = duration; break;
    }

    let gracePeriodInYears;
    switch (gracePeriodUnit) {
        case 'days': gracePeriodInYears = gracePeriodDuration / 365; break;
        case 'weeks': gracePeriodInYears = gracePeriodDuration / 52; break;
        case 'months': gracePeriodInYears = gracePeriodDuration / 12; break;
        default: gracePeriodInYears = gracePeriodDuration; break;
    }

    let deadPeriodInYears;
    switch (deadPeriodUnit) {
        case 'days': deadPeriodInYears = deadPeriodDuration / 365; break;
        case 'weeks': deadPeriodInYears = deadPeriodDuration / 52; break;
        case 'months': deadPeriodInYears = deadPeriodDuration / 12; break;
        default: deadPeriodInYears = deadPeriodDuration; break;
    }

    // Calculate total number of payment periods for the loan's lifetime
    const periods = Math.round(totalYears * paymentPeriod);
    const gracePeriodsInPayments = Math.round(gracePeriodInYears * paymentPeriod);
    const deadPeriodsInPayments = Math.round(deadPeriodInYears * paymentPeriod);

    const ratePerPeriod = interest / 100 / paymentPeriod;

    switch (amortizationType) {
        case 'french':
            return calculateFrenchAmortization(amount, periods, ratePerPeriod, gracePeriodsInPayments, deadPeriodsInPayments, grantDate, paymentPeriod);
        case 'german':
            return calculateGermanAmortization(amount, periods, ratePerPeriod, gracePeriodsInPayments, deadPeriodsInPayments, grantDate, paymentPeriod);
        case 'american':
            return calculateAmericanAmortization(amount, periods, ratePerPeriod, gracePeriodsInPayments, deadPeriodsInPayments, grantDate, paymentPeriod);
        default:
            throw new Error(`Unknown amortization type: ${amortizationType}`);
    }
}
