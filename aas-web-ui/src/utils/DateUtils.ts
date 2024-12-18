// convert js date object to string (format: yyyy-MM-dd HH:mm:ss)
export function formatDate(date: Date) {
    return (
        [date.getFullYear(), padTo2Digits(date.getMonth() + 1), padTo2Digits(date.getDate())].join('-') +
        ' ' +
        [padTo2Digits(date.getHours()), padTo2Digits(date.getMinutes()), padTo2Digits(date.getSeconds())].join(':')
    );
}

// convert date element to digits
function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
}
