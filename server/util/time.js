function getCurrentWeekDay(week) {
    week =  week-1;
    let dateOfToday = Date.now();
    let dayOfToday = (new Date().getDay() + 7 - 1) % 7;
    const date = new Date(dateOfToday +(week - dayOfToday) * 1000 * 60 * 60 * 24);
    return new Date(date.setHours(0, 0, 0, 0))
}
module.exports = {
    getCurrentWeekDay,
};