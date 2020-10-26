// Made by Lukáš 'klukule' Jech at Pozitron Group s.r.o. © 2018-2020

type NetworkRequestType = 'json' | 'form';
type NetworkResponseType = 'json' | 'text' | 'blob';
type NetworkHeaders = { [key: string]: string };

/**
 * Set of fetch wrappers
 */
class Network {
    /**
     * Peforms GET request to specific url
     * @param url The URL
     * @param headers Additional headers
     * @param responseType Expected type of response
     */
    public static async GetAsync<T>(
        url: string,
        headers: NetworkHeaders = {},
        responseType: NetworkResponseType = 'json'
    ): Promise<T> {

        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: headers,
            redirect: 'follow',
            referrer: 'no-referrer'
        });

        return <T>(await Network.ProcessResponse(response, responseType));
    }

    /**
     * Performs POST request to specific url with specific body
     * @param url The URL
     * @param body The body object
     * @param headers Additional headers (Content-Type added if none specified as dictated by requestType argument)
     * @param requestType Type of request
     * @param responseType Expected type of response
     */
    public static async PostAsync<T>(
        url: string,
        body: {} = {},
        headers: NetworkHeaders = {},
        requestType: NetworkRequestType = 'json',
        responseType: NetworkResponseType = 'json'
    ): Promise<T> {
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

        return <T>(await Network.ProcessResponse(response, responseType));
    }

    /**
     * Processes input body based on request type and returns string encoded form and specific content type for selected method
     * @param body The body
     * @param requestType Request type
     */
    private static ProcessBody(body: {}, requestType: NetworkRequestType): { body: string, contentType: string } {
        let response = { body: '', contentType: '' };
        switch (requestType) {
            case 'json':
                response.body = JSON.stringify(body);
                response.contentType = 'application/json;charset=UTF-8'
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

    /**
     * Processes the fetch response based on selected type and thorws exception for invalid type
     * @param response Fetch response
     * @param responseType Response type
     */
    private static async ProcessResponse(response: Response, responseType: NetworkResponseType): Promise<any> {
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