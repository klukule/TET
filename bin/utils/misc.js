class Utils {
    static GetQueryParameterByName(name, url = '') {
        if (!url)
            url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'), results = regex.exec(url);
        if (!results)
            return null;
        if (!results[2])
            return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }
}
Date.prototype.toLocaleISOString = function () {
    var timezone_offset_min = this.getTimezoneOffset(), offset_hrs = parseInt(Math.abs(timezone_offset_min / 60)), offset_min = Math.abs(timezone_offset_min % 60), timezone_standard;
    if (offset_hrs < 10)
        offset_hrs = '0' + offset_hrs;
    if (offset_min < 10)
        offset_min = '0' + offset_min;
    if (timezone_offset_min < 0)
        timezone_standard = '+' + offset_hrs + ':' + offset_min;
    else if (timezone_offset_min > 0)
        timezone_standard = '-' + offset_hrs + ':' + offset_min;
    else if (timezone_offset_min == 0)
        timezone_standard = 'Z';
    var current_date = this.getDate(), current_month = this.getMonth() + 1, current_year = this.getFullYear(), current_hrs = this.getHours(), current_mins = this.getMinutes(), current_secs = this.getSeconds(), current_datetime;
    current_date = current_date < 10 ? '0' + current_date : current_date;
    current_month = current_month < 10 ? '0' + current_month : current_month;
    current_hrs = current_hrs < 10 ? '0' + current_hrs : current_hrs;
    current_mins = current_mins < 10 ? '0' + current_mins : current_mins;
    current_secs = current_secs < 10 ? '0' + current_secs : current_secs;
    current_datetime = current_year + '-' + current_month + '-' + current_date + 'T' + current_hrs + ':' + current_mins + ':' + current_secs;
    return current_datetime + timezone_standard;
};
Date.prototype.today = function () {
    return new Date(this.getFullYear(), this.getMonth(), this.getDate());
};
