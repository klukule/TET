// Made by Lukáš 'klukule' Jech at Pozitron Group s.r.o. © 2018-2020

/**
 * Set of DOM helpers
 */
class DOM {

    /**
     * Wrapper around html createElement with simplified event listener binding and children appending
     * @param type html element type
     * @param attributes list of attributes (class, style etc..), event listeners (for example 'onclick', 'onhover')
     * @param children List of children to append in created element
     */
    public static CreateElement(type: string, attributes: {} = {}, ...children: (Node | String | Number)[]): HTMLElement {
        const elem = document.createElement(type);
        for (const attr of Object.keys(attributes)) {
            if (attributes[attr] instanceof Function)
                elem.addEventListener(attr.substr(2).toLocaleLowerCase(), attributes[attr]);
            else
                elem.setAttribute(attr, attributes[attr]);
        }
        for (const child of children)
            if (child instanceof Node)
                elem.appendChild(child);
            else if (child instanceof String || typeof child == "string" || child instanceof Number || typeof child == "number")
                elem.appendChild(document.createTextNode(child.toString()));

        return elem;
    }
}