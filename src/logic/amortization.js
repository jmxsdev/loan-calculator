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
    const periodsAfterGrace = periods - gracePeriods;

    // Dead Period Calculation
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
    
    // Grace Period Calculation
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

    // Regular French Amortization
    const monthlyPayment = gracePeriods < periods 
        ? amount * (ratePerPeriod * Math.pow(1 + ratePerPeriod, periodsAfterGrace)) / (Math.pow(1 + ratePerPeriod, periodsAfterGrace) - 1)
        : 0;

    for (let i = 1; i <= periodsAfterGrace; i++) {
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
    const periodsAfterGrace = periods - gracePeriods;

    // Dead Period Calculation
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

    // Grace Period Calculation
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

    if (periodsAfterGrace <= 0 && gracePeriods > 0) return table;
    
    const principalPerPeriod = amount / periodsAfterGrace;

    for (let i = 1; i <= periodsAfterGrace; i++) {
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

    // Dead Period Calculation
    for (let i = 1; i <= deadPeriods; i++) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        table.push({
            period: i,
            paymentDate: new Date(paymentDate),
            payment: 0,
            interest: 0,
            principal: 0,
            remaining: remainingAmount,
        });
    }

    const interestPayment = amount * ratePerPeriod;

    // Interest-only periods
    for (let i = 1; i < periods; i++) {
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

    // Last period
    if (periods > 0) {
        paymentDate = getNextPaymentDate(paymentDate, paymentPeriod);
        const lastPayment = interestPayment + amount;
        remainingAmount = 0;
        table.push({
            period: deadPeriods + periods,
            paymentDate: new Date(paymentDate),
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
        duration,
        durationUnit,
        interest,
        paymentPeriod,
        amortizationType,
        gracePeriodDuration,
        gracePeriodUnit,
        deadPeriod,
        grantDate,
    } = options;

    let totalYears;
    switch (durationUnit) {
        case 'days':
            totalYears = duration / 365;
            break;
        case 'weeks':
            totalYears = duration / 52;
            break;
        case 'months':
            totalYears = duration / 12;
            break;
        case 'years':
        default:
            totalYears = duration;
            break;
    }

    let gracePeriodInYears;
    switch (gracePeriodUnit) {
        case 'days':
            gracePeriodInYears = gracePeriodDuration / 365;
            break;
        case 'weeks':
            gracePeriodInYears = gracePeriodDuration / 52;
            break;
        case 'months':
            gracePeriodInYears = gracePeriodDuration / 12;
            break;
        case 'years':
        default:
            gracePeriodInYears = gracePeriodDuration;
            break;
    }

    const periods = Math.round(totalYears * paymentPeriod);
    const ratePerPeriod = interest / 100 / paymentPeriod;
    
    const gracePeriodsInPayments = Math.round(gracePeriodInYears * paymentPeriod);

    // Dead periods are in semesters, we need to convert to number of payments
    const monthsPerPayment = 12 / paymentPeriod;
    const deadPeriodsInPayments = deadPeriod * (6 / monthsPerPayment);


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