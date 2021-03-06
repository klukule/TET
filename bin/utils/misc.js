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
    static UpdateQueryParameterByName(name, newValue, url = '') {
        if (!url)
            url = window.location.href;
        var TheAnchor = null;
        var newAdditionalURL = "";
        var tempArray = url.split("?");
        var baseURL = tempArray[0];
        var additionalURL = tempArray[1];
        var temp = "";
        if (additionalURL) {
            var tmpAnchor = additionalURL.split("#");
            var TheParams = tmpAnchor[0];
            TheAnchor = tmpAnchor[1];
            if (TheAnchor)
                additionalURL = TheParams;
            tempArray = additionalURL.split("&");
            for (var i = 0; i < tempArray.length; i++) {
                if (tempArray[i].split('=')[0] != name) {
                    newAdditionalURL += temp + tempArray[i];
                    temp = "&";
                }
            }
        }
        else {
            var tmpAnchor = baseURL.split("#");
            var TheParams = tmpAnchor[0];
            TheAnchor = tmpAnchor[1];
            if (TheParams)
                baseURL = TheParams;
        }
        if (TheAnchor)
            newValue += "#" + TheAnchor;
        var rows_txt = temp + "" + name + "=" + newValue;
        return baseURL + "?" + newAdditionalURL + rows_txt;
    }
    static EnsureLoaderExists() {
        if (document.querySelectorAll('.loading').length == 0) {
            document.body.appendChild(DOM.CreateElement('div', { class: "loading" }, 'Loading&#8230;'));
        }
    }
    static BeginLoading() {
        Utils.EnsureLoaderExists();
        Utils._loadingCount++;
        document.querySelector('.loading').classList.toggle('hidden', Utils._loadingCount == 0);
    }
    static EndLoading() {
        Utils.EnsureLoaderExists();
        Utils._loadingCount--;
        document.querySelector('.loading').classList.toggle('hidden', Utils._loadingCount == 0);
    }
}
Utils._loadingCount = 0;
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
