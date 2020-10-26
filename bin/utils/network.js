class Network {
    static async GetAsync(url, headers = {}, responseType = 'json') {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: headers,
            redirect: 'follow',
            referrer: 'no-referrer'
        });
        return (await Network.ProcessResponse(response, responseType));
    }
    static async PostAsync(url, body = {}, headers = {}, requestType = 'json', responseType = 'json') {
        const request = Network.ProcessBody(body, requestType);
        if (!headers['Content-Type'])
            headers['Content-Type'] = request.contentType;
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: headers,
            redirect: 'follow',
            referrer: 'no-referrer',
            body: request.body
        });
        return (await Network.ProcessResponse(response, responseType));
    }
    static ProcessBody(body, requestType) {
        let response = { body: '', contentType: '' };
        switch (requestType) {
            case 'json':
                response.body = JSON.stringify(body);
                response.contentType = 'application/json;charset=UTF-8';
                break;
            case 'form':
                var encodedBody = [];
                for (const property in body) {
                    var key = encodeURIComponent(property);
                    var value = encodeURIComponent(body[property]);
                    encodedBody.push(key + '=' + value);
                }
                response.body = encodedBody.join('&');
                response.contentType = 'application/x-www-form-urlencoded;charset=UTF-8';
            default:
                throw new Error(`Invalid request type - ${requestType}`);
        }
        return response;
    }
    static async ProcessResponse(response, responseType) {
        switch (responseType) {
            case 'json':
                return await response.json();
            case 'text':
                return await response.text();
            case 'blob':
                return await response.blob();
            default:
                throw new Error(`Invalid response type - ${responseType}`);
        }
    }
}
