// Made by Lukáš 'klukule' Jech at Pozitron Group s.r.o. © 2018-2020

/**
 * Random assortment of utils
 */
class Utils {
    /**
     * Gets specified parameter from url query
     * @param name Parameter name
     * @param url url to pick from (or window.location.href if none specified)
     */
    public static GetQueryParameterByName(name: string, url: string = ''): string | null {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);

        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
}
////////////////////////
// Date extensions
////////////////////////

/**
 * Date object extension declaration
 */
declare interface Date {
    toLocaleISOString: () => string;
    today: () => Date;
}

/**
 * Returns date in string format according to ISO 8601 with embedded timezone offset instead of UTC conversion
 * Format is YYYY-MM-DDTHH:MM:SS±HH:MM or Z if timezone == UTC
 */
Date.prototype.toLocaleISOString = function () {
    // NOTE: This method is ported from older javascript library, 
    // thus on some places <any> is used to prevent typescript from crying because we change data types

    var timezone_offset_min = this.getTimezoneOffset(),
        offset_hrs = <any>parseInt(<any>Math.abs(timezone_offset_min / 60)),
        offset_min = <any>Math.abs(timezone_offset_min % 60),
        timezone_standard;

    if (offset_hrs < 10)
        offset_hrs = '0' + offset_hrs;

    if (offset_min < 10)
        offset_min = '0' + offset_min;

    // Add an opposite sign to the offset
    // If offset is 0, it means timezone is UTC
    if (timezone_offset_min < 0)
        timezone_standard = '+' + offset_hrs + ':' + offset_min;
    else if (timezone_offset_min > 0)
        timezone_standard = '-' + offset_hrs + ':' + offset_min;
    else if (timezone_offset_min == 0)
        timezone_standard = 'Z';

    var current_date = this.getDate(),
        current_month = this.getMonth() + 1,
        current_year = this.getFullYear(),
        current_hrs = this.getHours(),
        current_mins = this.getMinutes(),
        current_secs = this.getSeconds(),
        current_datetime;

    // Add 0 before date, month, hrs, mins or secs if they are less than 0
    current_date = current_date < 10 ? '0' + current_date : current_date;
    current_month = current_month < 10 ? '0' + current_month : current_month;
    current_hrs = current_hrs < 10 ? '0' + current_hrs : current_hrs;
    current_mins = current_mins < 10 ? '0' + current_mins : current_mins;
    current_secs = current_secs < 10 ? '0' + current_secs : current_secs;

    // Current datetime
    // String such as 2016-07-16T19:20:30
    current_datetime = current_year + '-' + current_month + '-' + current_date + 'T' + current_hrs + ':' + current_mins + ':' + current_secs;
    return current_datetime + timezone_standard;
}

/**
 * Returns today (strips time and returns date only)
 */
Date.prototype.today = function () {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate());
}